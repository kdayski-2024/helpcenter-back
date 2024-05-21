const db = require("../database")
const { Op } = require("sequelize")
var empty = require("is-empty")
const session = require("./session")
const Translator = require("../lib/translator")
let Validator = require("validatorjs")
const nodemailer = require("nodemailer")
const debugHttp = require("debug")("http")
const debug = require("debug")("system")
const systemSetting = require("../lib/systemSetting")
const serviceApi = require("../lib/serviceApi")
const Stripe = require("stripe")
const stripe = Stripe("sk_test_4eC39HqLyjWDarjtT1zdp7dc")
const System = {
    init: () => {
        return new Promise(async (resolve, reject) => {
            // if (Payment.isActive()) {
            //     debug('check webhook url for payment')
            //     const serviceUrl = !empty(process.env.SERVICE_URL) ? process.env.SERVICE_URL : ''
            //     if (empty(serviceUrl)) return console.error('env variable SERVICE_URL not set')
            // }
            resolve()
        })
    },
    getLangs: async (req, res) => {
        debug("getLangs")
        const { id = [] } = req.query
        const DEFAULT_PARAMS = await systemSetting.get("DEFAULT_PARAMS")
        if (empty(DEFAULT_PARAMS))
            return res.status(500).send({ error: "Empty defult params" })
        let langs = []
        for (const lang of DEFAULT_PARAMS.language.available) {
            let convertedId = Translator.langToInt(lang.key)
            if (!empty(id)) {
                if (id.includes(convertedId))
                    langs.push({ id: convertedId, title: lang.key })
            } else {
                langs.push({ id: convertedId, title: lang.key })
            }
        }
        res.setHeader("Access-Control-Expose-Headers", "X-Total-Count")
        res.setHeader("X-Total-Count", langs.length)
        return res.status(200).send(langs)
    },
}

module.exports = System
