const { Keyboard } = require("telegram-keyboard");
const { $ad, $deal, $cheque, $user, $admin, $withdrawal, $income, $bonus } = require("../connection/mongoose");
const { bot, NPApi } = require("../connection/telegram");
const { change_password_keyboard, cancel_session_change_password_keyboard, profile_keyboard, cancel_session_error_keyboard, sessions_list_keyboard, sign_out_keyboard, main_keyboard, get_ads_keyboard, check_deal_keyboard, back_keyboard, balance_keyboard, cheque_keyboard, my_active_cheques_keyboard, delete_cheque_request_keyboard, banned_keyboard, open_deals_keyboard, deal_more_keyboard, set_password_keyboard, cancel_session_keyboard, insert_keyboard, agent_support_keyboard, admin_i_see_keyboard, deal_paid_keyboard, deal_cancel_keyboard, more_keyboard } = require("../helpers/keyboards");
const { getUser, statuses, botUsername, btc_convert, split_number, saveIncome } = require("../helpers/utils");
const moment = require("moment");
const Excel = require('exceljs');
const generator = require('generate-password');
const fromExponential = require('from-exponential');

bot.action("main", async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("main"), {
        parse_mode: "HTML",
        reply_markup: (await main_keyboard(ctx)).reply_markup
    })
});

bot.hears("🌐 Дополнительно", async (ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("more"), more_keyboard());
});

bot.action("balance", async(ctx)=>{
    const user = await getUser(ctx.from.id);
    await user.set("balance", user.balance.toFixed(10) > 0 ? user.balance.toFixed(10) : 0);


    const now = moment(new Date());
    const end = moment(user.registration_date);
    const duration = moment.duration(now.diff(end));
    const days = duration.asDays();

    for (const bonus of user.bonus) {
        const end = moment(bonus.finished_date);
        const duration = moment.duration(end.diff(now));
        const minutes = duration.asMinutes();
        if (minutes <= 0 || bonus.limit <= 0) {
            user.bonus.pop();

            await user.save();
        }
    }


    const rub = await btc_convert(user.balance);

    const deals = await $deal.find({ ownerId: user.id, active: false, status: 3 });
    var deal_btc = 0;
    var deal_rub = 0;
    for(const deal of deals) {
        deal_btc+=deal.amount;
        deal_rub+=deal.amount_in_rub;
    }

    deal_rub = deal_rub.toFixed(2);
    deal_btc = deal_btc.toFixed(10);

    const cancel_deals = await $deal.find({ ownerId: user.id, active: false, status: 4 });

    var vouchers = "";
    var bonus = "";

    if(user.vouchers.length !== 0) {
        vouchers +="<b>🆓 Ваучеры на бесплатный вывод:</b>";

        for(const voucher of user.vouchers) {
            vouchers += `\n- срок действия: до ${moment(voucher.finished_date).format('MMMM Do YYYY, HH:mm')} (МСК) (${voucher.count} шт.)`
        }
    }

    if(user.bonus.length !== 0 && user.bonus[0].percent > 0 && user.bonus[0].limit > 0) {
        bonus += "<b>💎 Бонус на покупку BTC активен.</b>\n"
        bonus += `<b>Лимит на сумму сделок:</b> ${user.bonus[0].limit} RUB\n`;
        bonus += `<b>Процент скидки:</b> ${user.bonus[0].percent}%\n`;
        bonus += `<b>Срок действия:</b> до ${moment(user.bonus[0].finished_date).format('MMMM Do YYYY, HH:mm')} (МСК)`
    }

    var user_balance_text = `${rub}`;
    var text = [];

    for (var i = user_balance_text.length - 1; i >= 0; i -= 3) {
        text.push(`${user_balance_text[i]}${user_balance_text[i - 1]}${user_balance_text[i - 2]}`)
    }

    text = text.reverse();

    for (var i = 0; i < text.length; i++) {
        text[i] = text[i].replace(/undefined/g, "");
    }

    ctx.replyWithHTML(ctx.i18n.t("balance", {
        btc: fromExponential(user.balance.toFixed(10)).replace(/0*$/, ""),
        rub: (await split_number(`${rub.toFixed(2)}`)),
        days: days.toFixed(),
        done: deals.length,
        cancel: cancel_deals.length,
        deal_btc: fromExponential(Number(deal_btc).toFixed(10)).replace(/0*$/, ""),
        deal_rub: split_number(`${Number(deal_rub).toFixed(2)}`),
        vouchers: vouchers,
        bonus: bonus
    }), (await balance_keyboard(ctx)));
});


bot.hears("🏦 Баланс", async (ctx) => {
    const user = await getUser(ctx.from.id);
    await user.set("balance", user.balance.toFixed(10));

    const now = moment(new Date());
    const end = moment(user.registration_date);
    const duration = moment.duration(now.diff(end));
    const days = duration.asDays();

    for (const bonus of user.bonus) {
        const end = moment(bonus.finished_date);
        const duration = moment.duration(end.diff(now));
        const minutes = duration.asMinutes();
        if (minutes <= 0 || bonus.limit <= 0) {
            user.bonus.pop();

            await user.save();
        }
    }

    const rub = await btc_convert(user.balance);

    const deals = await $deal.find({ ownerId: user.id, active: false, status: 3 });
    var deal_btc = 0;
    var deal_rub = 0;
    for (const deal of deals) {
        deal_btc += deal.amount;
        deal_rub += deal.amount_in_rub;
    }

    const cancel_deals = await $deal.find({ ownerId: user.id, active: false, status: 4 });

    var vouchers = "";
    var bonus = "";

    if (user.vouchers.length !== 0) {
        vouchers += "<b>🆓 Ваучеры на бесплатный вывод:</b>";

        for (const voucher of user.vouchers) {
            vouchers += `\n- срок действия: до ${moment(voucher.finished_date).format('MMMM Do YYYY, HH:mm')} (МСК) (${voucher.count} шт.)`
        }
    }

    if (user.bonus.length !== 0 && user.bonus[0].percent > 0 && user.bonus[0].limit > 0) {
        bonus += "<b>💎 Бонус на покупку BTC активен.</b>\n";
        bonus += `<b>Лимит на сумму сделок:</b> ${user.bonus[0].limit} RUB\n`;
        bonus += `<b>Процент скидки:</b> ${user.bonus[0].percent}%\n`;
        bonus += `<b>Срок действия:</b> до ${moment(user.bonus[0].finished_date).format('MMMM Do YYYY, HH:mm')} (МСК)`
    }

    ctx.replyWithHTML(ctx.i18n.t("balance", {
        btc: fromExponential(user.balance.toFixed(10)).replace(/0*$/, ""),
        rub: (await split_number(`${rub.toFixed(2)}`)),
        days: days.toFixed(),
        done: deals.length,
        cancel: cancel_deals.length,
        deal_btc: fromExponential(Number(deal_btc).toFixed(10)).replace(/0*$/, ""),
        deal_rub: split_number(`${deal_rub.toFixed(2)}`),
        vouchers: vouchers,
        bonus: bonus
    }), (await balance_keyboard(ctx)));
});

bot.action("insert", async (ctx) => {
    const user = await getUser(ctx.from.id);
    const admin = await $admin.findOne({ uid: 0 });
    const password = generator.generate({
        length: 15,
        numbers: true
    });

    const rub = await btc_convert(0.0003);

    const request = await NPApi.createPayment({
        order_id: password,
        price_amount: rub,
        pay_amount: 0.0003,
        price_currency: "rub",
        pay_currency: "btc",
        order_description: (user.id).toString(),
        ipn_callback_url: "http://85.192.48.6:80/api/payments/nowpayments"
    });
    ctx.session.payment_id = request.payment_id;

    const sender = await $user.findOne({ id: ctx.from.id });
    try {
        await bot.telegram.deleteMessage(ctx.from.id, sender.message_for_delete)
    } catch (err) { };

    const result = await bot.telegram.sendMessage(ctx.from.id, ctx.i18n.t("insert", {
        min: admin.min_insert,
        address: request.pay_address
    }), {
        parse_mode: "HTML",
        reply_markup: insert_keyboard().reply_markup
    });

    await sender.set("message_for_delete", result.message_id);
    await sender.set("message_for_delete_date", moment().format())
    await sender.set("message_for_delete_ownerId", ctx.from.id);
});

bot.action("withdrawal", async(ctx)=>{
    const user = await getUser(ctx.from.id);
    const admin = await $admin.findOne({ uid: 0 });
    if (user.banned) {
        return ctx.editMessageText(ctx.i18n.t("banned"), {
            parse_mode: "HTML",
            reply_markup: banned_keyboard().reply_markup
        });
    }

    if(user.balance < admin.min_withdrawal) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_error", {
        amount: admin.min_withdrawal
    }), true);

    return ctx.scene.enter("withdrawal_scene");
});

bot.action("profile", async (ctx) => {
    const user = await getUser(ctx.from.id);

    try {
        await ctx.editMessageText(ctx.i18n.t("profile", { id: user.id }), {
            parse_mode: "HTML",
            reply_markup: (await profile_keyboard(ctx.from.id, user.id)).reply_markup
        });
    } catch (err) {
        await ctx.deleteMessage();
        await ctx.replyWithHTML(ctx.i18n.t("profile", { id: user.id }), (await profile_keyboard(ctx.from.id, user.id)));
    }

})

bot.hears("🗃️ Мой аккаунт", async (ctx) => {
    const user = await getUser(ctx.from.id);

    ctx.replyWithHTML(ctx.i18n.t("profile", { id: user.id }), (await profile_keyboard(ctx.from.id, user.id)));
})

bot.action(/^create_password_(.+)$/i, async (ctx) => {
    if (ctx.match[1] === "balance") {
        ctx.replyWithHTML(ctx.i18n.t("create_password"), set_password_keyboard(ctx.match[1]));
    } else {
        await ctx.editMessageText(ctx.i18n.t("create_password"), {
            parse_mode: "HTML",
            reply_markup: set_password_keyboard(ctx.match[1]).reply_markup
        });
    }
});

bot.action(/^set_password_(.+)$/i, (ctx) => {
    return ctx.scene.enter("set_password_scene", { back: ctx.match[1] }); 
});

bot.action("change_password", (ctx) => {
    return ctx.scene.enter("change_password_scene", { back: "profile" });
});

bot.action("sign_in", (ctx) => {
    return ctx.scene.enter("sign_in_scene")
});

bot.action(/^cancel_session (\d+)$/i, async (ctx) => {
    const user = await getUser(ctx.from.id);

    if (user.activeSessions.includes(ctx.from.id)) {
        const main_index = user.activeSessions.indexOf(ctx.from.id);
        const index = user.activeSessions.indexOf(Number(ctx.match[1]));
        if (index < main_index || user.activeSessions.length === 1 || user.id === Number(ctx.match[1])) return ctx.answerCbQuery(ctx.i18n.t("session_revoked_error"), true);
        else if (ctx.from.id === Number(ctx.match[1])) {
            return ctx.editMessageText(ctx.i18n.t("cancel_session_revoked_error"), {
                parse_mode: "HTML",
                reply_markup: cancel_session_error_keyboard().reply_markup
            });
        }
    }

    const session_owner = await $user.findOne({ id: Number(ctx.match[1]) });

    await ctx.editMessageText(ctx.i18n.t("session_revoked_request", {
        username: (session_owner.username && session_owner.username !== "Без никнейма") ? `@${session_owner.username} (${session_owner.id})` : session_owner.id
    }), {
        parse_mode: "HTML",
        reply_markup: cancel_session_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/^cancel_session_yes (\d+)$/i, async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (!user.activeSessions.includes(ctx.from.id)) return ctx.answerCbQuery(ctx.i18n.t("session_already_revoked"), true);

    if (user.activeSessions.includes(ctx.from.id)) {
        const main_index = user.activeSessions.indexOf(ctx.from.id);
        const index = user.activeSessions.indexOf(Number(ctx.match[1]));
        if (index < main_index || ctx.from.id === Number(ctx.match[1])) return ctx.answerCbQuery(ctx.i18n.t("session_revoked_error"), true);
    }

    const index = user.activeSessions.indexOf(Number(ctx.match[1]));
    if (index > -1) {
        user.activeSessions.splice(index, 1);
        await user.save();
    }

    await ctx.editMessageText(ctx.i18n.t("session_revoked_done"), {
        parse_mode: "HTML"
    })
});

bot.action(/^cancel_session_change_password (\d+)$/i, async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (!user.activeSessions.includes(ctx.match[1])) return ctx.answerCbQuery(ctx.i18n.t("session_already_revoked"), true);

    if (user.activeSessions.includes(ctx.from.id)) {
        const main_index = user.activeSessions.indexOf(ctx.from.id);
        const index = user.activeSessions.indexOf(Number(ctx.match[1]));
        if (index < main_index || ctx.from.id === Number(ctx.match[1])) return ctx.answerCbQuery(ctx.i18n.t("session_revoked_error"), true);
        else if (ctx.from.id === Number(ctx.match[1])) {
            return ctx.editMessageText(ctx.i18n.t("cancel_session_revoked_error"), {
                parse_mode: "HTML",
                reply_markup: cancel_session_error_keyboard().reply_markup
            });
        }
    }

    const session_owner = await $user.findOne({ id: Number(ctx.match[1]) });

    ctx.replyWithHTML(ctx.i18n.t("session_revoked_request", {
        username: (session_owner.username && session_owner.username !== "Без никнейма") ? `@${session_owner.username} (${session_owner.id})` : session_owner.id
    }), cancel_session_change_password_keyboard(ctx.match[1]));
});

bot.action(/^cancel_session_change_password_yes (\d+)$/i, async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (!user.activeSessions.includes(ctx.match[1])) return ctx.answerCbQuery(ctx.i18n.t("session_already_revoked"), true);
    if (user.activeSessions.includes(ctx.from.id)) {
        const main_index = user.activeSessions.indexOf(ctx.from.id);
        const index = user.activeSessions.indexOf(Number(ctx.match[1]));
        if (index < main_index || ctx.from.id === Number(ctx.match[1])) return ctx.answerCbQuery(ctx.i18n.t("session_revoked_error"), true);
    }

    const index = user.activeSessions.indexOf(Number(ctx.match[1]));
    if (index > -1) {
        user.activeSessions.splice(index, 1);
        await user.save();
    }

    await ctx.editMessageText(ctx.i18n.t("session_revoked_owner"), {
        parse_mode: "HTML",
        reply_markup: change_password_keyboard().reply_markup
    })
});

bot.action("active_sessions", async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("active_sessions"), {
        parse_mode: "HTML",
        reply_markup: (await sessions_list_keyboard(ctx.from.id)).reply_markup
    });
})


bot.action("sign_out", async(ctx) => {
    const user = await getUser(ctx.from.id);
    if(user.activeSessions.includes(ctx.from.id)) {
        await ctx.editMessageText(ctx.i18n.t("sign_out"), {
            parse_mode: "HTML",
            reply_markup: sign_out_keyboard().reply_markup
        })
    }
});

bot.action("sign_out_yes", async (ctx) => {
    const user = await getUser(ctx.from.id);
    const index = user.activeSessions.indexOf(ctx.from.id);
    if (index > -1) {
        user.activeSessions.splice(index, 1);
        await user.save();
    }

    await ctx.editMessageText(ctx.i18n.t("sign_out_yes"), {
        parse_mode: "HTML"
    });
});

bot.action("buy", async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.editMessageText(ctx.i18n.t("banned"), {
            parse_mode: "HTML",
            reply_markup: banned_keyboard().reply_markup
        });
    }

    const ads = await $ad.find({ active: true, buy_active: true });
    if(ads.length === 0) return ctx.answerCbQuery(ctx.i18n.t("no_ads"), true);

    ctx.replyWithHTML(ctx.i18n.t("buy_start"), (await get_ads_keyboard("buy")));
});

bot.action("sell", async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.editMessageText(ctx.i18n.t("banned"), {
            parse_mode: "HTML",
            reply_markup: banned_keyboard().reply_markup
        });
    }

    const ads = await $ad.find({ active: true, sell_active: true});
    if (ads.length === 0) return ctx.answerCbQuery(ctx.i18n.t("no_ads"), true);

    ctx.replyWithHTML(ctx.i18n.t("sell_start"), (await get_ads_keyboard("sell")));
})

bot.hears("📕 Купить BTC", async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.replyWithHTML(ctx.i18n.t("banned"), banned_keyboard())
    }

    const ads = await $ad.find({ active: true, buy_active: true });
    if (ads.length === 0) return ctx.replyWithHTML(ctx.i18n.t("no_ads"));

    ctx.replyWithHTML(ctx.i18n.t("buy_start"), (await get_ads_keyboard("buy")));
});

bot.hears("📘 Продать BTC", async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.replyWithHTML(ctx.i18n.t("banned"), banned_keyboard());
    }

    const ads = await $ad.find({ active: true, sell_active: true });
    if (ads.length === 0) return ctx.replyWithHTML(ctx.i18n.t("no_ads"));

    ctx.replyWithHTML(ctx.i18n.t("sell_start"), (await get_ads_keyboard("sell")));
})

bot.action(/^check_deal (\d+) (.+)$/i, async (ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.replyWithHTML(ctx.i18n.t("banned"), banned_keyboard())
    }
    if(!ad.active || !ad[ctx.match[2] + '_active']) return ctx.answerCbQuery(ctx.i18n.t("no_active_ad"), true);

    var rate = Number(ad[ctx.match[2] + 'ing_rate']);
    var rate_text;

    if (user.bonus.length !== 0 && ctx.match[2] === "buy") {
        rate_text = `<b>📊 Курс обмена:</b> <del>${split_number(`${rate}`)}₽ → 1 BTC</del>\n<b>Курс обмена со скидкой:</b> ${split_number(`${(rate - (rate * user.bonus[0].percent / 100)).toFixed(2)}`)}₽ → 1 BTC`
    } else {
        rate_text = `<b>📊 Курс обмена:</b> ${split_number(`${rate.toFixed(2)}`)}₽ → 1 BTC`
    }

    const max_amount = fromExponential(ctx.match[2] === "buy" ? (ad.buy_max < 0 ? ad.buy_balance : (ad.buy_max > ad.buy_balance ? fromExponential(ad.buy_balance.toFixed(8)).replace(/0*$/, "") : ad.buy_max.toFixed(8).replace(/0*$/, ""))) : ad.sell_max);

    ctx.replyWithHTML(ctx.i18n.t("check_deal", {
        smile: ctx.match[2] === "sell" ? "📘" : "📕",
        purpose: ctx.match[2] === "sell" ? "Продажа" : "Покупка",
        rate_text: rate_text,
        min: fromExponential(ad[ctx.match[2] + '_min'].toFixed(8)).replace(/0*$/, ""),
        max: max_amount,
        min_rate_rub: split_number(`${(rate * ad[ctx.match[2] + '_min']).toFixed(2)}`),
        max_rate_rub: split_number(`${Number(max_amount * rate).toFixed(2)}`)
    }), check_deal_keyboard(ad.uid, ctx.match[2]));
});

bot.action(/^start_deal (\d+) (.+)$/i, async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.replyWithHTML(ctx.i18n.t("banned"), banned_keyboard())
    }

    if(!ad.active || !ad[ctx.match[2] + '_active']) return ctx.answerCbQuery(ctx.i18n.t("no_active_ad"), true);

    return ctx.scene.enter(`deal_${ctx.match[2]}_scene`, {
        uid: ad.uid,
        purpose: ctx.match[2],
        min: ad[ctx.match[2] + '_min'],
        max: ad[ctx.match[2] + '_min']
    });
});

bot.hears("🚀 Открытые сделки", async (ctx) => {
    const user = await getUser(ctx.from.id);
    const deals = await $deal.find({
        ownerId: user.id,

        $or: [
            { status: 0 },
            { status: 1 },
            { status: 2 },
            { status: 5 }
        ]
    })

    if (deals.length === 0) return ctx.replyWithHTML(ctx.i18n.t("open_deals_no"));
    ctx.replyWithHTML(ctx.i18n.t("open_deals"), (await open_deals_keyboard(user)));
});

bot.action("open_deals", async(ctx) => {
    const user = await getUser(ctx.from.id);

    const deals = await $deal.find({
        ownerId: user.id,

        $or: [
            { status: 0 },
            { status: 1 },
            { status: 2 },
            { status: 5 }
        ]
    })

    if (deals.length === 0) return ctx.answerCbQuery(ctx.i18n.t("open_deals_no"), true);
    await ctx.editMessageText(ctx.i18n.t("open_deals"), {
        parse_mode: "HTML",
        reply_markup: (await open_deals_keyboard(user)).reply_markup
    });
});

bot.action(/^deal_more (\d+)$/i, async(ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    if (deal.method === "sell") {
        if (deal.status === 3) {
            await ctx.editMessageText(ctx.i18n.t("deal_sell_finished", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                in_rub: deal.amount_in_rub
            }), (await deal_more_keyboard(deal.uid)));
        } else {
            await ctx.editMessageText(!deal.bot_balance ? ctx.i18n.t("deal_sell_scene_5", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                in_rub: deal.amount_in_rub,
                btc_address: deal.payment_btc_address,
                method: ad.method,
                requisites: deal.requisites
            }) : ctx.i18n.t("deal_sell_scene_5_bot_balance", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                in_rub: deal.amount_in_rub,
                method: ad.method,
                requisites: deal.requisites
            }), {
                parse_mode: "HTML",
                reply_markup: (await deal_more_keyboard(deal.uid)).reply_markup
            });
        }
    } else {
        await ctx.editMessageText(ctx.i18n.t("deal_buy_scene_deal_created", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            rub: deal.amount_in_rub,
            method: ad.method,
            requisites: ad.requisites,
            address: deal.requisites
        }), {
            parse_mode: "HTML",
            reply_markup: (await deal_more_keyboard(deal.uid)).reply_markup
        });
    }
});

bot.action(/^deal_paid_(.+) (\d+)$/i, async (ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("deal_paid_request"), deal_paid_keyboard(ctx.match[1], ctx.match[2]));
});

bot.action(/^deal_ok_paid_(.+) (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[2] });
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    if (deal.status === 4) {
        return ctx.editMessageText(ctx.i18n.t("deal_already_canceled", { uid: deal.uid }), {
            parse_mode: "HTML"
        });
    }

    if (ctx.match[1] === "buy") {
        await deal.set("status", 1);

        await ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_deal_created", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            rub: deal.amount_in_rub,
            method: ad.method,
            requisites: deal.requisites,
            address: deal.other_address
        }), {
            parse_mode: "HTML",
            reply_markup: agent_support_keyboard().reply_markup
        })

        await bot.telegram.sendMessage(ad.adminChat, ctx.i18n.t("deal_buy_scene_finish", { uid: deal.uid }), { parse_mode: "HTML", reply_markup: admin_i_see_keyboard().reply_markup });
    } else {
            await deal.set("status", 1);

            await ctx.replyWithHTML(!deal.bot_balance ? ctx.i18n.t("deal_sell_scene_5_confirmed", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                in_rub: deal.amount * deal.rate,
                btc_address: deal.payment_btc_address,
                method: ad.method,
                requisites: deal.requisites
            }) : ctx.i18n.t("deal_sell_scene_5_bot_balance_confirmed", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                in_rub: deal.amount * deal.rate
            }), {
                parse_mode: "HTML",
                reply_markup: agent_support_keyboard().reply_markup
            })
            await bot.telegram.sendMessage(ad.adminChat, ctx.i18n.t("deal_sell_scene_finish", { uid: deal.uid }), { parse_mode: "HTML", reply_markup: admin_i_see_keyboard().reply_markup });
    }
});

bot.action(/deal_cancel (\d+)$/i, (ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("deal_cancel_request"), deal_cancel_keyboard(ctx.match[1]));
});

bot.action(/deal_cancel_ok (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    const user = await getUser(ctx.from.id);
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    if (deal.status >= 4) {
        return ctx.editMessageText(ctx.i18n.t("deal_already_canceled", { uid: deal.uid }), {
            parse_mode: "HTML"
        });
    }
    if (deal.bot_balance && deal.method === "sell") {
        await user.inc("balance", deal.amount);
        await deal.set("user_balance", user.balance);
    }

    if (deal.bonus_willBeDeleted && !user.bonus[0]) { //вернем бонус если использован после отмены
        const count = await $bonus.countDocuments();
        let newBonus = new $bonus({
            uid: count + 1,
            purpose: `for ${user.id}`,
            limit: deal.bonus_limited,
            percent: deal.bonus_percent,
            finished_date: deal.bonus_willBeDeleted,
            active: true
        });

        await newBonus.save();

        user.bonus.push({
            uid: count + 1,
            percent: deal.bonus_percent,
            limit: deal.bonus_limited,
            finished_date: deal.bonus_willBeDeleted
        })

        await user.save();
    } else if (user.bonus[0]) {
        var temp = user.bonus[0];

        user.bonus.pop();
        await user.save();

        user.bonus.push({
            uid: temp.uid,
            percent: temp.percent,
            limit: Number(temp.limit) + Number(deal.bonus_limited),
            finished_date: temp.finished_date
        });

        await user.save();
    }

    await deal.set("status", 4);
    await deal.set("finished", moment().format())

    if (deal.method === "sell") {
        await ctx.replyWithHTML(`
<b>📋📌 Сделка №${deal.uid}</b>
<b>Статус:</b> ⛔ Отменена 

<b>Заявка создана:</b> ${moment(deal.created_at).format('MMMM Do YYYY, HH:mm')} (МСК)
<b>Заявка завершена:</b> ${moment(deal.finished).format('MMMM Do YYYY, HH:mm')} (МСК)
<b>Сумма продажи:</b> ${deal.amount} BTC
<b>Сумма к оплате:</b> ${deal.amount_in_rub} RUB

Реквизиты для оплаты:
<code>${deal.payment_btc_address}</code>`);
    } else {
        await ad.inc("buy_balance", deal.amount);
        await ctx.replyWithHTML(`
<b>📋📌 Сделка №${deal.uid}</b>
<b>Статус:</b> ⛔ Отменена 

<b>Заявка создана:</b> ${moment(deal.created_at).format('MMMM Do YYYY, HH:mm')} (МСК)
<b>Заявка завершена:</b> ${moment(deal.finished).format('MMMM Do YYYY, HH:mm')} (МСК)
<b>Сумма покупки:</b> ${deal.amount} BTC
<b>Сумма к оплате:</b> ${deal.amount_in_rub} RUB

Реквизиты для оплаты ${ad.method}:
<code>${ad.requisites}</code>`);
    }
})

bot.action("get_my_report", async(ctx) => {
    const user = await getUser(ctx.from.id);
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(`№${user.id}`);
    worksheet.columns = [
        { header: 'Создана', key: 'created' },
        { header: 'ID операции', key: 'operation_id' },
        { header: 'Статус заявки', key: 'status' },
        { header: 'Сумма', key: 'amount' },
        { header: 'Операция', key: 'operation' },
        { header: 'Кошелёк', key: 'wallet' },
        { header: 'Id источника', key: 'id' },
        { header: 'Приемник', key: 'receiver' },
        { header: 'Способ оплаты', key: 'payMethod' },
        { header: 'Остаток по балансу', key: 'remainder' }
    ];

    var data = [];

    const deals = await $deal.find({ ownerId: user.id });
    for (const deal of deals) {
        const ad = await $ad.findOne({ uid: deal.ad_uid });

        data.push({
            created: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            'operation_id': deal.uid,
            status: statuses[deal.status],
            amount: `${deal.amount} (${deal.amount_in_rub} RUB)`,
            operation: deal.method === "sell" ? "Продажа" : "Покупка",
            wallet: deal.wallet,
            id: user.id,
            receiver: deal.other_address ? deal.other_address : user.id,
            payMethod: deal.method === "sell" ? `${ad.method} (*${deal.requisites.substr(-4)})` : ad.method,
            remainder: Number(deal.user_balance).toFixed(10)
        })
    }

    const withdrawals = await $withdrawal.find({ ownerId: user.id });
    for (const withdrawal of withdrawals) {
        data.push({
            created: moment(withdrawal.created_at).format('MMMM Do YYYY, HH:mm'),
            'operation_id': withdrawal.uid,
            status: "-",
            amount: `${withdrawal.amount} (${withdrawal.amount_in_rub} RUB)`,
            operation: "Вывод средств",
            wallet: "Баланс",
            id: user.id,
            receiver: withdrawal.address,
            remainder: Number(withdrawal.user_balance).toFixed(10)
        })
    }

    const incomes = await $income.find({ ownerId: user.id });
    for (const income of incomes) {
        data.push({
            created: moment(income.created_at).format('MMMM Do YYYY, HH:mm'),
            'operation_id': income.uid,
            status: "-",
            amount: `${income.amount} (${income.amount_in_rub} RUB)`,
            operation: "Внесение средств",
            wallet: "Внешний кошелек",
            id: income.address,
            receiver: user.id,
            remainder: Number(income.user_balance).toFixed(10)
        })
    }

    const cheques = await $cheque.find();
    for (const cheque of cheques) {
        if (cheque.ownerId === user.id && cheque.activated_by) {
            data.push({
                created: moment(cheque.finished).format('MMMM Do YYYY, HH:mm'),
                'operation_id': cheque.uid,
                status: "-",
                amount: `${cheque.amount} (${cheque.amount_in_rub} RUB)`,
                operation: "Перевод (чек)",
                wallet: "Баланс бота",
                id: user.id,
                receiver: cheque.activated_by,
                remainder: Number(cheque.user_balance).toFixed(10)
            })
        }
        if (cheque.activated_by && cheque.activated_by === user.id) {
            data.push({
                created: moment(cheque.finished).format('MMMM Do YYYY, HH:mm'),
                'operation_id': cheque.uid,
                status: "-",
                amount: `${cheque.amount} (${cheque.amount_in_rub} RUB)`,
                operation: "Пополнение (чек)",
                wallet: "Баланс бота",
                id: cheque.ownerId,
                receiver: user.id,
                remainder: Number(cheque.activator_user_balance).toFixed(10)
            })
        }

    }

    data.sort((a, b) => {
        const created_date_a = moment(a.created, 'MMMM Do YYYY, HH:mm');
        const created_date_b = moment(b.created, 'MMMM Do YYYY, HH:mm');
        if (created_date_a > created_date_b) {
            return -1;
        }
        if (created_date_a < created_date_b) {
            return 1;
        }
        return 0;
    });

    for (const elem of data) {
        const temp = {
            "created": elem.created,
            "operation_id": elem.operation_id,
            "status": elem.status,
            "amount": elem.amount,
            "operation": elem.operation,
            "wallet": elem.wallet,
            "id": elem.id,
            "receiver": elem.receiver,
            "payMethod": elem.payMethod,
            "remainder": elem.remainder
        };

        await worksheet.addRow(temp).commit();
    }

    await workbook.xlsx.writeFile(`./files/reports/${ctx.from.id}.xlsx`);    

    if (data.length === 0) return ctx.answerCbQuery(ctx.i18n.t("get_finance_error"), true);

    try {
        await ctx.replyWithDocument({ source: `./files/reports/${user.id}.xlsx` }, {
            caption: ctx.i18n.t("get_finance", {
                id: user.id,
                date: moment().format("MMMM Do YYYY, HH:mm")
            }),
            parse_mode: "HTML"
        });
    } catch(err) {
        ctx.answerCbQuery(ctx.i18n.t("get_finance_error"), true);
    }
});

bot.action("cheque", async (ctx) => {
    const user = await getUser(ctx.from.id);

    if (user.banned) {
        return ctx.editMessageText(ctx.i18n.t("banned"), {
            parse_mode: "HTML",
            reply_markup: banned_keyboard().reply_markup
        });
    }
    ctx.replyWithHTML(ctx.i18n.t("cheque"), await cheque_keyboard(ctx.from.id))
});

bot.action("create_cheque", async(ctx) => {
    const user = await getUser(ctx.from.id);

    if (user.banned) {
        return ctx.editMessageText(ctx.i18n.t("banned"), {
            parse_mode: "HTML",
            reply_markup: banned_keyboard().reply_markup
        });
    }
    return ctx.scene.enter("create_cheque_scene_start")
});

bot.action("my_active_cheques", async(ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.banned) {
        return ctx.editMessageText(ctx.i18n.t("banned"), {
            parse_mode: "HTML",
            reply_markup: banned_keyboard().reply_markup
        });
    }
    const cheques = await $cheque.find({ ownerId: user.id, active: true });
    ctx.replyWithHTML(ctx.i18n.t("my_active_cheques", { count: cheques.length }), (await my_active_cheques_keyboard(ctx.from.id)))
});

bot.action(/^check_cheque (\d+)$/i, async(ctx) => {
    const cheque = await $cheque.findOne({ uid: ctx.match[1] });
    const split_result = await split_number(`${(await btc_convert(cheque.amount)).toFixed(2)}`)
    await ctx.editMessageText(ctx.i18n.t("create_cheque_scene_done", {
        amount: fromExponential(cheque.amount),
        rub: split_result,
        botUsername: botUsername,
        password: cheque.password
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("my_active_cheques").reply_markup
    });
});

bot.action(/^delete_cheque (\d+)$/i, async(ctx) => {
    const cheque = await $cheque.findOne({ uid: ctx.match[1] });
    const split_result = await split_number(`${(await btc_convert(cheque.amount)).toFixed(2)}`);

    await ctx.editMessageText(ctx.i18n.t("delete_cheque_request", {
        amount: fromExponential(cheque.amount),
        rub: split_result
    }), {
        parse_mode: "HTML",
        reply_markup: delete_cheque_request_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/^delete_cheque_ok (\d+)$/i, async(ctx) => {
    const cheque = await $cheque.findOne({ uid: ctx.match[1] });
    if(!cheque.active) return ctx.editMessageText(ctx.i18n.t("cheque_notActive"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("my_active_cheques").reply_markup
    });

    const user = await $user.findOne({ id: cheque.ownerId });
    const uid = await saveIncome(user.id, cheque.amount, cheque.amount_in_rub, "пополнение со своего чека");
    const income = await $income.findOne({ uid: uid });

    await user.inc("balance", cheque.amount);
    await cheque.set("active", false);
    await income.set("user_balance", user.balance);

    const split_result = await split_number(`${(await btc_convert(cheque.amount)).toFixed(2)}`);

    await ctx.editMessageText(ctx.i18n.t("delete_cheque_ok", {
        amount: fromExponential(cheque.amount),
        rub: split_result
    }), {
        parse_mode: "HTML"
    });
});
