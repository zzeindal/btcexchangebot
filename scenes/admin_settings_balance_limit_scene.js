const { bitcoinToFiat } = require('bitcoin-conversion');
const { BaseScene } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { $ad, $admin } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');

const admin_settings_balance_limit_scene = new BaseScene('admin_settings_balance_limit_scene');
admin_settings_balance_limit_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_limit_scene", {
        method: ctx.session.ad.method
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_settings_balance ${ctx.session.ad.uid}`).reply_markup
    });
});

admin_settings_balance_limit_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_settings_balance_limit_scene_request", {
        amount: ctx.session.amount,
        method: ctx.session.ad.method
    }), yes_no_keyboard());
});

admin_settings_balance_limit_scene.action('no', async (ctx) => {
    return ctx.scene.enter("admin_settings_balance_limit_scene", { uid: ctx.session.ad.uid });
});

admin_settings_balance_limit_scene.action('yes', async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });
    await ad.set("balance_limit", ctx.session.amount);
    
    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_limit_scene_done", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_settings_balance ${ctx.session.ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_settings_balance_limit_scene
}