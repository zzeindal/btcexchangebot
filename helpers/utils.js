
const { $user, $deal, $ad, $withdrawal, $advertisement, $income } = require('../connection/mongoose.js');
const moment = require("moment");
const sendRequest = require("send-request");

moment.locale("ru");

const admin_chat = process.env.admin_chat;
const nowpayments = process.env.nowpayments;
const botUsername = process.env.botUsername;
const btc_account_address = process.env.btc_account_address;
const support = process.env.support;
const btc_transfer_address = process.env.btc_transfer_address;

const statuses = {
  0: "🟡 Ожидает оплаты",
  1: "🔵 Ожидает подтверждения",
  2: "🟣 Выплачиваем",
  3: "🟢 Успешно завершена",
  4: "⛔️ Отменено"
}

const months = {
  0: "Январь",
  1: "Февраль",
  2: "Март",
  3: "Апрель",
  4: "Май",
  5: "Июнь",
  6: "Июль",
  7: "Август",
  8: "Сентябрь",
  9: "Октябрь",
  10: "Ноябрь",
  11: "Декабрь"
}

async function saveUser(ctx) {
    const count = await $user.countDocuments();
    let user = new $user({
        uid: count,
        id: ctx.from.id,
        username: ctx.from.username !== undefined ? ctx.from.username : 'Без никнейма',
        first_name: ctx.from.first_name,
        balance: 0.00,
        vouchers: 0,
        registration_date: moment(new Date()).format(),
        last_message_date: moment(new Date()).format(),
        activeSessions: [ctx.from.id],
        vouchers: [],
        bonus: [],
        banned: false
    })

    await user.save();

    return user;
}

async function getUser(id) {
    var session;
    const users = await $user.find();

    for (const user of users) {
        if (user.activeSessions[0] !== id && user.activeSessions.includes(id)) return user;
    }

    const user = await $user.findOne({ id: id });
    return user;
}

async function saveAd(name) {
  const count = await $ad.countDocuments();
    
  let newAd = new $ad({
      uid: count + 1,
      method: name,
      requisites: "-",
      selling_rate: 0,
      selling_rate_blockchain: false,
      selling_rate_blockchain_percent: 0,
      buying_rate: 0,
      buying_rate_blockchain: false,
      buying_rate_blockchain_percent: 0,
      sell_min: 0,
      sell_max: 0,
      buy_min: 0,
      buy_max: 0,
      buy_balance: 0,
      balance_limit: 0,
      sell_active: false,
      buy_active: false,
      adminChat: 0,
      requisites_archive: [],
      active: true
  });

  await newAd.save();

  return count + 1;
}

async function saveDeal_sell(ctx) {
    const count = await $deal.countDocuments();
    const user = await getUser(ctx.from.id);

    let deal = new $deal({
      uid: count,
      ad_uid: ctx.session.ad.uid,
      ownerId: user.id,
      senderId: ctx.from.id,
      method: "sell",
      wallet: ctx.session.bot ? "баланс" : "внешний адрес",
      amount: Number(ctx.session.amount).toFixed(8),
      amount_in_rub: Number(ctx.session.amount_in_rub).toFixed(2),
      requisites: ctx.session.requisites,
      payment_btc_address: ctx.session.address,
      rate: ctx.session.selling_rate,
      status: 0,
      finished: "-",
      created_at: moment().format(),
      why_canceled: "-",
      administrator: "-",
      bot_balance: ctx.session.bot,
      user_balance: user.balance
    });

    await deal.save();

    return deal;
}

async function saveDeal_buy(ctx) {
  const count = await $deal.countDocuments();
  const user = await getUser(ctx.from.id);

    console.log(ctx.session.amount)
  let deal = new $deal({
      uid: count,
      ad_uid: ctx.session.ad.uid,
      ownerId: user.id,
      senderId: ctx.from.id,
      method: "buy",
      wallet: ctx.session.bot ? "баланс" : "внешний адрес",
      requisites: ctx.session.ad.requisites,
      other_address: ctx.session.bot ? "на баланс бота" : ctx.session.address,
      amount: Number(ctx.session.amount).toFixed(8),
      amount_in_rub: Number(ctx.session.amount_in_rub).toFixed(2),
      rate: ctx.session.buying_rate,
      status: 0,
      finished: "-",
      created_at: moment().format(),
      why_canceled: "-",
      administrator: "-",
      bonus_amount: ctx.session.bonus_amount,
      bonus_limited: ctx.session.bonus_limited,
      bonus_willBeDeleted: ctx.session.bonus_willBeDeleted,
      bonus_percent: ctx.session.bonus_percent,
      user_balance: user.balance
  });

  await deal.save();

  return deal;
}

async function saveWithdrawal(ctx) {
    const count = await $withdrawal.countDocuments();
    const user = await getUser(ctx.from.id);

    let withdrawal = new $withdrawal({
        uid: count + 1,
        ownerId: user.id,
        amount: ctx.session.amount,
        amount_in_rub: ctx.session.amount_in_rub,
        commission: ctx.session.commission,
        address: ctx.session.address,
        created_at: moment().format()
    });

    await withdrawal.save();

    return count + 1;
}

async function saveIncome(id, amount, rub, address) {
    const count = await $income.countDocuments();
    const user = await getUser(id);

    let income = new $income({
        uid: count + 1,
        ownerId: user.id,
        amount: amount,
        amount_in_rub: rub,
        address: address,
        created_at: moment().format()
    });

    await income.save();

    return count + 1;
}

async function saveAdvertisement(ctx) {
    const count = await $advertisement.countDocuments();

    let advertisement = new $advertisement({
        uid: count + 1,
        name: ctx.session.name,
        link_source: ctx.session.link_source,
        password: ctx.session.password,
        created_at: moment().format(),
        released_at: moment(ctx.session.date, "DD.MM.YYYY - HH:mm").format(),
        bonus: [],
        active: true
    });

    await advertisement.save();
}

async function btc_convert(amount) {
    if (amount === 0) return 0;

    const req = await sendRequest(`https://api.coinconvert.net/convert/btc/rub?amount=${amount}`);
    return req.json.RUB;
}

function reverseString(str) {
    return str.split("").reverse().join("");
}

function split_number(str) {
    var temp = str.split('.');

    var text = [];

    for (var i = temp[0].length - 1; i >= 0; i -= 3) {
        text.push(`${str[i]}${str[i - 1]}${str[i - 2]}`)
    }

    for (var i = 0; i < text.length; i++) {
        text[i] = text[i].replace(/undefined/g, "");
        text[i] = reverseString(text[i])
    }

    text = text.reverse();
    if (temp[1]) {
        return text.join(' ') + `.` + temp[1];
    } else {
        return text.join(' ');
    }
}

function check_letters(str) {
    var regexp = /[а-яё]/i;
    return regexp.test(str);
}


module.exports = {
    admin_chat,
    nowpayments,
    botUsername,
    support,
    btc_account_address,
    btc_transfer_address,
    statuses,
    months,
    saveUser,
    getUser,
    saveAd,
    saveDeal_sell,
    saveDeal_buy,
    saveWithdrawal,
    saveIncome,
    saveAdvertisement,
    btc_convert,
    split_number,
    check_letters
}