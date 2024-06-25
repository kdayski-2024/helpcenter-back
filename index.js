const express = require("express")
const cors = require("cors")
const crud = require("./lib/express-crud")
const db = require("./database")
const model = require("./lib/modelWrapper")(db.models)
const controller = require("./lib/controllerLoader")
const adminPanel = require("./lib/adminPanel")
const axios = require("axios")
const systemSetting = require("./lib/systemSetting")
const serviceApi = require("./lib/serviceApi")
const empty = require("is-empty")
require("dotenv").config()

const app = new express()
app.use(cors())
crud(app)

app.use(express.json({ limit: "50mb" }))
app.get("/", (req, res) => res.send("API v0.1"))

app.crud("article_crud", model.Article)
app.crud("category_crud", model.Category)
// app.crud("articles_crud", model.Article)
app.crud("manager_role", model.ManagerRole)
app.crud("manager_log", model.ManagerLog)
app.get("/article_list", controller.article.getArticles)
app.get("/article_main", controller.article.getArticleMain)
app.get("/article_full/:articleId", controller.article.getArticle)
app.get("/category_list", controller.category.getCategories)
app.post("/login", adminPanel.login)

app.post("/set_translate", controller.system.setTranslate)
app.get("/search", controller.system.search)
app.use("/assets", express.static("uploads"))


db.connection.authenticate().then(() => {
    let port = process.env.PORT || 30002
    if (process.argv[2] != undefined) port = process.argv[2]

    controller.system.init().then((res, err) => {
        if (err) {
            return console.error("Can't start app system.init error")
        }
        app.listen(port, async function () {
            console.log("BD API Server ready on port " + port)
            //!DEV

            // axios
            //     .post(
            //         `http://localhost:${port}/login`,
            //         {
            //             username: 'admin',
            //             password: '1',
            //         },
            //         {
            //             headers: {
            //             },
            //         }
            //     )
            //     .then(function (response) {
            //         // handle success
            //         console.log(response.data);
            //     })
            //     .catch(function (error) {
            //         // handle error
            //         console.log(error)
            //     })
            // axios
            //     .get(
            //         `http://localhost:${port}/set_translate/2`, {
            //             headers: {
            //                 "Accept-Language": "ru",
            //             },
            //     }
            //     )
            //     .then(function (response) {
            //         // handle success
            //         // console.log(response.data);
            //     })
            //     .catch(function (error) {
            //         // handle error
            //         console.log(error)
            //     })
            // axios
            //     .get(
            //         `http://localhost:${port}/article_main?`, {
            //         params: {
            //             parentId: 1
            //         },
            //         headers: {
            //             "Accept-Language": "en",
            //         },
            //     }
            //     )
            //     .then(function (response) {
            //         // handle success
            //         console.log(response.data);
            //     })
            //     .catch(function (error) {
            //         // handle error
            //         console.log(error)
            //     })
        })
    })
})
