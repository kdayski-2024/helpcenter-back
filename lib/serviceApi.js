const crypto = require('crypto')
const systemSetting = require('./systemSetting')
const md5 = require('md5')
const axios = require('axios')
const empty = require('is-empty')

function signedParams(params, _env) {
    //https://test.main-api.evorich.pro/v1/readme/signature-test signature-test URL
    const timestamp = empty(params.timestamp) ? Date.now() : params.timestamp
    params.timestamp = timestamp
    const env = empty(_env) ? systemSetting.env() : _env
    const clearedParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => (v != null && !Array.isArray(v) && typeof v !== 'object')))
    const sortedParams = Object.keys(clearedParams).sort().reduce((result, key) => { result[key] = clearedParams[key]; return result }, {})
    const urledParams = new URLSearchParams(sortedParams)
    const filteredParams = urledParams.toString().replace(/\*/g, '%2A')
    const signature = crypto.createHmac('sha256', env.secret).update(filteredParams).digest('hex');
    params.signature = signature

    return params
}
function signedParamsMd5(params, _env) {
    const timestamp = empty(params.timestamp) ? Date.now() : params.timestamp
    params.timestamp = timestamp
    const env = empty(_env) ? systemSetting.env() : _env
    const clearedParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => (v != null && !Array.isArray(v) && typeof v !== 'object')))
    const sortedParams = Object.keys(clearedParams).sort().reduce((result, key) => { result[key] = clearedParams[key]; return result }, {})
    const filteredParams = Object.entries(sortedParams).map(o => o[1]).join('')
    const signature = md5(filteredParams + env.secret)
    params.signature = signature
    return params
}
function request(options, callback) {
    let { method = 'get', url, data = {}, headers = {}, sign = false } = options
    const env = systemSetting.env()
    headers = { ...headers, ...{ 'X-Service-Token': `${env.integratorId}:${env.accessToken}` } }
    if (sign)
        data = signedParams(data, env)
    url = `${env.serviceUrl}/${url}`

    switch (method.toLowerCase()) {
        case 'get':
            if (empty(callback)) {
                return axios({ method, url, data, headers })
            } else {
                axios({ method, url, data, headers }).then((res, err) => { callback(res, err) }).catch((err) => { callback({ success: false, data: {} }, err) })
            }
            break;
        case 'post':
            if (empty(callback)) {
                return axios.post(url, data, { headers })
            } else {
                axios.post(url, data, { headers }).then((res, err) => { callback(res, err) }).catch((err) => { callback({ success: false, data: {} }, err) })
            }
            break
        case 'put':
            if (empty(callback)) {
                return axios.put(url, data, { headers })
            } else {
                axios.put(url, data, { headers }).then((res, err) => { callback(res, err) }).catch((err) => { callback({ success: false, data: {} }, err) })
            }
            break
    }

}
async function getUserData(options) {
    return new Promise(async resolve => {
        let { userIds = [], fields = ['profile', 'info'], timeout = 30 } = options
        const nullStates = ['none_lastname', 'nonePatronymic']
        const needInfo = fields.includes('info') ? true : false

        let userPromises = []
        let count = 0
        const interval = setInterval(() => {
            if (count >= userIds.length) {
                clearInterval(interval);
            } else {
                const userId = userIds[count]
                userPromises.push(
                    request({
                        method: 'get',
                        url: 'user/profile',
                        sign: false,
                        data: { userId },
                    })
                )
                if (needInfo) {
                    userPromises.push(
                        request({
                            method: 'get',
                            url: 'user/info',
                            sign: false,
                            data: { userId },
                        })
                    )
                } else {
                    userPromises.push(0)
                }
                count++
            }
        }, timeout)

        await new Promise(resolve => setTimeout(() => resolve(), timeout * (userIds.length + 2)));
        const userPromisesResult = await Promise.allSettled(userPromises)
        let userDatas = []
        for (i = 0; i < userIds.length; i++) {
            const userProfilePromise = userPromisesResult[i * 2]
            const userInfoPromise = userPromisesResult[i * 2 + 1]
            let userData = { globalUserId: userIds[i], success: false }
            if ("status" in userProfilePromise && userProfilePromise.status == 'fulfilled') {

                userData.success = true
                const userProfile = userProfilePromise.value.data.data
                const profileLastName = userProfile.profileLastName == 'null' ? '' : userProfile.profileLastName
                const profileFirstName = userProfile.profileFirstName == 'null' ? '' : userProfile.profileFirstName
                const profilePatronymic = userProfile.profilePatronymic == 'null' ? '' : userProfile.profilePatronymic
                let partsUserFullName = []
                !~nullStates.indexOf(profileLastName) ? partsUserFullName.push(profileLastName) : ''
                !~nullStates.indexOf(profileFirstName) ? partsUserFullName.push(profileFirstName) : ''
                !~nullStates.indexOf(profilePatronymic) ? partsUserFullName.push(profilePatronymic) : ''
                userProfile.userFullName = partsUserFullName.join(' ')
                userData = { ...userData, ...userProfile }
            } else {
                console.log('!rejected')
            }
            if ("status" in userInfoPromise && userInfoPromise.status == 'fulfilled' && userInfoPromise.value !== 0) {
                userData = { ...userData, ...userInfoPromise.value.data.data }
            }
            userDatas.push(userData)
        }
        resolve(userDatas)
    })
}
module.exports = {
    signedParams, signedParamsMd5, request, getUserData
}
