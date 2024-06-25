const crypto = require('crypto')
const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
    .update('I love cupcakes')
    .digest('hex');
console.log(hash);

async function sha256(message) {

    // // encode as UTF-8
    // const msgBuffer = new TextEncoder().encode(message);

    // // hash the message
    // const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // // convert ArrayBuffer to Array
    // const hashArray = Array.from(new Uint8Array(hashBuffer));

    // // convert bytes to hex string                  
    // const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // return hashHex;
}
module.exports = sha256