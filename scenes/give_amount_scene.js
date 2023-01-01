const { BaseScene } = require("telegraf");
const { $user, $income } = require("../connection/mongoose");
const { bot } = require("../connection/telegram");
const { back_keyboard } = require("../helpers/keyboards");
const { saveIncome, btc_convert, split_number } = require("../helpers/utils");
const fromExponential = require('from-exponential');

const give_amount_scene = new BaseScene('give_amount_scene');
give_amount_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("give_amount_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`get_user_byId ${ctx.scene.state.id}`).reply_markup
    });
});

give_amount_scene.on('text', async(ctx)=> {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("get_user_byId"));
    const user = await $user.findOne({ id: ctx.scene.state.id });

    var rub = await btc_convert(Number(ctx.message.text));

    const uid = await saveIncome(user.id, Number(ctx.message.text), rub, "admin");

    const income = await $income.findOne({ uid: uid });

    await bot.telegram.sendMessage(user.id, `
<b>Пополнение</b> #${uid} <b>поступило!</b>
Ваш баланс <b>пополнен</b> на ${ctx.message.text} BTC (примерно ${split_number(`${rub.toFixed(2)}`)} RUB).`, { parse_mode: "HTML" });

    await user.inc("balance", Number(ctx.message.text))
    await user.set("balance", user.balance.toFixed(10))
    await income.set("user_balance", user.balance);

    await ctx.replyWithHTML(ctx.i18n.t("give_amount_scene_done", {
        amount: ctx.message.text,
        balance: fromExponential(user.balance),
    }), back_keyboard(`get_user_byId ${ctx.scene.state.id}`));

    return ctx.scene.leave();
})

module.exports = {
    give_amount_scene
}