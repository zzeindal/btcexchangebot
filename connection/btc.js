const CryptoAccount = require("send-crypto");

const privateKey = process.env.btc_private_key;
const btc_account = new CryptoAccount(privateKey);


module.exports = {
    btc_account
}
