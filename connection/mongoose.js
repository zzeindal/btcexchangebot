const mongo = require('mongoose');

const userSchema = new mongo.Schema({
    uid: Number,
    id: Number,
    username: String,
    first_name: String,
    balance: Number,
    password: String,
    secret_word: String,
    registration_date: String,
    last_message_date: String,
    vouchers: Array,
    bonus: Array,
    activeSessions: Array, //список тех, кто подключен к аккаунту
    banned: Boolean,
    registration_password: String, //пароль в рекламе, по которой перешел пользователь
    message_for_delete: Number, // удалить сообщение из внести
    message_for_delete_date: String, //дата и время последней нажатии на внести
    message_for_delete_ownerId: Number
});

const adminSchema = new mongo.Schema({
    uid: Number,
    admins: Array,
    min_insert: Number,
    min_withdrawal: Number,
    balance: Number,
    sell_balance: Number,
    commission_balance: Number,
    withdrawal_commission: Array,
    lessbalance_notifications: Array,
    withdrawal_commission_satoshi: Array,
    sell_btc_commission_satoshi: Array
});

const adSchema = new mongo.Schema({
    uid: Number,
    method: String,
    requisites: String,
    selling_rate: Number,
    selling_rate_blockchain: Boolean,
    selling_rate_blockchain_percent: Number,
    buying_rate: Number,
    buying_rate_blockchain: Boolean,
    buying_rate_blockchain_percent: Number,
    sell_min: Number,
    sell_max: Number,
    buy_min: Number,
    buy_max: Number,
    buy_balance: Number, //баланс в объявлении, который указывает макс кол-во биткоинов которые может купить пользователь
    sell_active: Boolean,
    balance_limit: Number,
    buy_active: Boolean,
    adminChat: Number,
    requisites_archive: Array,
    chat_link: String,
    active: Boolean
})

const dealSchema = new mongo.Schema({
    uid: Number,
    ad_uid: Number,
    ownerId: Number,
    senderId: Number,
    method: String,
    wallet: String,
    other_address: String,
    amount: Number,
    amount_in_rub: Number,
    bonus_amount: Number,
    bonus_limited: Number, //кол-во бонуса в рублях, которое было добавлено как бонус
    bonus_willBeDeleted: String,
    bonus_percent: Number,
    rate: Number,
    status: Number,
    finished: String,
    confirmed: String,
    created_at: String,
    message_id: Number,
    amount_nowpayments: Number,
    payment_btc_address: String,
    payment_id: String,
    requisites: String,
    why_canceled: String,
    administrator: String,
    bot_balance: Boolean,
    user_balance: Number //остаток по балансу пользователя
})

const chequeSchema = new mongo.Schema({
    uid: Number,
    ownerId: Number,
    amount: Number,
    amount_in_rub: Number,
    password: String,
    activated_by: Number,
    active: Boolean,
    created_at: String,
    finished: String,
    user_balance: Number, //остаток по балансу пользователя,
    activator_user_balance: Number
})

const incomeSchema = new mongo.Schema({
    uid: Number,
    ownerId: Number,
    amount: Number,
    amount_in_rub: Number,
    address: String,
    created_at: String,
    user_balance: Number //остаток по балансу пользователя
})

const withdrawalSchema = new mongo.Schema({
    uid: Number,
    ownerId: Number,
    amount: Number,
    amount_in_rub: Number,
    commission: Number,
    address: String,
    created_at: String,
    user_balance: Number //остаток по балансу пользователя
})

const advertisementSchema = new mongo.Schema({
    uid: Number,
    name: String,
    link_source: String,
    password: String,
    created_at: String,
    released_at: String,
    bonus: Array,
    active: Boolean
})

const bonusSchema = new mongo.Schema({
    uid: Number,
    purpose: String,
    limit: Number,
    percent: Number,
    finished_date: String,
    active: Boolean
});

const voucherSchema = new mongo.Schema({
    uid: Number,
    count: Number,
    finished_date: String,
    active: Boolean
});

const $user = mongo.model("Users", userSchema);
const $admin = mongo.model("Admin", adminSchema);
const $ad = mongo.model("Ads", adSchema);
const $deal = mongo.model("Deals", dealSchema);
const $cheque = mongo.model("Cheques", chequeSchema);
const $withdrawal = mongo.model("Withdrawals", withdrawalSchema);
const $income = mongo.model("Incomes", incomeSchema);
const $advertisement = mongo.model("Advertisements", advertisementSchema);
const $bonus = mongo.model("Bonus", bonusSchema);
const $voucher = mongo.model("Vouchers", voucherSchema);

console.log(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] [MONGOOSE] > Устанавливаем подключение...`)
mongo.connect('mongodb://127.0.0.1:27017/flash', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => { console.log(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] [MONGOOSE] > Подключение установлено.`) }).catch(err => console.log(err));

$user.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$user.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$user.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$admin.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$admin.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$admin.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$ad.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$ad.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$ad.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$deal.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$deal.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$deal.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$cheque.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$cheque.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$cheque.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$withdrawal.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$withdrawal.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$withdrawal.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$income.prototype.set = function(field, value) {
    this[field] = value;
    return this.save();
}
$income.prototype.inc = function(field, value) {
    this[field] += value;
    return this.save();
}
$income.prototype.dec = function(field, value) {
    this[field] -= value;
    return this.save();
}

$advertisement.prototype.set = function (field, value) {
    this[field] = value;
    return this.save();
}
$advertisement.prototype.inc = function (field, value) {
    this[field] += value;
    return this.save();
}
$advertisement.prototype.dec = function (field, value) {
    this[field] -= value;
    return this.save();
}

$bonus.prototype.set = function (field, value) {
    this[field] = value;
    return this.save();
}
$bonus.prototype.inc = function (field, value) {
    this[field] += value;
    return this.save();
}
$bonus.prototype.dec = function (field, value) {
    this[field] -= value;
    return this.save();
}

$voucher.prototype.set = function (field, value) {
    this[field] = value;
    return this.save();
}
$voucher.prototype.inc = function (field, value) {
    this[field] += value;
    return this.save();
}
$voucher.prototype.dec = function (field, value) {
    this[field] -= value;
    return this.save();
}

module.exports = {
	$user,
    $admin,
    $ad,
    $deal,
    $cheque,
    $withdrawal,
    $income,
    $advertisement,
    $bonus,
    $voucher
};