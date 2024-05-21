const Translator = require("../lib/translator")
const fs = require("fs")
const empty = require("is-empty")
const debug = require("debug")("crud")
module.exports = function (models) {
    let preparedModels = {}
    const IMAGE_FIELDS = ["image"]
    const FILE_FIELDS = ["file"]
    const IMAGE_FOLDER = "uploads"
    const FILE_FOLDER = "uploads/files"
    for (const [key, value] of Object.entries(models)) {
        let model = models[key]
        preparedModels[key] = {
            name: key,
            create: function (query, req, data, cb) {
                debug("CRUD create")
                model.create(data).then((res) => {
                    // workWithFiles(model, res.dataValues.id, req, data, cb)
                    cb(null, res)
                })
            },
            delete: function (id, query, cb) {
                debug("CRUD delete")
                model
                    .destroy({
                        where: {
                            id,
                        },
                    })
                    .then((res) => {
                        cb(null, res)
                    })
            },
            read: function (req, cb) {
                debug(`CRUD read ${model.name}`)
                let query = req.query
                let modelFields = []
                for (let key in model.rawAttributes) {
                    modelFields.push(key)
                }
                // check if query with fields example ?id=1
                let hasFieldInQuery = false
                let queryObject = {}
                for (let key in query) {
                    if (~modelFields.indexOf(key)) {
                        queryObject[key] = query[key]
                        hasFieldInQuery = true
                    }
                }

                if (hasFieldInQuery) {
                    model
                        .findAndCountAll({
                            where: queryObject,
                            raw: false,
                        })
                        .then((res) => {
                            cb(null, res)
                        })
                } else {
                    const { _end, _order, _sort, _start } = query
                    model
                        .findAndCountAll({
                            offset: _start,
                            limit: _end,
                            order: [[_sort, _order]],
                            raw: false,
                        })
                        .then((res) => {
                            //TODO optimise translator
                            let translations = []
                            for (i in res.rows) {
                                let row = res.rows[i]
                                let t = new Translator(
                                    req.get("Accept-Language"),
                                    model.name,
                                    row.dataValues.id
                                )
                                translations.push(t.translate(row.dataValues))
                            }
                            Promise.all(translations).then((data) => {
                                cb(null, { count: res.count, rows: data })
                            })
                        })
                }
            },
            readById: function (id, query, req, cb) {
                debug("CRUD readById")
                const t = new Translator(
                    req.get("Accept-Language"),
                    model.name,
                    id
                )

                model.findByPk(id).then((res) => {
                    t.translate(res).then((r) => {
                        cb(null, r)
                    })
                })
            },
            update: function (id, query, req, data, cb) {
                debug("CRUD update")
                workWithFiles(model, id, req, data, cb)
            },
        }
    }
    function workWithFiles(model, id, req, data, cb) {
        for (let i in IMAGE_FIELDS) {
            const imageField = IMAGE_FIELDS[i]
            if (~Object.keys(data).indexOf(imageField) && Array.isArray(data[imageField])) {

                debug("has uploaded images")
                for (let j = 0; j < data[imageField].length; j++) {
                    const element = data[imageField][j];
                    if (typeof element === 'object') {
                        try {
                            var matches = data[imageField][j].base64.match(
                                /^data:([A-Za-z-+\/]+);base64,(.+)$/
                            )
                            if (matches.length !== 3) {
                                return new Error("Invalid input string")
                            }
                            const fileType = matches[1].split("/")[1]
                            const fileBase = matches[2]
                            const fileName = `${element.newName}.${fileType}`
                            fs.writeFile(
                                `./${IMAGE_FOLDER}/${fileName}`,
                                fileBase,
                                "base64",
                                function (err) {
                                    if (err) debug(err)
                                }
                            )
                            delete data[imageField][j]
                            debug("uploaded image url: " + fileName)
                            data[imageField][j] = fileName
                        } catch (error) {
                            debug(error)
                        }
                    }
                }

            } else {
                delete data[imageField]
            }
            delete data['images']
        }


        Translator.update({
            req,
            table: model.name,
            docId: id,
            data,
        }).then((r) => {
            console.log(r)
            model
                .update(r, {
                    where: {
                        id,
                    },
                })
                .then(() => {
                    model.findByPk(id).then((res) => {
                        cb(null, res)
                    })
                })
        })
    }
    return preparedModels
}
function deepEqual(x, y) {
    return (x && y && typeof x === 'object' && typeof y === 'object') ?
        (Object.keys(x).length === Object.keys(y).length) &&
        Object.keys(x).reduce(function (isEqual, key) {
            return isEqual && deepEqual(x[key], y[key]);
        }, true) : (x === y);
}
