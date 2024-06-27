const db = require('../database');
var empty = require('is-empty');
const session = require('./session');
const Translator = require('../lib/translator');
let Validator = require('validatorjs');

const Category = {
    getCategories: async (req, res) => {
        let validation = new Validator(req.query, { _end: 'required|numeric', _start: 'required|numeric' })
        if (validation.fails()) return res.status(500).send(validation.errors.all())

        const lang = !empty(req) ? req.get('Accept-Language') : ''
        const { _end = 5, _start = 0, parentId } = req.query
        let where = {}
        if (!empty(parentId)) where.parentId = parentId
        db.models.Category.findAndCountAll({
            offset: _start,
            limit: _end - _start,
            where,
            order: [
                ['title', 'DESC']
            ],
            raw: false
        }).then(async (data) => {
            let rawData = data.rows.map((c) => c.dataValues)
            rawData = await Translator.translateArray({ modelName: db.models.Category.name, data: rawData, lang })
            res.status(200).send({ rows: rawData, count: data.count })
        })
    }
}

module.exports = Category;