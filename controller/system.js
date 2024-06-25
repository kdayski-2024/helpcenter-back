require("dotenv").config()
const axios = require("axios")
const db = require("../database")
const empty = require("is-empty")
const session = require("./session")
const Translator = require("../lib/translator")
const debug = require("debug")("system")
const systemSetting = require("../lib/systemSetting")
const apiUrl = process.env.AI_API_URL
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
    setTranslate: async (req, res) => {
        debug("setTranslate")
        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()
        const { message, id} = req.body
        const promt = `Без изменения формата markdown и не меняй строчный прописной формат букв переведи статью на Английский в официальном стиле: `
        debug("start translate")
        axios
            .post(
                `${apiUrl}/message`,
                {
                    message: promt + message,
                }
            )
            .then(function (response) {
                debug("translate done article " + id)
                db.models.Article.update({content:response.data.answear}, {
                    where: { id },
                })
            })
            .catch(function (error) {
                console.log(error)
            })

        res.status(200).send({ success: true })
    },
    search: async (req, res) => {
        
        const { q } = req.query
        const searchModels = [
            db.models.Article
        ]
        const limit = 20
        let promiseArr = []
        searchModels.forEach((model) => {
            promiseArr.push(
                new Promise(async (resolve, reject) => {
                    const searchResuls = await model.findAll({
                        where: {
                            [db.Op.or]: [
                                {
                                    title: {
                                        [db.Op.iLike]: "%" + q + "%",
                                    },
                                },
                                {
                                    desc: {
                                        [db.Op.iLike]: "%" + q + "%",
                                    },
                                },
                                {
                                    content: {
                                        [db.Op.iLike]: "%" + q + "%",
                                    },
                                },
                            ],
                        },
                        limit,
                        raw: true,
                    })
                    resolve({ name: model.name, data: searchResuls })
                })
            )
        })
        Promise.all(promiseArr).then((searchResuls) => {
            res.status(200).send(searchResuls)
        })
    },
}

module.exports = System
