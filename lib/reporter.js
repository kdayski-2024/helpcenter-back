const systemSetting = require('./systemSetting')

const axios = require('axios')
const empty = require('is-empty')
const fs = require('fs');
const reportsDir = __dirname + '/reports'
const db = require('../database')
const path = require("path");
const needReportId = 6

const Reporter = {
    init: async () => {
        console.log('init')
        await Reporter.collectData()
    },
    getReportsList: () => {
        const reportFiles = fs.readdirSync(reportsDir)
        let reportsList = []
        for (file of reportFiles) {
            const report = require(reportsDir + '/' + file)
            report.file = file
            reportsList.push(report)
        }
        return reportsList
    },
    get: (params) => {
        const { reportName, reportParam1, reportParam2, query = {} } = params
        const { _end = 100, _order = 'ASC', _sort = 'id', _start = 0 } = query
        let where = { reportName }
        if (!empty(reportParam1)) where.reportParam1 = reportParam1
        if (!empty(reportParam2)) where.reportParam2 = reportParam2
        return new Promise(async (resolve, reject) => {
            const rawData = await db.models.ReportData.findAndCountAll({
                where,
                offset: _start,
                limit: _end,
                order: [[_sort, _order]],
            })
            const resultData = rawData.rows.map(obj => JSON.parse(obj.reportData))
            resolve({ reportCount: rawData.count, reportData: resultData })
        })
    },
    collectData: async () => {
        return new Promise(async (resolve, reject) => {
            // await db.models.ReportData.destroy({
            //     where: {},
            //     truncate: true,
            //     restartIdentity: true
            // })
            const reportList = Reporter.getReportsList()
            let promises = []
            for (const report of reportList) {
                // !DEV SECTION

                if (report.id === needReportId) {
                    await db.models.ReportData.destroy({ where: { reportName: report.name } })
                    console.log(report.file + ' => getData()')
                    promises.push(report.getData())
                }

                // }
            }
            Promise.all(promises).then((reports) => {
                reports.forEach(reportPromise => {
                    let reportArr = Array.isArray(reportPromise) ? reportPromise : [reportPromise]

                    for (report of reportArr) {
                        let resultData = []
                        for (i in report.reportData) {
                            const reportParam1 = empty(report.reportParam1) ? '' : report.reportParam1
                            const reportParam2 = empty(report.reportParam2) ? '' : report.reportParam2
                            resultData.push({ reportParam1, reportParam2, reportName: report.reportName, reportData: JSON.stringify(report.reportData[i]) })
                        }
                        db.models.ReportData.bulkCreate(resultData)
                    }

                })
                console.log('done')
                resolve()
            })
            // bulkCreate
        })
    }
}
module.exports = Reporter