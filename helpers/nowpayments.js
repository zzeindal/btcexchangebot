const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const { $user, $admin, $income } = require('../connection/mongoose');
const { bot } = require('../connection/telegram');
const { saveIncome, btc_convert, split_number } = require('./utils');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/api/payments/nowpayments', async function (req, res) {
    const data = req.body;
    if (data.payment_status === "failed" || data.payment_status === "finished") {
        const admin = await $admin.findOne({ uid: 0 });
        if (data.actually_paid < admin.min_insert) return;

        const user = await $user.findOne({ id: Number(data.order_description) });

        const rub = await btc_convert(data.actually_paid);
        const uid = await saveIncome(data.order_description, data.actually_paid, rub, data.pay_address);
        await user.inc("balance", data.actually_paid);

        const income = await $income.findOne({ uid: uid });
;       await income.set("user_balance", user.balance);

        await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${data.actually_paid} BTC (примерно ${split_number(`${rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });
        try {
            await bot.telegram.deleteMessage(user.message_for_delete_ownerId, user.message_for_delete);
        } catch (err) {}
        if (data.actually_paid > 0) {
            await user.inc("balance", data.actually_paid)
        }
    }
})

app.listen(80)