const multer = require('multer')
const path = require('path')
const fs = require('fs')
const uploadSubDir = 'content'
const uploadDir = `uploads/${uploadSubDir}/`


const upload = multer({ dest: uploadDir }).single('file')
const init = (req, res) => {
    console.log(req.file)
    const fileName = Date.now() + '_' + (Math.random() + 1).toString(36).substring(6) + path.extname(req.file.originalname)
    const filePath = uploadDir + fileName
    fs.rename(req.file.path, filePath, function (err) {
        if (err) {
            console.log('ERROR: ' + err);
            return res.status(500).send({ success: false })
        } else {
            return res.status(200).send({ success: true, link: `${uploadSubDir}/${fileName}` })
        }
    });

}
module.exports = {
    upload, init
}