const empty = require('is-empty');
function UserLog(options) {

    if (!(this instanceof UserLog)) {
        return new UserLog(options)
    }
    let { model, userId, action } = options

    this.model = model
    this.userId = userId
    this.action = action
}

UserLog.create = function (options) {
    let { db, userId, type, data } = options
    if (empty(db) || empty(userId) || empty(type)) return
    return db.models.UserLog.create({ userId, type, data })
}

module.exports = UserLog;