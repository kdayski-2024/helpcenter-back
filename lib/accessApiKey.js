const empty = require('is-empty');
const db = require('../database/singleModel')('AccessApiKey')

const check = (key) => {
    return new Promise((resolve, reject) => {
        if (empty(key)) { return resolve(false) }
        db.models.AccessApiKey.findOne({ where: { key, active: true } }).then((res, err) => {
            if (err) return reject(err)
            resolve(!empty(res))
        })
    })
}
module.exports = { check }
