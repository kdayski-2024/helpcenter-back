const db = require("../database")
const empty = require("is-empty")
const Translator = require("./translator")
const currency = require("./currency")
const Grade = require("./grade")
console.log(Grade)
const debug = require("debug")("catalog")
const CatalogLib = {
    getCatalogItems: (data) => {
        debug("getCatalogItems")
        return new Promise(async (resolve, reject) => {
            let { catalogIds, rawCatalog, userId, lang, userGrades, options } = data
            if (empty(userGrades)) {
                const grade = new Grade(userId)
                await grade.init()
                userGrades = await grade.getUserActiveGradeIds({ lang, userId })
            }
            if (!empty(catalogIds)) {
                let catalog = await db.models.Catalog.findAndCountAll({
                    where: { id: catalogIds },
                    order: [["id", "ASC"]],
                    raw: false,
                })
                rawCatalog = catalog.rows.map((c) => c.dataValues)
            } else {
                catalogIds = rawCatalog.map((c) => c.id)
            }
            rawCatalog = await Translator.translateArray({ modelName: db.models.Catalog.name, data: rawCatalog, lang })
            const user = await db.models.User.findOne({ where: { id: userId } })
            const globalUserId = user.userId
            const catalogUser = db.models.CatalogUser.findAll({
                where: {
                    [db.Op.or]: [{ userId }, { globalUserId }],
                },
            })
            let courseIds = []
            let programIds = []
            rawCatalog.forEach((catalogItem) => {
                if (catalogItem.type === 1) {
                    if (!empty(catalogItem.program)) programIds = [...new Set([...programIds, ...catalogItem.program])]
                } else {
                    if (!empty(catalogItem.course)) courseIds = [...new Set([...courseIds, ...catalogItem.course])]
                }
            })
            const attributes = ["id", "desc", "title", "image"]
            // TODO OPTIMISE REQUESTS
            let programs = await db.models.Program.findAll({ where: { id: programIds }, attributes })
            programs = await Translator.translateArray({ modelName: db.models.Program.name, data: programs, lang })
            let courses = await db.models.Course.findAll({ where: { id: courseIds }, attributes })
            courses = await Translator.translateArray({ modelName: db.models.Course.name, data: courses, lang })
            // Fill data
            const validGrade = (catalogItem) => {
                catalogItem.access = false
                if (catalogItem.visibleInGradeZero) {
                    catalogItem.access = userGrades.length == 0
                } else {
                }
                if (!empty(catalogItem.visibleInGrade)) {
                    if (catalogItem.visibleInGrade.some((r) => userGrades.includes(r))) {
                        catalogItem.access = true
                    }
                } else {
                    if (!catalogItem.visibleInGradeZero) catalogItem.access = true
                }
            }
            let langInt = Translator.langToInt(lang)
            rawCatalog.forEach((catalogItem, index) => {
                let findItem
                catalogItem = currency.convert({ data: catalogItem, lang })

                if (!empty(catalogItem.visibleInLang)) {
                    if (catalogItem.visibleInLang.includes(langInt)) {
                        validGrade(catalogItem)
                    }
                } else {
                    validGrade(catalogItem)
                }

                if (catalogItem.type === 1) {
                    findItem = Object.values(programs).find((obj) => {
                        return obj.id == catalogItem.program[0]
                    })
                } else {
                    findItem = Object.values(courses).find((obj) => {
                        return obj.id == catalogItem.course[0]
                    })
                }
                delete findItem.id
                rawCatalog[index] = { ...catalogItem, ...findItem }
            })
            // RECALCULATE PRICES
            rawCatalog = await CatalogLib.calculatePrices({ catalog: rawCatalog, userId, userGrades, lang })

            let catalogFavorite = db.models.CatalogFavorite.findAll({ where: { userId, catalogId: catalogIds } })

            catalogUser.then(async (alreadyHasCatalogItem) => {
                catalogFavorite.then((favorite) => {
                    let catalogFavoriteIds = favorite.map((c) => c.catalogId)
                    let alreadyHasCatalogIds = alreadyHasCatalogItem.map((item) => item.catalogId)
                    rawCatalog.forEach((catalogItem) => {
                        if (!empty(catalogItem.buyUrl)) {
                            catalogItem.buyUrl = catalogItem.buyUrl.replace("{lang}", lang)
                        }
                        if (!empty(catalogItem.tags)) catalogItem.tags = catalogItem.tags.split(", ")
                        catalogItem.alreadyHas = ~alreadyHasCatalogIds.indexOf(catalogItem.id) ? true : false
                        catalogItem.favorite = ~catalogFavoriteIds.indexOf(catalogItem.id) ? true : false
                        catalogItem.accessExpired = false
                        if (catalogItem.alreadyHas) {
                            const findedAlreadyHas = alreadyHasCatalogItem.find((c) => c.catalogId == catalogItem.id)
                            if (!empty(findedAlreadyHas) && new Date(findedAlreadyHas.end) < new Date()) {
                                catalogItem.accessExpired = true
                            }
                        }
                        // !HOTFIX
                        if (lang == "ru") catalogItem.ableToSale = false
                    })
                    resolve(rawCatalog)
                })
            })
        })
    },
    addCatalogItemToUser: async (params) => {
        return new Promise(async (resolve) => {
            debug("addCatalogItemToUser")
            let { catalogId, globalUserId, userId, lang, catalogItem = null } = params
            if (empty(catalogItem)) {
                const catalogItems = await CatalogLib.getCatalogItems({ catalogIds: [catalogId], userId, lang })
                catalogItem = catalogItems[0]
            }
            const catalogUser = await db.models.CatalogUser.findOne({ where: { globalUserId, catalogId } })

            let catalogItemStart, catalogItemEnd
            if (!empty(catalogItem.accessDuration)) {
                catalogItemStart = new Date()
                catalogItemEnd = new Date()
                catalogItemEnd.setDate(catalogItemEnd.getDate() + catalogItem.accessDuration)
            }
            if (!empty(catalogUser)) {
                if (catalogItem.type == 3) {
                    // RESET PROGRESS AND SAVE TO COMPLETE HISTORY
                    const course = await Course.getFullCourse("", catalogItem.course[0], userId)
                    if (course.complete) {
                        await Course.resetCourseComplete({ course, userId })
                    }
                    await db.models.CatalogUser.update({ start: catalogItemStart, end: catalogItemEnd }, { where: { id: catalogUser.id } })
                } else {
                    return resolve({ success: false, message: "Already exist" })
                }
            } else {
                await db.models.CatalogUser.create({ globalUserId, catalogId, accessType: 2, start: catalogItemStart, end: catalogItemEnd })
                if (!empty(catalogItem.giftIds)) {
                    let giftAccessDuration
                    if (!empty(catalogItem.giftAccessDuration)) {
                        giftAccessDuration = catalogItem.giftAccessDuration.split(",").map((r) => Number(r))
                    }
                    for (const i in catalogItem.giftIds) {
                        const giftId = catalogItem.giftIds[i]
                        let start, end
                        start = new Date()
                        if (!empty(giftAccessDuration[i])) {
                            end = new Date()
                            end.setDate(end.getDate() + giftAccessDuration[i])
                        }
                        await db.models.CatalogUser.create({ globalUserId, catalogId: giftId, start, end, accessType: 3 })
                    }
                }
            }
            resolve({ success: true })
        })
    },

    calculatePrices: async (params) => {
        return new Promise(async (resolve) => {
            debug("calculatePrices")

            let { catalog, userId, lang, userGrades } = params
            let user = await db.models.User.findOne({ where: { id: userId } })
            let currentUserGrade
            const grade = new Grade(userId)
            await grade.init()
            if (empty(userGrades)) {
                userGrades = await grade.getUserActiveGradeIds({ lang, userId })
            } else {
                currentUserGrade = await grade.getUserCurrentGrade({ lang, userId })
            }
            user.userAgeInDays = Math.ceil((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24))
            const userStudyHistory = await db.models.UserStudyHistory.findOne({ where: { type: "gradeDown", userId } })
            user.gradeAfterDownInDays = null
            user.gradeBeforeDownInDays = null
            if (!empty(currentUserGrade) && !empty(currentUserGrade.end)) {
                user.gradeBeforeDownInDays = Math.floor((new Date(currentUserGrade.end).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            }
            if (!empty(userStudyHistory)) {
                user.gradeAfterDownInDays = Math.floor((new Date().getTime() - new Date(userStudyHistory.createdAt).getTime()) / (1000 * 3600 * 24))
            }
            const globalUserId = user.userId
            let discountIds = []
            for (const catalogItem of catalog) {
                if (!empty(catalogItem.discountIds)) discountIds = [...new Set([...discountIds, ...catalogItem.discountIds])]
            }
            let discounts = await db.models.Discount.findAll({ where: { id: discountIds } })
            discounts = await Translator.translateArray({ modelName: db.models.Discount.name, data: discounts, lang })
            const catalogUser = await db.models.CatalogUser.findAll({ where: { globalUserId } })
            const catalogUserIds = catalogUser.map((c) => c.catalogId)
            const catalogUserList = await db.models.Catalog.findAll({ where: { id: catalogUserIds } })

            let emptyGradeCatalogIds = true
            let userCourseIds = []
            let userProgramIds = []
            for (const catalogUserItem of catalogUserList) {
                if (!empty(catalogUserItem.course)) {
                    if (catalogUserItem.type == 1) {
                        if (!empty(catalogUserItem.program)) userProgramIds.push(catalogUserItem.program[0])
                    } else {
                        userCourseIds.push(catalogUserItem.course[0])
                    }
                }
            }
            if (!empty(userProgramIds)) {
                const userPrograms = await db.models.Program.findAll({ where: { id: userProgramIds } })
                userPrograms.map((p) => (userProgramCourseIds = [...userCourseIds, ...p.courses]))
            }
            userCourseIds = [...new Set(userCourseIds)]
            const userCourses = await db.models.Course.findAll({ where: { id: userCourseIds } })
            for (const userCourseItem of userCourses) {
                if (!empty(userCourseItem.gradeIds)) {
                    emptyGradeCatalogIds = false
                    break
                }
            }

            user.membership = false
            const userMembership = await db.models.UserMembership.findOne({ where: { userId: globalUserId } })
            if (!empty(userMembership)) {
                const now = new Date()
                const end = new Date(userMembership.end)
                if (end > now) user.membership = true
            }
            for (const i in catalog) {
                const catalogItem = catalog[i]
                let catalogItemDiscounts = { list: [], total: { amount: 0 } }
                if (!empty(catalogItem.discountIds)) {
                    for (const discountId of catalogItem.discountIds) {
                        const discount = discounts.find((d) => d.id === discountId)
                        try {
                            const conditions = JSON.parse(discount.conditions)
                            if (!empty(conditions) && !empty(conditions.list)) {
                                let active = false
                                let successConditions = []
                                for (const condition of conditions.list) {
                                    if (!empty(condition.value) && typeof condition.value === "string" && ~condition.value.indexOf("-")) {
                                        condition.range = condition.value.split("-").map((r) => Number(r))
                                    }
                                    switch (condition.type) {
                                        case "gradeDaysAfterDegradeRange":
                                            if (!empty(condition.range) && condition.range.length == 2 && !empty(user.gradeAfterDownInDays)) {
                                                if (user.gradeAfterDownInDays >= condition.range[0] && user.gradeAfterDownInDays <= condition.range[1]) active = true
                                            }
                                            break
                                        case "gradeDaysBeforeDegradeRange":
                                            if (!empty(condition.range) && condition.range.length == 2 && !empty(user.gradeBeforeDownInDays)) {
                                                if (user.gradeBeforeDownInDays >= condition.range[0] && user.gradeBeforeDownInDays <= condition.range[1]) active = true
                                            }
                                            break
                                        case "gradeDownInDaysLess":
                                            if (user.gradeAfterDownInDays != null && user.gradeAfterDownInDays <= condition.value) active = true
                                            break
                                        case "always":
                                            active = true
                                            break
                                        case "emptyCatalogIds":
                                            if (empty(catalogUserIds)) active = true
                                            break
                                        case "emptyGradeCatalogIds":
                                            if (emptyGradeCatalogIds) active = true
                                            break
                                        case "withoutCatalogIds":
                                            if (Array.isArray(condition.value)) {
                                                let withoutCatalogIds = true
                                                for (const catalogUserId of condition.value) {
                                                    if (catalogUserIds.includes(catalogUserId)) {
                                                        withoutCatalogIds = false
                                                        break
                                                    }
                                                }
                                                active = withoutCatalogIds
                                            }
                                            break
                                        case "hasCatalogIds":
                                            for (const discountCatalogId of condition.value) {
                                                if (catalogUserIds.includes(discountCatalogId)) {
                                                    active = true
                                                    break
                                                }
                                            }
                                            break
                                        case "hasGradeIds":
                                            for (const gradeId of condition.value) {
                                                if (userGrades.includes(gradeId)) {
                                                    active = true
                                                    break
                                                }
                                            }
                                            break
                                        case "membership":
                                            if (user.membership === Boolean(condition.value)) active = true
                                            break
                                        case "userAgeInDaysLess":
                                            if (user.userAgeInDays <= condition.value) active = true
                                            break
                                        case "userAgeInDaysMore":
                                            if (user.userAgeInDays >= condition.value) active = true
                                            break
                                        default:
                                            break
                                    }
                                    if (active) successConditions.push(1)
                                }
                                if (successConditions.length != conditions.list.length) active = false
                                catalogItemDiscounts.list.push({ id: discount.id, title: discount.title, amount: discount.amount, active, summable: discount.summable })
                            }
                        } catch (error) {
                            console.log(error)
                        }
                    }
                    // check best prices and coditions
                    if (!empty(catalogItemDiscounts.list)) {
                        let bestDiscount = { amount: -1 }
                        for (const currentDiscount of catalogItemDiscounts.list) {
                            if (currentDiscount.active && currentDiscount.amount > bestDiscount.amount) bestDiscount = currentDiscount
                        }
                        for (const currentDiscount of catalogItemDiscounts.list) {
                            if (currentDiscount.active) {
                                if (currentDiscount.summable || currentDiscount.id == bestDiscount.id) {
                                    catalogItemDiscounts.total.amount += currentDiscount.amount
                                }
                            }
                        }
                    }
                }
                catalog[i].discount = catalogItemDiscounts
                let newPrice = Math.round(catalogItem.newPrice - catalogItem.newPrice * (catalogItemDiscounts.total.amount / 100))
                newPrice = newPrice < 0 ? 0 : newPrice
                catalog[i].oldPrice = catalog[i].newPrice
                catalog[i].newPrice = newPrice
            }
            resolve(catalog)
        })
    },
}
module.exports = CatalogLib
