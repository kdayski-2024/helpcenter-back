const empty = require('is-empty');
const db = require('../database');
const defaultLang = "en"
const supportLanguages = ["ru", "en"]
const HEADER_KEY = 'Accept-Language'
const translateFields = ['title', 'desc', 'content', 'image', 'video']
const translateFieldsArray = ['image', 'file']
let currencyLanguages

function Translator(lang, table, docId) {
    if (!(this instanceof Translator)) {
        return new Translator(lang, table, docId)
    }

    this.lang = lang
    this.table = table
    this.docId = docId

    this.initPromise = new Promise(async (resolve, reject) => {
        if (conditions(this.lang)) {
            const translations = await db.models.Translation.findAll({
                where: { lang: this.lang, table: this.table, docId: this.docId },
                attributes: ["field", "value"],
                raw: true
            })
            resolve(translations)
        } else {
            resolve()
        }
    })
};

Translator.prototype.translate = async function translate(data) {
    return new Promise(async (resolve, reject) => {
        if (conditions(this.lang)) {
            this.initPromise.then((result, error) => {
                result.forEach(element => {

                    let value = element.value
                    if (translateFieldsArray.includes(element.field)) {
                        try {
                            value = JSON.parse(value)
                        } catch (error) {
                            console.log('Translator: error JSON.parse(value)')
                        }
                    }
                    data[element.field] = value
                })
                resolve(data)
            })
        } else {
            resolve(data)
        }
    })
}
Translator.langToInt = (lang) => {
    if (Array.isArray(lang)) {
        return lang.map(l => langToInt(l))
    } else {
        return langToInt(lang)
    }
    function langToInt(lang) {
        let convertedId = ''
        for (char of lang) convertedId += char.charCodeAt().toString()
        convertedId = Number(convertedId)
        return convertedId
    }
}
Translator.intToLang = (lang) => {
    if (Array.isArray(lang)) {
        return lang.map(l => intToLang(l))
    } else {
        return intToLang(lang)
    }
    function intToLang(lang) {
        lang = lang.toString()
        return String.fromCharCode(Number(lang.substr(0, 3)), Number(lang.substr(3)))
    }
}
Translator.defaultLang = defaultLang
Translator.supportLanguages = supportLanguages
Translator.translateFields = translateFields
Translator.currencyLanguages = async () => {
    if (empty(currencyLanguages)) {
        await db.system
    }
}
Translator.getLangFromReq = (req) => {
    return req ? req.get(HEADER_KEY) : defaultLang
}
Translator.findDocIds = async (lang, table, value) => {
    return new Promise(async (resolve, reject) => {
        if (conditions(lang)) {
            const translations = await db.models.Translation.findAll({
                where: { lang, table, value },
                attributes: ["docId"],
                raw: true
            })
            resolve(translations.map(el => el.docId))
        } else {
            resolve()
        }
    })
};
Translator.prototype.conditions = conditions(this.lang)
function conditions(lang) {
    return lang != undefined && defaultLang != lang
};
Translator.translateArray = async function (options) {
    let { lang, modelName, data } = options
    let translations = []
    for (let i in data)
        translations.push(new Translator(lang, modelName, data[i].id).translate(data[i]))
    return Promise.all(translations)
}
Translator.update = async function (options) {
    return new Promise(async (resolve, reject) => {
        let { req, lang, table, docId, data } = options
        lang = req ? req.get(HEADER_KEY) : lang

        if (conditions(lang)) {
            let updateData = data
            let promises = []
            const dataKeys = Object.keys(data)
            const translations = await db.models.Translation.findAll({
                where: { lang, table, docId },
                raw: true
            })
            let translationsIds = []
            let translationsFields = []
            let duplicates = []
            translations.forEach(element => {
                //TODO find dublicates and find where they created
                if (translationsFields.indexOf(element.field) != -1) {
                    duplicates.push(element.id)
                    return
                }
                translationsFields.push(element.field)
                translationsIds.push(element.id)

            })

            if (!empty(duplicates)) {
                await db.models.Translation.destroy({ where: { id: duplicates } })
            }
            translateFields.forEach(field => {
                // в данных есть поле которое переводиться
                if (dataKeys.indexOf(field) != -1) {
                    // уже существует в переводах это поле
                    const translationsFieldsIndex = translationsFields.indexOf(field)
                    let value = data[field]
                    // если поле может быть массивом
                    if (translateFieldsArray.includes(field) && Array.isArray(value)) {
                        value = JSON.stringify(value)
                    }
                    if (translationsFieldsIndex != -1) {
                        promises.push(
                            db.models.Translation.update({ value }, {
                                where: {
                                    id: translationsIds[translationsFieldsIndex]
                                }
                            })
                        )
                    } else {
                        promises.push(
                            db.models.Translation.create({ lang, table, field, docId, value })
                        )
                    }
                    delete updateData[field]
                }
            });
            await db.models.Translation.findAll({
                where: { lang, table, docId },
                attributes: ["id", "field", "value"],
                raw: true
            })
            resolve(updateData)
        } else {
            resolve(data)
        }
    })
}

module.exports = Translator;