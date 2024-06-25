const PDFDocument = require('pdfkit')
const fs = require('fs')
const pdf2img = require('pdf2img')
const empty = require('is-empty')
const UPLOAD_PATH = 'uploads'
const CERTIFICATE_PATH = 'certificates'
const fontPathMain = 'assets/certificates/EBGaramond-Bold.ttf'
const fontPathSecond = 'assets/certificates/Roboto-Light.ttf'
const typesPathDefault = process.env.CERT_TYPES_PATH || 'assets/certificates/types';
const defaultLang = 'en'
const acceptLangs = ['ru', 'en', 'es', 'it', 'hi', 'vi']
const allowedTypes = [0, 1, 2, 3, 4]
const db = require('../database/singleModel')(['Certificate', 'UserCertificate'])
const Translator = require('./translator')
const dateFormat = require("dateformat");

function Certificate(options) {

    if (!(this instanceof Certificate)) return new Certificate(options)

    let { lang, userId = '', userName = '', certificateId, courseId = '', courseName = '', date = '', certNumber = 0, typesPath = '', config } = options
    lang = empty(lang) ? defaultLang : lang
    lang = acceptLangs.indexOf(lang) == -1 ? defaultLang : lang

    this.lang = lang
    this.certificateId = certificateId
    this.userId = userId
    this.userName = userName
    this.courseId = courseId
    this.courseName = courseName
    this.date = date
    this.certNumber = certNumber
    this.typesPath = typesPath
    this.config = config
}
Certificate.getLastNumber = async () => {
    return new Promise(async (resolve, reject) => {
        const lastCert = await db.models.UserCertificate.findOne({
            order: [
                ['id', 'DESC']
            ]
        })

        let certNumber = 0
        if (!empty(lastCert)) certNumber = lastCert.id + 1
        resolve(certNumber)
    })

}
Certificate.prototype.createNumber = function createNumber(number) {
    // {последняя цифра года} {язык 0=ru ['ru', 'en', 'es', 'it', 'hi', 'vi']} {тип сертификата} {номер сертификата 5ти значный}
    number = number.toString().padStart(5, "0")
    let year = new Date()
    year = year.getFullYear().toString()
    year = year.substr(year.length - 1, year.length)
    let result = year + acceptLangs.indexOf(this.lang) + this.certificateId + number
    return result
}
Certificate.prototype.params = function params() {
    return new Promise(async (resolve, reject) => {
        let params = {}
        this.certNumber = empty(this.certNumber) ? await Certificate.getLastNumber() : this.certNumber
        params.certNumber = this.createNumber(this.certNumber)
        params.fileName = `${params.certNumber}_${this.userId}_${this.courseId}.pdf`
        params.filePath = `${UPLOAD_PATH}/${CERTIFICATE_PATH}/${params.fileName}`
        params.imageName = `${params.certNumber}_${this.userId}_${this.courseId}_1.jpg`
        params.imagePath = `${UPLOAD_PATH}/${CERTIFICATE_PATH}/${params.imageName}`
        params.date = !empty(this.date) ? this.date : dateFormat(new Date(), 'dd.mm.yyyy')
        params.lang = empty(this.lang) ? Translator.defaultLang : this.lang
        if (!empty(this.certificateId)) {
            let certificate = await db.models.Certificate.findOne({ where: { id: this.certificateId } })
            certificate = await new Translator(params.lang, db.models.Certificate.name, this.certificateId).translate(certificate)
            params.certificate = certificate
            if (!empty(certificate)) {
                if (empty(this.config)) {
                    try {
                        params.config = JSON.parse(certificate.config);
                    } catch (error) {
                        console.log('Error parse config')
                        reject({ error: 'Error parse config' })
                    }
                } else {
                    params.config = this.config
                }
                params.backgroundImage = `${UPLOAD_PATH}/${certificate.image}`
            }

        }
        resolve(params)
    })
}
Certificate.prototype.generate = function generate() {
    return new Promise(async (resolve, reject) => {
        // if (!~allowedTypes.indexOf(Number(this.type))) return reject('Not allowed type')
        // if (!~acceptLangs.indexOf(this.lang)) return reject('Not allowed language')
        const { certNumber, fileName, filePath, config, backgroundImage, date } = await this.params()

        if (empty(config)) return reject('Empty config')

        const doc = new PDFDocument({ size: config.document.size, layout: config.document.layout })

        let stream = doc.pipe(fs.createWriteStream(filePath, { flags: 'a' }))
        function jumpLine(doc, lines) {
            for (let index = 0; index < lines; index++) {
                doc.moveDown(0.5)
            }
        }
        function createText(doc, lines, text, size, color, textOptions = null) {
            textOptions = textOptions == null ? { align: 'center' } : textOptions
            jumpLine(doc, lines)
            doc
                .font(fontPathMain)
                .fontSize(size)
                .fill(color)
                .text(text, textOptions)
        }
        doc.image(backgroundImage, 0, 0, { cover: [doc.page.width, doc.page.height], })
        if (empty(config.userName.x)) {
            createText(doc, config.userName.yLinePosition, this.userName, config.userName.fontSize, config.userName.color)
        } else {
            doc
                .font(fontPathSecond)
                .fontSize(config.userName.fontSize)
                .fill(config.userName.color)
                .text(this.userName, config.userName.x, config.userName.y, {
                    columns: 1,
                    columnGap: 0,
                    height: 40,
                    width: config.userName.width,
                    align: 'center',
                })
        }
        if (!empty(config.textBlock)) {
            config.textBlock.forEach(element => {
                doc
                    .font(fontPathSecond)
                    .fontSize(element.fontSize)
                    .fill(element.color)
                    .text(element.value, element.x, element.y, {
                        columns: 1,
                        columnGap: 0,
                        height: 40,
                        width: element.width,
                        align: 'center',
                    })
            });
        }
        if (config.courseName.visible) {
            createText(doc, config.courseName.yLinePosition, this.courseName, config.courseName.fontSize, config.courseName.color)
        } else {
            jumpLine(doc, config.courseName.yLinePosition)
        }
        jumpLine(doc, config.date.yLinePosition)
        doc
            .font(fontPathSecond)
            .fontSize(config.date.fontSize)
            .fill(config.date.color)
            .text(date, config.date.x, config.date.y, {
                columns: 1,
                columnGap: 0,
                height: 40,
                width: empty(config.date.width) ? 82 : config.date.width,
                align: 'center',
            })
        jumpLine(doc, config.certificateNumber.yLinePosition)
        doc
            .font(fontPathSecond)
            .fontSize(10)
            .fill(config.certificateNumber.color)
            .text(certNumber, config.certificateNumber.x, config.certificateNumber.y, {
                columns: 1,
                columnGap: 0,
                height: 40,
                width: 82,
                align: 'center',
            })

        doc.end()
        const userId = this.userId
        const courseId = this.courseId

        stream.on('error', function (e) { console.log(e) })
        stream.on('finish', function () {
            // * CREATE THUMBNAIL
            pdf2img.setOptions({
                type: 'jpg',
                size: 1024,//2048
                density: 100,
                outputdir: `${UPLOAD_PATH}/${CERTIFICATE_PATH}`,
                outputname: `${certNumber}_${userId}_${courseId}`,
                page: null,
                quality: 70
            })

            pdf2img.convert(filePath, function (err, info) {
                if (err) {
                    console.log(err)
                    reject(err)
                }
                else {
                    resolve({ file: fileName, image: info.message[0].name })
                }
            })
        })
    })
}
module.exports = Certificate