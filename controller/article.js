const db = require('../database');
var empty = require('is-empty');
const Translator = require('../lib/translator');
let Validator = require('validatorjs');
const debug = require("debug")("article")

const Article = {
    getArticleMain: async (req, res) => {
        debug("getArticleMain")
        let validation = new Validator(req.query, { parentId: 'required|numeric' })
        if (validation.fails()) return res.status(500).send(validation.errors.all())
        
        const lang = !empty(req) ? req.get('Accept-Language') : ''
        const { parentId } = req.query
        let data = { rows: [] }
        
        let categories = await db.models.Category.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            order: [
                ['orderId', 'ASC']
            ]
        })

        categories = await Translator.translateArray({ modelName: db.models.Category.name, data: categories, lang })
        for (const category of categories) {
            category.articles = []
            category.categories = []
        }

        let articles = await db.models.Article.findAll({
            where: {visible:true},
            attributes: { exclude: ['createdAt', 'updatedAt', 'content'] },
        })

        articles = await Translator.translateArray({ modelName: db.models.Article.name, data: articles, lang })
        
        // Расталкиваем статьи в категории
        for (const article of articles) {
            const findedCategory = categories.find((o) => o.id == article.categoryId)
            if (!empty(findedCategory)) {
                findedCategory.articles.push(article)
            } else {
                debug(`Article ${article.id} not have category`)
            }
        }
        // Формируем главное дерево
        for (const category of categories) {
            if(parentId==0 ){
                if(category.parentId == 0)
                    data.rows.push(category)
            }else{
                if(category.id == parentId)
                    data.rows.push(category)
            }
        }
        for (const category of categories) {
            if (category.parentId != 0) {
                const findedCategory = data.rows.find((o) => o.id == category.parentId)
                if (!empty(findedCategory)) {
                    findedCategory.categories.push(category)
                } 
            }
        }
        res.status(200).send({ data })
    },
    getArticles: async (req, res) => {
        let validation = new Validator(req.query, { _end: 'required|numeric', _start: 'required|numeric' })
        if (validation.fails()) return res.status(500).send(validation.errors.all())

        const lang = !empty(req) ? req.get('Accept-Language') : ''
        const { _end = 5, _start = 0, categoryId } = req.query
        const articleWhere = { visible: true}
        if (!empty(categoryId)) {
            articleWhere.categoryId = categoryId
        }
        db.models.Article.findAndCountAll({
            where: articleWhere,
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