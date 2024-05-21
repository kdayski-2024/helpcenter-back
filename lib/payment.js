const empty = require('is-empty')
const axios = require('axios')
const crypto = require('crypto')
const db = require('../database')
const frontBillUrl = '/bill/'

function Payment() {

    if (!(this instanceof Payment)) {
        return new Payment()
    }
    this.payment = Payment.isActive()
    if (this.payment) {
        //TODO GET VARIABLES FROM SYSTEM SETTINGS
        this.serviceUrl = !empty(process.env.SERVICE_URL) ? process.env.SERVICE_URL : ''
        this.integratorId = !empty(process.env.INTEGRATOR_ID) ? process.env.INTEGRATOR_ID : ''
        this.secret = !empty(process.env.SECRET) ? process.env.SECRET : ''
        this.accessToken = !empty(process.env.ACCESS_TOKEN) ? process.env.ACCESS_TOKEN : ''
        this.frontUrl = !empty(process.env.FRONT_URL) ? process.env.FRONT_URL : ''
        this.cabinetRefId = !empty(process.env.PAYMENT_CABINET_REF_ID) ? process.env.PAYMENT_CABINET_REF_ID : ''
        this.payProviderCode = !empty(process.env.PAYMENT_PAY_PROVIDER_CODE) ? process.env.PAYMENT_PAY_PROVIDER_CODE : ''
    }
}
Payment.prototype.checkBillStatus = function checkBillStatus(data) {

}
Payment.prototype.createBill = function createBill(data) {
    return new Promise(async (resolve, reject) => {
        let { goods, userId, catalogIdsForPurchase } = data
        const timestamp = Date.now()
        await db.models.CartBill.destroy({ where: {} }) // !TEMP
        let cartBill = await db.models.CartBill.create({ userId, catalogId: catalogIdsForPurchase })
        cartBill = cartBill.dataValues
        console.log(cartBill)
        let params = {
            "userId": userId,
            "cabinetRefId": Number(this.cabinetRefId),
            "payProviderCode": this.payProviderCode,
            "goods": goods,
            "returnUrl": this.frontUrl + frontBillUrl,
            "timestamp": timestamp
        }
        const clearedParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => (v != null && !Array.isArray(v))))
        const sortedParams = Object.keys(clearedParams).sort().reduce((result, key) => { result[key] = clearedParams[key]; return result }, {})
        const urledParams = new URLSearchParams(sortedParams)
        console.log(urledParams.toString())

        const signature = crypto.createHmac('sha256', this.secret).update(urledParams.toString()).digest('hex');
        params.signature = signature
        console.log(params);

        axios.post(`${this.serviceUrl}/payment/goods-create-bill`, params, {
            headers: {
                'X-Service-Token': `${this.integratorId}:${this.accessToken}`
            }
        })
            .then(async (response) => {
                // console.log(response.data.data)
                if (!empty(response.data.data) && !empty(response.data.data.paymentUrl)) {
                    await db.models.CartBill.update({ billdId: response.data.data.billdId }, { where: { id: cartBill.id, userId } })
                    resolve({ success: true, 'paymentUrl': response.data.data.paymentUrl })
                } else {
                    resolve({ success: false })
                }

            })
            .catch((error) => {
                // handle error
                console.log(error.response.data)
                resolve({ success: false, error: error.response.data })

            })
    })
}
Payment.prototype.isActive = function isActive() {
    return this.payment
}
Payment.isActive = function isActive() {
    return !empty(process.env.PAYMENT) ? JSON.parse(process.env.PAYMENT.toLowerCase()) : false
}

module.exports = Payment;