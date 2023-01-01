const { BaseScene } = require("telegraf");
const { $deal, $user, $income, $withdrawal } = require("../connection/mongoose");
const { back_keyboard, get_user_keyboard } = require("../helpers/keyboards");
const moment = require("moment");
const fromExponential = require('from-exponential');

const get_user_byId_scene = new BaseScene('get_user_byId_scene');
get_user_byId_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("get_user_byId_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_stats_users").reply_markup
    });
});

get_user_byId_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_stats_exchange"));
    const user = await $user.findOne({ id: Number(ctx.message.text) });
    if(!user) return ctx.replyWithHTML(ctx.i18n.t("no_user_byId"), back_keyboard("admin_stats_users").reply_markup);

    const buy = await $deal.find({ ownerId: user.id, method: "sell", status: 3 });
    const sell = await $deal.find({ ownerId: user.id, method: "buy", status: 3 });
    const cancel_buy = await $deal.find({ ownerId: user.id, method: "sell", status: 4 });
    const cancel_sell = await $deal.find({ ownerId: user.id, method: "buy", status: 4 });
    var amount_buy = 0;
    var amount_sell = 0;

    for(const deal of buy) {
        amount_buy+=deal.amount
    }
    for(const deal of sell) {
        amount_sell+=deal.amount
    }

    var income_sum = 0;
    var withdrawal_sum = 0;

    const incomes = await $income.find({ ownerId: user.id })
    var income_count = incomes.length;

    for (const income of incomes) {
        income_sum += income.amount;
    }

    const withdrawals = await $withdrawal.find({ ownerId: user.id });
    var withdrawal_count = withdrawals.length;
    for (const withdrawal of withdrawals) {
        withdrawal_sum += withdrawal.amount;
    }

    await ctx.replyWithHTML(ctx.i18n.t("get_user_byId_scene_done", {
        id: user.id,
        username: user.username,
        balance: user.balance,
        registration: moment(user.registration_date).format('MMMM Do YYYY, HH:mm:ss'),
        last_message: moment(user.last_message_date).format('MMMM Do YYYY, HH:mm:ss'),
        count_buy: buy.length,
        count_sell: sell.length,
        count_cancel_buy: cancel_buy.length,
        count_cancel_sell: cancel_sell.length,
        amount_buy: fromExponential(amount_buy),
        amount_sell: fromExponential(amount_sell),
        deposit_count: income_count,
        withdrawal_count: withdrawal_count,
        deposit_amount: fromExponential(income_sum),
        withdrawal_amount: fromExponential(withdrawal_sum),
        activeSessions: user.activeSessions.length
    }), (await get_user_keyboard(user.id, "get_user_byId")));

    return ctx.scene.leave();
});

module.exports = {
    get_user_byId_scene
}