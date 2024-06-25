var normalizedPath = require("path").join(__dirname, "../controller");
// Load all models from model folder
require("fs").readdirSync(normalizedPath).forEach(function (file) {
    const fileName = file.split('.')[0];
    module.exports[fileName] = require('../controller/' + fileName);
});
