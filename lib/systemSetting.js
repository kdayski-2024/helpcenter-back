const empty = require("is-empty")
const db = require("../database/singleModel")("SystemSetting")

let systemSettingsData

const init = () => {
    return new Promise(async (resolve, reject) =>
        resolve(
            await db.models.SystemSetting.findAll({
                attributes: ["key", "data"],
            })
        )
    )
}
const get = async (key) => {
    return new Promise(async (resolve, reject) => {
        if (empty(systemSettingsData)) systemSettingsData = await init()
        let findData = Object.values(systemSettingsData).find((obj) => {
            return obj.key == key
        })
        if (!empty(findData)) {
            let parsedData
            try {
                parsedData = JSON.parse(findData.data)
            } catch (error) {
                parsedData = findData.data
            }
            resolve(parsedData)
        } else resolve()
    })
}
const env = (key) => {
    let envObj = {}
    envObj.serviceUrl = !empty(process.env.SERVICE_URL) ? process.env.SERVICE_URL : ""
    envObj.integratorId = !empty(process.env.INTEGRATOR_ID) ? process.env.INTEGRATOR_ID : ""
    envObj.secret = !empty(process.env.SECRET) ? process.env.SECRET : ""
    envObj.appId = !empty(process.env.APP_ID) ? process.env.APP_ID : ""
    envObj.accessToken = !empty(process.env.ACCESS_TOKEN) ? process.env.ACCESS_TOKEN : ""
    envObj.frontUrl = !empty(process.env.FRONT_URL) ? process.env.FRONT_URL : ""
    envObj.apiUrl = !empty(process.env.API_URL) ? process.env.API_URL : ""
    envObj.uploadDir = !empty(process.env.UPLOAD_DIR) ? process.env.UPLOAD_DIR : ""
    envObj.proxyApiKey = !empty(process.env.PROXY_API_KEY) ? process.env.PROXY_API_KEY : ""
    envObj.nodeEnv = !empty(process.env.NODE_ENV) ? process.env.NODE_ENV : ""
    envObj.certTypesPath = process.env.CERT_TYPES_PATH || "assets/certificates/types"
    envObj.paymentCabinetRefId = !empty(process.env.PAYMENT_CABINET_REF_ID) ? process.env.PAYMENT_CABINET_REF_ID : ""
    envObj.paymentPayProviderCode = !empty(process.env.PAYMENT_PAY_PROVIDER_CODE) ? process.env.PAYMENT_PAY_PROVIDER_CODE : ""
    envObj.md5Salt = !empty(process.env.MD5_SALT) ? process.env.MD5_SALT : ""
    envObj.externalSoldIdPrefix = !empty(process.env.EXTERNAL_SOLD_ID_PREFIX) ? process.env.EXTERNAL_SOLD_ID_PREFIX : ""
    envObj.paymentSecret = !empty(process.env.PAYMENT_SECRET) ? process.env.PAYMENT_SECRET : ""
    if (!empty(key) && !empty(envObj[key])) return envObj[key]
    return envObj
}
const isDev = () => {
    if (!empty(process.env.NODE_ENV) && process.env.NODE_ENV == "development") return true
    else return false
}
module.exports = {
    get,
    env,
    isDev,
}
