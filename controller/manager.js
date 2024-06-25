const db = require("../database")
var empty = require("is-empty")
const session = require("./session")
const Translator = require("../lib/translator")
const debug = require("debug")("manager")
const md5 = require("md5")
const systemSetting = require("../lib/systemSetting")
const env = systemSetting.env()
const Manager = {
    createManager: async (req, res) => {
        debug("createManager")
        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()

        if (!empty(req.body.password))
            req.body.password = md5(env.md5Salt + req.body.password)

        let manager = await db.models.Manager.create(req.body)
        res.status(200).send(manager.dataValues)
    },
    updateManager: async (req, res) => {
        debug("updateManager")
        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()

        if (!empty(req.body.password))
            req.body.password = md5(env.md5Salt + req.body.password)

        const { id } = req.params
        let manager = await db.models.Manager.update(req.body, {
            where: { id },
        })
        db.models.ManagerLog.create({
            managerId,
            type: "update",
            route: "Manager",
            data: JSON.stringify(req.body),
        })
        res.status(200).send(manager.dataValues)
    },
    deleteManager: async (req, res) => {
        debug("deleteManager")
        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()

        const { id } = req.params
        await db.models.Manager.destroy({ where: { id } })
        db.models.ManagerLog.create({
            managerId,
            type: "delete",
            route: "Manager",
            data: JSON.stringify({ where: { id } }),
        })
        res.status(200).send()
    },
    getManager: async (req, res) => {
        debug("getManager")

        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()

        const { id } = req.params
        let manager = await db.models.Manager.findOne({ where: { id } })
        delete manager.password

        res.status(200).send(manager)
    },
    getManagerRole: async (req, res) => {
        debug("getManagerRole")

        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))//??
            return res.status(403).send()

        const { id } = req.params
        let role = await db.models.ManagerRole.findOne({ where: { id } })
        role.data = JSON.stringify(await Manager.permissionMatrix(role.data))
        res.status(200).send(role)
    },
    getReportTaskFile: async (req, res) => {
        debug("getReportTaskFile")

        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()

        const {
            _end = 10,
            _order = "ASC",
            _sort = "id",
            _start = 0,
        } = req.query
        let where = { role: { [db.Op.contains]: ["curator"] } }

        let managers = await db.models.Manager.findAndCountAll({
            where,
            offset: _start,
            limit: _end,
            order: [[_sort, _order]],
        })
        for (const manager of managers.rows) {
            manager.langs = Translator.intToLang(manager.langs)
            manager.taskFilesTotal = 0
            manager.taskFilesProcessing = 0
            manager.taskFilesOpen = 0
            manager.taskFilesClose = 0
            manager.taskFilesRejected = 0
        }
        //TODO Optimize only need datas query
        const courseTaskFiles = await db.models.CourseTaskFile.findAll()
        let courseUserManagers = await db.models.CourseUserManager.findAll()
        let courseTaskFileManagers =
            await db.models.CourseTaskFileManager.findAll()
        for (const courseTaskFile of courseTaskFiles) {
            try {
                const userId = courseTaskFile.userId
                const courseUserManager = courseUserManagers.find(
                    (m) => m.userId == userId
                )
                if (!empty(courseUserManager)) {
                    let manager = managers.rows.find(
                        (m) => m.id == courseUserManager.managerId
                    )
                    if (!empty(manager)) {
                        manager.taskFilesTotal++
                        let taskFileIsProcessing = courseTaskFileManagers.find(
                            (tfm) =>
                                tfm.taskFileId == courseTaskFile.id &&
                                tfm.managerId == courseUserManager.managerId
                        )
                        if (!empty(taskFileIsProcessing)) {
                            manager.taskFilesProcessing++
                        }
                        switch (courseTaskFile.status) {
                            case 0:
                                manager.taskFilesOpen++
                                break
                            case 1:
                                manager.taskFilesClose++
                                break
                            case -1:
                                manager.taskFilesRejected++
                                break
                            default:
                                break
                        }
                    }
                } else {
                    console.error(`UserID ${userId} not have linked manager`)
                }
            } catch (error) {
                console.error(error)
            }
        }
        res.setHeader("Access-Control-Expose-Headers", "X-Total-Count")
        res.setHeader("X-Total-Count", managers.count)
        if (managers.count == 0) return res.status(200).send([])
        res.status(200).send(managers.rows)
    },
    getManagers: async (req, res) => {
        debug("getManagers")

        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()
        if (!(await session.hasManagerRole(["admin"], managerId)))
            return res.status(403).send()

        const {
            _end = 10,
            _order = "ASC",
            _sort = "id",
            _start = 0,
        } = req.query
        let where = {}

        let managers = await db.models.Manager.findAndCountAll({
            where,
            offset: _start,
            limit: _end,
            order: [[_sort, _order]],
        })
        res.setHeader("Access-Control-Expose-Headers", "X-Total-Count")
        res.setHeader("X-Total-Count", managers.count)
        if (managers.count == 0) return res.status(200).send([])
        res.status(200).send(managers.rows)
    },
    getPermissionList: async (req, res) => {
        debug("getPermissionList")

        const managerId = await session.getManagerId(req)
        if (empty(managerId)) return res.status(401).send()

        const permissions = await Manager.permissionList({ managerId })

        res.status(200).send(permissions)
    },
    permissionMatrix: async (data) => {
        return new Promise((resolve) => {
            let permissions = { rows: [] }
            let actualPermissions = []
            for (const table of Object.keys(db.models)) {
                actualPermissions.push({
                    title: table,
                    actions: [
                        { title: "Create", value: false },
                        { title: "Read", value: false },
                        { title: "Update", value: false },
                        { title: "Delete", value: false },
                    ],
                })
            }
            if (empty(data)) {
                permissions.rows = actualPermissions
            } else {
                // TODO UPDATE IF HAS NEW TABLES
                try {
                    permissions = JSON.parse(data)
                } catch (error) {
                    console.log(error)
                }
            }
            resolve(permissions)
        })
    },
    hasPermission: async (data) => {
        return new Promise(async (resolve) => {
            const { table, action, managerId, roles } = data
            let hasPermission = false
            if (empty(roles)) {
                let manager = await db.models.Manager.findAll({ where: { id: managerId } })
                let managerRole = await db.models.ManagerRole.findAll({ where: { name: manager.role } })
            }
            const foundTable = roles.find(r => r.title == table)
            if (!empty(foundTable)) {
                const foundAction = foundTable.actions.find(a => a.title == action)
                if (!empty(foundAction)) hasPermission = true
            }

            resolve(hasPermission)
        })
    },
    permissionList: async (data) => {
        return new Promise(async (resolve) => {
            let { managerId, manager } = data
            if (empty(manager)) {
                manager = await db.models.Manager.findOne({ where: { id: managerId } })
            }
            const roles = await db.models.ManagerRole.findAll({ where: { key: manager.role } })
            const combinedRoles = Manager.combineRoles(roles)
            resolve(combinedRoles)
        })
    },
    combineRoles: (roles) => {
        let combinedRoles = []
        for (let role of roles) {
            let data = role.data
            try {
                data = JSON.parse(role.data)
            } catch (error) {
                console.log(error)
            }
            if (!empty(data) && !empty(data.rows)) {
                for (const row of data.rows) {
                    let foundRow = combinedRoles.find(o => o.title == row.title)
                    if (empty(foundRow)) {
                        combinedRoles.push(row)
                    } else {
                        let newActions = []
                        for (const action of row.actions) {
                            let foundAction = foundRow.actions.find(o => o.title == action.title)
                            if (!empty(foundAction) && (action.value || foundAction.value)) {
                                newActions.push({ title: action.title, value: true })
                            } else {
                                newActions.push(action)
                            }
                        }
                        foundRow.actions = newActions
                    }
                }

            }
        }
        return combinedRoles
    },
}

module.exports = Manager
