const { BaseScene } = require('telegraf');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');
const { $admin } = require('../connection/mongoose');
const { btc_account } = require('../connection/telegram');

const admin_withdraw_balance_scene = new BaseScene('admin_withdraw_balance_scene');
admin_withdraw_balance_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_withdraw_balance_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_balance").reply_markup
    });;
});

admin_withdraw_balance_scene.on('text', (ctx) => {
    ctx.session.address = ctx.message.text;

    return ctx.scene.enter("admin_withdraw_balance_scene_2")
});

const admin_withdraw_balance_scene_2 = new BaseScene('admin_withdraw_balance_scene_2');
admin_withdraw_balance_scene_2.enter(async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    ctx.replyWithHTML(ctx.i18n.t("admin_withdraw_balance_scene_2", {
        amount: admin.balance,
    }), back_keyboard("back"));
});

admin_withdraw_balance_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("admin_withdraw_balance_scene")
});

admin_withdraw_balance_scene_2.on('text', async (ctx)=> {
    const admin = await $admin.findOne({ uid: 0 });

    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    if(Number(ctx.message.text) > admin.balance) return ctx.replyWithHTML(ctx.i18n.t("admin_withdraw_balance_scene_error"), back_keyboard("back"))

    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_withdraw_balance_scene_request", {
        amount: ctx.session.amount,
        address: ctx.session.address
    }), yes_no_keyboard());
});

admin_withdraw_balance_scene_2.action('yes', async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    if(Number(ctx.message.text) > admin.balance) return ctx.replyWithHTML(ctx.i18n.t("admin_withdraw_balance_scene_error"), back_keyboard("back"))

    await ctx.editMessageText(ctx.i18n.t("withdrawal_scene_pending", {
        uid: uid,
        amount: ctx.session.amount,
        address: ctx.session.address
    }), {
        reply_markup: back_keyboard("admin_add_balance").reply_markup
    });

    await ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_transaction_info"), true);

    const txHash = await btc_account
    .send(ctx.session.address, ctx.session.amount, "BTC")
    .on("transactionHash", console.log)

    return ctx.scene.leave();
});

admin_withdraw_balance_scene_2.action('no', (ctx) => {
    return ctx.scene.enter("admin_withdraw_balance_scene_2");
});

module.exports = {
    admin_withdraw_balance_scene,
    admin_withdraw_balance_scene_2
}