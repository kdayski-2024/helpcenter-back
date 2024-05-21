const db = require('../database/singleModel')('ManagerDocBlock')
var empty = require('is-empty')
const session = require('../controller/session')
const Translator = require('../lib/translator')
const systemSetting = require('../lib/systemSetting')
const env = systemSetting.env()

const ManagerDocBlock = {
    
    blocked: async (data) => {
        const {id, req, model} = data
        return new Promise(async (resolve, reject) => {
            const lang = Translator.getLangFromReq(req)
            console.log(model)
            console.log(id)
            console.log(lang)
            resolve(true)
        })
    },
    block: (req, res) => {
        
    },
    unblock: (req, res) => {
        
    },
}

module.exports = ManagerDocBlock