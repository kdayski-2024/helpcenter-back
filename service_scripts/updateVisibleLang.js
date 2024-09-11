const db = require(".././database")
db.connection.authenticate().then(async () => {
    await db.models.Category.update({ visible: true }, { where: {} })
    // await db.models.Article.update({ visibleLang: ['en', 'es', 'fr', 'ru'] }, { where: {} })
})