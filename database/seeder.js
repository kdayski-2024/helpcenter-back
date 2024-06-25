const db = require('../database')
const empty = require('is-empty')
require('dotenv').config()

db.connection
    .authenticate()
    .then(async () => {
        let mode = process.argv[2] === 'c' ? 'clear' : 'up'
        console.log(`Run seeder with mode: ${mode}`)
        var normalizedPath = require("path").join(__dirname, "seeds")
        let models = {}
        require("fs").readdirSync(normalizedPath).forEach(function (file) {
            const fileName = file.split('.')[0];
            models[fileName] = require(`${normalizedPath}/${fileName}`);
        })

        for (model of Object.entries(models)) {
            const [modelName, modelData] = model
            if (mode === 'clear') {
                await db.models[modelName].destroy({
                    truncate: true,
                    restartIdentity: true
                })
                console.log(`  Clear ${modelName}`)
            }
            await db.models[modelName].bulkCreate(modelData)
            console.log(`  Insert in ${modelName} ${modelData.length} rows`)
        }
    })