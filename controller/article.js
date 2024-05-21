const db = require('../database');
var empty = require('is-empty');
const session = require('./session');
const Translator = require('../lib/translator');
let Validator = require('validatorjs');

const Article = {
    getArticleMain: async (req, res) => {

        const lang = !empty(req) ? req.get('Accept-Language') : ''
        const { categoryId = 0 } = req.query
        const categoryWhere = {}
        if (!empty(categoryId)) {
            categoryWhere.categoryId = categoryId
        }
        let categories = await db.models.Category.findAll({
            where: categoryWhere,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            order: [
                ['title', 'DESC']
            ]
        })
        categories = await Translator.translateArray({ modelName: db.models.Category.name, data: categories, lang })
        for (const category of categories) {
            category.articles = []
            category.categories = []
        }
        let data = { rows: [] }
        const articleWhere = {visible:true}

        let articles = await db.models.Article.findAll({
            where: articleWhere,
            attributes: { exclude: ['createdAt', 'updatedAt', 'content'] },
        })
        articles = await Translator.translateArray({ modelName: db.models.Article.name, data: articles, lang })
        for (const article of articles) {
            const findedCategory = categories.find((o) => o.id == article.categoryId)
            if (!empty(findedCategory)) {
                findedCategory.articles.push(article)
            } else {
                console.log(`Article ${article.id} not have category`)
            }
        }
        for (const category of categories) {
            if (category.parentId == 0) {
                data.rows.push(category)
            }
        }
        for (const category of categories) {
            if (category.parentId != 0) {
                const findedCategory = data.rows.find((o) => o.id == category.parentId)
                if (!empty(findedCategory)) {
                    findedCategory.categories.push(category)
                } else {
                    console.log(`Article ${article.id} not have category`)
                }

            }
        }
        console.log(data)

        // db.models.Article.findAll({
        //     where: { visible: true },
        //     order: [
        //         ['title', 'DESC']
        //     ],
        //     raw: false
        // }).then(async (data) => {
        //     let rawData = data.rows.map((c) => c.dataValues)
        //     rawData = await Translator.translateArray({ modelName: db.models.Article.name, data: rawData, lang })
        //     res.status(200).send({ rows: rawData, count: data.count })
        // })
        res.status(200).send({ data })
    },
    getArticles: async (req, res) => {


        // let validation = new Validator(req.query, { _end: 'required|numeric', _start: 'required|numeric' })
        // if (validation.fails()) return res.status(500).send(validation.errors.all())

        const lang = !empty(req) ? req.get('Accept-Language') : ''
        const { _end = 5, _start = 0 } = req.query
        db.models.Article.findAndCountAll({
            where: { visible: true },
            offset: _start,
            limit: _end - _start,
            order: [
                ['title', 'DESC']
            ],
            raw: false
        }).then(async (data) => {
            let rawData = data.rows.map((c) => c.dataValues)
            rawData = await Translator.translateArray({ modelName: db.models.Article.name, data: rawData, lang })
            res.status(200).send({ rows: rawData, count: data.count })
        })
    },
    getArticle: async (req, res) => {
        const { articleId } = req.params

        let validation = new Validator(req.params, { articleId: 'required|numeric' })
        if (validation.fails()) return res.status(500).send(validation.errors.all())

        const lang = !empty(req) ? req.get('Accept-Language') : ''
        let article = await db.models.Article.findOne({ where: { id: articleId } })
        if (empty(article)) return res.status(404).send()
        const tArticle = new Translator(lang, db.models.Article.name, articleId)
        article = await tArticle.translate(article)
        res.status(200).send(article)

    },
}

module.exports = Article;