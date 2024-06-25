const db = require("../database")
function StudyHistory() {
    if (!(this instanceof StudyHistory)) {
        return new StudyHistory()
    }
}

StudyHistory.create = async (obj = {}) => {
    const { userId, courseId, courseData, catalogId, userGradeId, type, reason, data, date } = obj
    await db.models.UserStudyHistory.create({ userId, courseId, courseData, catalogId, userGradeId, type, reason, data, date })
}

module.exports = StudyHistory
