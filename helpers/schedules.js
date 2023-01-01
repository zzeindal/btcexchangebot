const cron = require('node-cron');
const { $ad, $admin, $bonus, $voucher, $deal, $user } = require('../connection/mongoose');
const { bot, NPApi } = require('../connection/telegram');
const { admin_chat, btc_convert, statuses, saveIncome, split_number } = require('./utils');
const moment = require("moment");
const { admin_i_see_keyboard } = require('./keyboards');

cron.schedule('* * * * * *', async () => {
    const rub = await btc_convert(1);
    const ads = await $ad.find({ active: true, });

    for (const ad of ads) {
        if(ad.selling_rate_blockchain) {
            if(ad.selling_rate_blockchain_percent < 0) {
                await ad.set("selling_rate", rub - rub*(0-ad.selling_rate_blockchain_percent)/100);
            } else {
                await ad.set("selling_rate", rub + ((rub * ad.selling_rate_blockchain_percent) /100));
            }
        } 
        if(ad.buying_rate_blockchain) {
            if(ad.buying_rate_blockchain_percent < 0) {
                await ad.set("buying_rate", rub - rub*(0-ad.buying_rate_blockchain_percent)/100);
            } else {
                await ad.set("buying_rate", rub + ((rub * ad.buying_rate_blockchain_percent) /100));
            }
        }

        /*if (ad.buy_max > (ad.buy_balance + ad.balance_limit)) {
            await ad.set("buy_max", ad.buy_balance + ad.balance_limit);
        }*/

        if (ad.buy_active && (ad.buy_balance + ad.balance_limit) <= 0) {
            await ad.set("buy_active", false);
        }
    }


});

cron.schedule('*/15 * * * *', async () => {
    const ads = await $ad.find({ active: true, });
    const admin = await $admin.findOne({ uid: 0 });

    for (const ad of ads) {
        if (admin.lessbalance_notifications[0] > ad.buy_balance) {
            await bot.telegram.sendMessage(admin_chat, `
❗ВНИМАНИЕ! УВАГА! ATTENTION! DIQQAT! Заканчиваются деньги на способе оплаты ${ad.method}. Срочно пополните баланс способа оплаты!
@iron_flash
@bdhmj
@IronTim
@BolshushiyDyadyaMalchik`)
        }
    }
});



cron.schedule('*/5 * * * *', async () => {
    const users = await $user.find();

    const now = moment(new Date());

    for (const user of users) {
        for (const bonus of user.bonus) {
            const end = moment(bonus.finished_date);
            const duration = moment.duration(end.diff(now));
            const minutes = duration.asMinutes();
            if (minutes <= 0 || bonus.limit <= 0 || bonus.percent <= 0) {
                user.bonus.pop();

                await user.save();
            }
        }

        for (var i = 0; i < user.vouchers.length;i++) {
            const end = moment(user.vouchers[i].finished_date);
            const duration = moment.duration(end.diff(now));
            const minutes = duration.asMinutes();
            if (minutes <= 0 || user.vouchers[i].count <= 0) {
                user.vouchers.splice(i, 1);
                await user.save();
            }
        }
    }

    const bonuses = await $bonus.find({ active: true });
    for (const bonus of bonuses) {
        const end = moment(bonus.finished_date);
        const duration = moment.duration(end.diff(now));
        const minutes = duration.asMinutes();

        if (minutes <= 0) {
            await bonus.set("active", false);
        }
    }

    const vouchers = await $voucher.find({ active: true });
    for (const voucher of vouchers) {
        const end = moment(voucher.finished_date);
        const duration = moment.duration(end.diff(now));
        const minutes = duration.asMinutes();

        if (minutes <= 0) {
            await voucher.set("active", false);
        }
    }

    const result = await bot.telegram.getChatAdministrators(admin_chat);
    const admin = await $admin.findOne({ uid: 0 });

    for (const data of result) {
        if (!admin.admins.includes(data.user.id)) {
            admin.admins.push(data.user.id);
        }
    }

    await admin.save();
});

cron.schedule('*/5 * * * *', async () => {
    const now = moment().format();

    // удаление сообщения в разделе внести после 23 ч
    const users = await $user.find();
    for (const user of users) {
        if (user.message_for_delete_date && user.message_for_delete_date!=="-") {
            const end = moment(user.message_for_delete_date).add(23, 'hours');
            const duration = moment.duration(end.diff(now));
            const minutes = duration.asMinutes();
            if (minutes <= 0) {
                try {
                    await bot.telegram.deleteMessage(user.message_for_delete_ownerId, user.message_for_delete)
                } catch (err) { };

                await user.set("message_for_delete_date", "-");
            }
        }
    }

    const deals = await $deal.find();
    for (const deal of deals) {
        if (deal.status === 0 && deal.method === "buy") {
            const end = moment(deal.created_at).add(30, 'minutes');
            const duration = moment.duration(end.diff(now));
            const minutes = duration.asMinutes();
            const ad = await $ad.findOne({ uid: deal.ad_uid });
            if (minutes <= 0) {
                await bot.telegram.sendMessage(deal.senderId, `⛔️ <b>Сделка №${deal.uid} отменена в связи с истечением времени на оплату</b>`, { parse_mode: "HTML" });
                await deal.set("status", 4);
                await deal.set("finished", moment().format())
                await deal.set("why_canceled", "Время истекло");
                await bot.telegram.sendMessage(deal.senderId, `
📋📌 <b>Сделка №${deal.uid}</b>

<b>Статус:</b> ${statuses[deal.status]}
<b>Причина отмены:</b> ${deal.why_canceled}

<b>Создана:</b> ${moment(deal.created_at).format('MMMM Do YYYY, HH: mm')} (МСК)
<b>Завершена:</b> ${moment(deal.finished).format('MMMM Do YYYY, HH: mm')} (МСК)
<b>Сумма покупки:</b> ${deal.amount} BTC
<b>Сумма к оплате:</b> ${deal.amount_in_rub} RUB

<b>Реквизиты для оплаты:</b> 
    ${ad.method}
    <code>${ad.requisites}</code>`, { parse_mode: "HTML" });
            }
        }
        if (deal.status === 0 && deal.method === "sell") {
            const end = moment(deal.created_at).add(60, 'minutes');
            const duration = moment.duration(end.diff(now));
            const minutes = duration.asMinutes();

            if (minutes <= 0) {
                await bot.telegram.sendMessage(deal.senderId, `<b>Сделка №${deal.uid} отменена в связи с истечением времени на оплату</b>`, { parse_mode: "HTML" });
                await deal.set("status", 4);
                await deal.set("finished", moment().format());
                await deal.set("why_canceled", "Время истекло");
                await bot.telegram.sendMessage(deal.senderId, `
<b>📋📌 Сделка №${deal.uid}</b>

<b>Статус:</b> ${statuses[deal.status]}
<b>Причина отмены:</b> ${deal.why_canceled}

<b>Создана:</b> ${moment(deal.created_at).format('MMMM Do YYYY, HH: mm')} (МСК)
<b>Завершена:</b> ${moment(deal.finished).format('MMMM Do YYYY, HH: mm')} (МСК)
<b>Сумма продажи:</b> ${deal.amount} BTC

<b>Реквизиты для перевода:</b> ${deal.payment_btc_address}

<b>Реквизиты для оплаты:</b> ${ad.method}
  ${deal.requisites}`, { parse_mode: "HTML" });
            }
        }
    }
});



//cron.schedule('*/1 * * * *', async () => {
/*
    const deals = await $deal.find({ method: "sell", status: 5 });
    for (const deal of deals) {
        const result = await NPApi.getPaymentStatus({
            payment_id: deal.payment_id
        })

        if (result.payment_status === "finished" || result.payment_status === "sending") {
            const ad = await $ad.findOne({ uid: deal.ad_uid });

            if (result.actually_paid > deal.amount) {
                await deal.set("status", 4);
                await deal.set("why_canceled", "Неверная сумма. Деньги зачислены на баланс.");
                await deal.set("finished", moment().format());

                const user = await $user.findOne({ id: deal.ownerId });
                await user.inc("balance", result.actually_paid);
                await deal.set("user_balance", user.balance);

                const rub = await btc_convert(result.actually_paid);

                const uid = await saveIncome(user.id, result.actually_paid, rub, deal.payment_btc_address);
                await bot.telegram.sendMessage(deal.senderId, `
<b>⛔️ Сделка №${deal.uid} отменена.
Вы отправили на указанный адрес неверную сумму. Ваше пополнение зачислено на ваш баланс. Вы можете создать сделку заново, указав в качестве источника продажи баланс бота.</b>
`, { parse_mode: "HTML" });

                await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${result.actually_paid.toFixed(10)} BTC (примерно ${split_number(`${rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });
            } else if (result.actually_paid === deal.amount) {
                await deal.set("status", 2);

                await bot.telegram.sendMessage(ad.adminChat, `🔵 Новая сделка на покупку #${deal.uid}`, { reply_markup: admin_i_see_keyboard().reply_markup });
            } else {
                await deal.set("status", 4);
                await deal.set("why_canceled", "Неверная сумма. Деньги зачислены на баланс.")
                await deal.set("finished", moment().format());

                const user = await $user.findOne({ id: deal.ownerId });
                await user.inc("balance", result.actually_paid);
                await deal.set("user_balance", user.balance);

                const rub = await btc_convert(result.actually_paid);

                const uid = await saveIncome(user.id, result.actually_paid, rub, deal.payment_btc_address);
                await bot.telegram.sendMessage(deal.senderId, `
<b>⛔️ Сделка №${deal.uid} отменена.
Вы отправили на указанный адрес неверную сумму. Ваше пополнение зачислено на ваш баланс. Вы можете создать сделку заново, указав в качестве источника продажи баланс бота.</b>
`, { parse_mode: "HTML" });

                await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${result.actually_paid.toFixed(10)} BTC (примерно ${split_number(`${rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });
            }
        }

        if (result.payment_status === "expired") {
            const ad = await $ad.findOne({ uid: deal.ad_uid })
            await deal.set("status", 4);
            await deal.set("why_canceled", "Нет оплаты");
            await deal.set("finished", moment().format());

            await bot.telegram.sendMessage(deal.senderId, `
<b>📋📌 Сделка №${deal.uid}</b>

<b>Статус:</b> ${statuses[deal.status]}
<b>Причина отмены:</b> ${deal.why_canceled}

<b>Создана:</b> ${moment(deal.created_at).format('MMMM Do YYYY, HH: mm')} (МСК)
<b>Завершена:</b> ${moment(deal.finished).format('MMMM Do YYYY, HH: mm')} (МСК)
<b>Сумма продажи:</b> ${deal.amount} BTC

<b>Реквизиты для перевода:</b> ${deal.payment_btc_address}

<b>Реквизиты для оплаты:</b> ${ad.method}
  ${deal.requisites}`, { parse_mode: "HTML" });
        }
    }


    // проверяем те заявки продаж, когда пользователь перевел, но не нажал на оплачено
    const no_done_deals = await $deal.find({ method: "sell", status: 0 });

    for (const deal of no_done_deals) {
        const result = await NPApi.getPaymentStatus({
            payment_id: deal.payment_id
        })
        
        if (result.payment_status === "finished" || result.payment_status === "sending") {
            const admin = await $admin.findOne({ uid: 0 });
            if (result.actually_paid >= admin.min_insert) {
                await deal.set("status", 4);
                await deal.set("why_canceled", "Неверная сумма. Деньги зачислены на баланс.");
                await deal.set("finished", moment().format());

                const user = await $user.findOne({ id: deal.ownerId });
                await user.inc("balance", result.actually_paid);
                await deal.set("user_balance", user.balance);

                const rub = await btc_convert(result.actually_paid);

                const uid = await saveIncome(user.id, result.actually_paid, rub, deal.payment_btc_address);
                await bot.telegram.sendMessage(deal.senderId, `
<b>⛔️ Сделка №${deal.uid} отменена.
Вы отправили на указанный адрес неверную сумму. Ваше пополнение зачислено на ваш баланс. Вы можете создать сделку заново, указав в качестве источника продажи баланс бота.</b>
`, { parse_mode: "HTML" });

                await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${result.actually_paid.toFixed(10)} BTC (примерно ${split_number(`${rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });
            }
        }
    }

});
*/