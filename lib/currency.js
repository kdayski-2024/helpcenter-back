const systemSetting = require('../lib/systemSetting')
let currencyLanguage = { "ru": "RUB", "en": "USD", "es": "EUR", "kk": "RUB", "zh": "USD", "de": "EUR", "it": "EUR", "hi": "USD", "vi": "USD", "mn": "USD" }
const init = async () => {
    currencyLanguage = await systemSetting.get('CURRENCY_LANGUAGE')
}
const convert = (options) => {
    const { lang, data } = options
    data.currency = currencyLanguage[lang]
    let price
    switch (data.currency) {
        case 'USD':
            data.newPrice = data.newPriceUsd
            data.oldPrice = data.oldPriceUsd
            break;
        case 'EUR':
            data.newPrice = data.newPriceEur
            data.oldPrice = data.oldPriceEur
            break;
        default:
            break;
    }
    delete data.newPriceUsd
    delete data.oldPriceUsd
    delete data.newPriceEur
    delete data.oldPriceEur
    return data
}
const currencyFromLang = (lang) => {
    return currencyLanguage[lang]
}
init()
module.exports = {
    convert, currencyFromLang
}
