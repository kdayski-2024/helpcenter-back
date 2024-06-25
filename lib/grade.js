const empty = require("is-empty")
const db = require("../database")
const Translator = require("./translator")
const dateFormat = require("dateformat")
const GRADE_DURATION = 365
const StudyHistory = require("./studyHistory")

class Grade {
    constructor(userId) {
        this.userId = userId
    }

    async init() {
        try {
            this.userGrade = await db.models.UserGrade.findAll({ limit: 1, where: { userId: this.userId }, order: [["id", "DESC"]] })
            this.userGrade = this.userGrade[0]
            this.gradesInfo = await db.models.Grade.findAll({ attributes: { exclude: ["createdAt", "updatedAt"] }, order: [["position", "ASC"]] })
            this.userGradeInfo = this.gradesInfo.find((g) => this.userGrade && g.id == this.userGrade.gradeId)
        } catch (e) {
            console.log(e)
        }
    }

    isUpgradeNeeded(gradeIds) {
        if (empty(this.userGrade)) return true
        try {
            const courseGradesInfo = gradeIds.map((courseGradeId) => this.gradesInfo.find(({ id }) => id === courseGradeId))

            const userGradePosition = this.userGradeInfo.position
            const courseGradesPositions = courseGradesInfo.map(({ position }) => position).filter((i) => typeof i === "number" && !Number.isNaN(i))
            let highestCourseGradePosition = Math.max(...courseGradesPositions)

            if (userGradePosition < highestCourseGradePosition) {
                return true
            }

            return false
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async getUserGrade(options) {
        const { lang = "en", userId, courseId = null } = options
        let grades = this.gradesInfo
        grades = await Translator.translateArray({ modelName: db.models.Grade.name, data: grades, lang })
        const where = { userId }
        if (!empty(courseId)) where.courseId = courseId

        const userGrades = await db.models.UserGrade.findAll({ where, order: [["id", "ASC"]], attributes: { exclude: ["createdAt", "updatedAt"] } })
        let current = {}
        let userGrade = !empty(userGrades) ? userGrades[userGrades.length - 1] : null
        if (!empty(userGrade)) {
            let findedGrade = grades.find((g) => g.id === userGrade.gradeId)
            if (!empty(findedGrade)) {
                findedGrade.end = userGrade.end
                findedGrade.start = userGrade.start
                current = findedGrade
            }
            current = empty(findedGrade) ? {} : findedGrade

            if (!empty(current.end)) {
                const nowDate = Date.now()
                const endDate = new Date(current.end).getTime()
                if (nowDate > endDate) {
                    current.endDate = -1
                } else {
                    current.endDate = Math.floor((endDate - nowDate) / 1000)
                }
            }
        }
        // TODO if grades stripe filled format
        for (const grade of grades) {
            if (!empty(current) && grade.position <= current.position) {
                grade.active = true
            }
            grade.desc = empty(grade.desc) ? grade.name : grade.desc
        }
        let data = { grades, current }
        return data
    }
    async getUserActiveGradeIds(options) {
        const gradeInfo = await this.getUserGrade(options)
        let activeGrades = []
        for (const grade of gradeInfo.grades) {
            if (grade.active) activeGrades.push(grade.id)
        }
        return activeGrades
    }
    async getUserCurrentGrade(options) {
        const gradeInfo = await this.getUserGrade(options)
        return gradeInfo.current
    }

    async upgrade(targetGradeId, gradeDuration = GRADE_DURATION) {
        try {
            if (Array.isArray(targetGradeId)) {
                const grades = targetGradeId.map((id) => this.gradesInfo.find((item) => item.id === id))
                const highestPosition = Math.max(...grades.map((item) => item.position))
                const highestGrade = grades.find((item) => item.position === highestPosition)
                targetGradeId = highestGrade.id
            }

            const targetGradeInfo = this.gradesInfo.find(({ id }) => id === targetGradeId)

            if (empty(this.userGradeInfo) || this.userGradeInfo.position < targetGradeInfo.position) {
                const newEndDate = new Date()
                newEndDate.setDate(new Date().getDate() + gradeDuration)
                const data = { userId: this.userId, gradeId: targetGradeInfo.id, start: new Date(), end: newEndDate }
                await db.models.UserGrade.create(data)

                //!IGOR CREATE STUDY HISTORY ->type gradeUp
                StudyHistory.create({ userId: this.userId, type: "gradeUp" })

                return { start: data.start, end: data.end, validityDate: `${dateFormat(data.start, "dd.mm.yyyy")} - ${dateFormat(data.end, "dd.mm.yyyy")}` }
            }
        } catch (e) {
            console.log(e)
        }
    }

    async degrade(options = {}) {
        const { force } = options
        try {
            const now = Date.now()
            const gradeExpireTime = new Date(this.userGrade.end).getTime()
            if (now > gradeExpireTime || force) {
                const prevGradePosition = this.#getPrevGradePosition(this.userGradeInfo.position)
                if (prevGradePosition && this.userGradeInfo.position !== prevGradePosition) {
                    const newEndDate = new Date()
                    newEndDate.setDate(new Date().getDate() + GRADE_DURATION)
                    const prevGradeInfo = await db.models.Grade.findOne({ where: { position: prevGradePosition } })
                    await db.models.UserGrade.create({ userId: this.userId, gradeId: prevGradeInfo.id, start: now, end: newEndDate })
                    StudyHistory.create({ userId: this.userId, type: "gradeDown" })
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    #getPrevGradePosition(target) {
        try {
            const positions = this.gradesInfo.map(({ position }) => position)
            for (var i = 0; i < positions.length; i++) {
                const index = positions.indexOf(target)
                if (!empty(positions[index - 1])) {
                    return positions[index - 1]
                } else {
                    return target
                }
            }
        } catch (e) {
            console.log(e)
            return target
        }
    }
}

module.exports = Grade
