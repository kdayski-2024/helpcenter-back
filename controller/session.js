const db = require("../database")
var empty = require("is-empty")
const crypto = require("crypto")
const UserLogs = require("../lib/userLogs")
const TOKEN_KEY = "X-Auth-Token"
const MANAGER_TOKEN_KEY = "A-Auth-Token"
const debug = require("debug")("session")
const systemSetting = require("../lib/systemSetting")
const Translator = require("../lib/translator")

const Session = {
    getLanguage: (req) => {
        return !empty(req) && !empty(req.get("Accept-Language")) ? req.get("Accept-Language") : Translator.defaultLang
    },
    generateToken: () => {
        return crypto.randomBytes(32).toString("hex")
    },
    getUserId: async (req) => {
        return new Promise(async (resolve, reject) => {
            const accessToken = getTokenFromHeader(req)
            if (empty(accessToken)) resolve(null)
            const userId = await getUserIdFromToken(accessToken)
            resolve(userId)
        })
    },
    getManagerId: async (req) => {
        return new Promise(async (resolve, reject) => {
            const accessToken = getManagerTokenFromHeader(req)
            if (empty(accessToken)) resolve(null)
            const managerId = await getManagerIdFromToken(accessToken)
            resolve(managerId)
        })
    },
    getManagerRoles: async (managerId) => {
        return new Promise(async (resolve, reject) => {
            const manager = await db.models.Manager.findOne({
                where: { id: managerId },
            })
            !empty(manager) ? resolve(manager.role) : resolve(null)
        })
    },
    hasManagerRole: async (roles, managerId) => {
        const manager = await db.models.Manager.findOne({
            where: { id: managerId },
        })
        let has = false
        if (!empty(manager.role) && Array.isArray(manager.role)) {
            for (role of roles) {
                if (~manager.role.indexOf(role)) {
                    has = true
                    break
                }
            }
        }
        return has
    },
    hasManagerDbPermissions: async (params) => {
        let { table, actions, managerId } = params
        actions = typeof actions === "string" ? [actions] : actions

        const manager = await db.models.Manager.findOne({
            where: { id: managerId },
        })
        const managerRoles = await db.models.ManagerRole.findAll({
            where: { key: manager.role },
        })
        let has = false
        for (const role of managerRoles) {
            for (const action of actions) {
                role.data //TODO
            }
            // console.log(role.data)
        }
        return has
    },
    get: async (req, res) => {
        const accessToken = getTokenFromHeader(req)
        let userSession = await db.models.UserSession.findOne({
            where: { accessToken },
        })

        if (!empty(userSession)) {
            return res.status(200).send(userSession)
        } else return res.status(401).send()
    },
    update: async (req, res, next) => {
        // TODO multiply sessions from diferent devices. now only from one
        let userIdGlobal = req.body.userId
        const { accessToken, refreshToken, accessExpired, refreshExpired, ref } = req.body
        let userId
        let isNew = false
        //!DEV
        if (systemSetting.isDev()) {
            const env = systemSetting.env()
            if (env.frontUrl === "http://dev.fanil.ru:3001") {
                // isNew = true
                userIdGlobal = 105725
                // TEZ 72483
            }
        }

        if (!empty(accessToken) && !empty(userIdGlobal)) {
            // await db.models.User.destroy({ where: {}})
            // await db.models.UserSession.destroy({ where: {}})
            let user = await db.models.User.findOne({
                where: { userId: userIdGlobal },
            })
            if (empty(user)) {
                isNew = true
                const refClear = !empty(Number(ref)) && !isNaN(Number(ref)) ? Number(ref) : 0
                await db.models.User.create({
                    userId: userIdGlobal,
                    ref: refClear,
                })
                user = await db.models.User.findOne({
                    where: { userId: userIdGlobal },
                })
            }

            userId = user.id
            let userSessions = await db.models.UserSession.findAll({
                where: { userId },
            })
            // TODO clear old sessions in cron in service
            db.models.UserSession.create({
                userId,
                accessToken,
                refreshToken,
                accessExpired,
                refreshExpired,
            }).then((result) => {
                result.dataValues.isNew = isNew
                UserLogs.create({ db, userId, type: "login" })
                console.log("user login " + userId + " " + userIdGlobal)
                debug("user login " + userId + " " + userIdGlobal)
                return res.status(200).send(result)
            })
        }
    },
}
async function getUserIdFromToken(accessToken) {
    return new Promise(async (resolve, reject) => {
        const userSession = await db.models.UserSession.findOne({
            where: { accessToken },
        })
        !empty(userSession) ? resolve(userSession.userId) : resolve(null)
    })
}
async function getManagerIdFromToken(accessToken) {
    return new Promise(async (resolve, reject) => {
        const managerSession = await db.models.ManagerSession.findOne({
            where: { accessToken },
        })
        !empty(managerSession) ? resolve(managerSession.managerId) : resolve(null)
    })
}
function getTokenFromHeader(req) {
    return !empty(req.headers[TOKEN_KEY.toLowerCase()]) ? req.headers[TOKEN_KEY.toLowerCase()] : null
}
function getManagerTokenFromHeader(req) {
    return !empty(req.headers[MANAGER_TOKEN_KEY.toLowerCase()]) ? req.headers[MANAGER_TOKEN_KEY.toLowerCase()] : null
}

module.exports = Session
