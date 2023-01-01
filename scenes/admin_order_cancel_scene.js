const { BaseScene } = require("telegraf");
const { $admin, $deal, $user, $ad } = require("../connection/mongoose");
const { bot } = require("../connection/telegram");
const { back_keyboard, agent_support_keyboard } = require("../helpers/keyboards");
const { statuses, getUser, saveIncome, split_number } = require("../helpers/utils");
const moment = require("../node_modules/moment/moment");

const admin_order_cancel_scene = new BaseScene('admin_order_cancel_scene');
admin_order_cancel_scene.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_order_cancel_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_check_order ${ctx.scene.state.uid}`).reply_markup
    });
});

admin_order_cancel_scene.on('text', async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.scene.state.uid });
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    const user = await getUser(ctx.from.id);

    await deal.set("why_canceled", ctx.message.text);
    await deal.set("finished", moment().format());
    await deal.set("administrator", ctx.from.username);

    if (deal.method === "buy") {
        await ad.inc("buy_balance", deal.amount);

        await deal.set("status", 4);
        await bot.telegram.sendMessage(deal.ownerId, ctx.i18n.t("deal_buy_scene_deal_created_cancel", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            finished: moment(deal.finished).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            rub: deal.amount_in_rub,
            method: ad.method,
            requisites: deal.requisites,
            address: deal.other_address ? deal.other_address : "-",
            canceled: ctx.message.text
        }), {
            parse_mode: "HTML",
            reply_markup: agent_support_keyboard().reply_markup
        })
    } else {
        var first_status = deal.status;

        await deal.set("status", 4);
        await bot.telegram.sendMessage(deal.ownerId, !deal.bot_balance ? ctx.i18n.t("deal_sell_scene_5_cancel", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            finished: moment(deal.finished).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            in_rub: (deal.amount * deal.rate).toFixed(2),
            btc_address: deal.payment_btc_address,
            method: ad.method,
            requisites: deal.requisites,
            canceled: ctx.message.text
        }) : ctx.i18n.t("deal_sell_scene_5_cancel_bot_balance", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            finished: moment(deal.finished).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            in_rub: (deal.amount * deal.rate).toFixed(2),
            canceled: ctx.message.text
        }), {
            parse_mode: "HTML",
            reply_markup: agent_support_keyboard().reply_markup
        })

        if (deal.bot_balance) {
            await user.inc("balance", deal.amount);
            await deal.set("balance", user.balance);

            const uid = await saveIncome(user.id, deal.amount, deal.amount_in_rub, "admin");
            await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${deal.amount.toFixed(10)} BTC (примерно ${split_number(`${deal.amount_in_rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });
        } else {
            if (first_status === 2) {
                await user.inc("balance", deal.amount);
                await deal.set("balance", user.balance);

                const uid = await saveIncome(user.id, deal.amount, deal.amount_in_rub, deal.payment_btc_address);
                await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${deal.amount.toFixed(10)} BTC (примерно ${split_number(`${deal.amount_in_rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });
            }
        }
    }

    ctx.replyWithHTML(ctx.i18n.t("admin_order_cancel_scene_finish"), back_keyboard(`admin_check_order ${ctx.scene.state.uid}`));
    return ctx.scene.leave();
});

module.exports = {
    admin_order_cancel_scene
}