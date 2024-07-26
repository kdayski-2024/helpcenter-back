const multer = require("multer")
const path = require("path")
const fs = require("fs")
const uploadSubDir = "import"
const uploadDir = `uploads/${uploadSubDir}/`
const db = require("../database")
const csv = require("csv-parser")
const empty = require("is-empty")
const session = require("../controller/session")
const md5 = require("md5")
const systemSetting = require("../lib/systemSetting")
const env = systemSetting.env()
const dateFormat = require("dateformat")
const debug = require("debug")("adminPanel")
const Manager = require("../controller/manager")

const AdminPanel = {
    login: async (req, res) => {
        debug("login")
        const { username, password } = req.body
        // const isCaptchaValid = await verifyCaptchaToken(captcha);
        // if (!isCaptchaValid) {
        //     res.status(401).send('invalid CAPTCHA token');
        //     return;
        // }
        let allow = false
        let accessToken
        let manager
        if (!empty(username) && !empty(password)) {
            manager = await db.models.Manager.findOne({
                where: {
                    login: username,
                    password: md5(env.md5Salt + password),
                },
            })
            if (!empty(manager)) {
                allow = true
                // CLEAR OLD SESSIONS
                var d = new Date()
                d.setDate(d.getDate() - 14)
                await db.models.ManagerSession.destroy({
                    where: {
                        createdAt: {
                            [db.Op.lte]: d,
                        },
                    },
                })
                accessToken = session.generateToken()
                let permissions = []
                try {
                    permissions = await Manager.permissionList({ manager })
                } catch (error) {
                    console.log(error)
                }
                await db.models.ManagerSession.create({
                    managerId: manager.id,
                    accessToken,
                    permissions: JSON.stringify(permissions)
                })
            }
        }
        if (allow) {
            res.send({ token: accessToken, role: manager.role })
        } else {
            res.status(401).send("invalid password")
        }
    },
}
module.exports = AdminPanel
