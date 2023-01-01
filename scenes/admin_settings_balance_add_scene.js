const { BaseScene } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { $ad, $admin } = require('../connection/mongoose');
const { bot } = require('../connection/telegram');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');
const { admin_chat } = require('../helpers/utils');

const admin_settings_balance_add_scene = new BaseScene('admin_settings_balance_add_scene');
admin_settings_balance_add_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid })
    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_add_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_settings_balance ${ctx.session.ad.uid}`).reply_markup
    });
});

admin_settings_balance_add_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard(`admin_settings_balance ${ctx.session.ad.uid}`));
    if(Number(ctx.message.text) > ctx.session.ad.max_withdrawal) return ctx.replyWithHTML(ctx.i18n.t("admin_add_balance_sell_scene_error"), back_keyboard(`admin_settings_balance ${ctx.session.ad.uid}`));
    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_settings_balance_add_scene_request", {
        method: ctx.session.ad.method,
        amount: ctx.session.amount
    }), yes_no_keyboard());
});

admin_settings_balance_add_scene.action('no', async (ctx) => {
    return ctx.scene.enter("admin_settings_balance_add_scene", { uid: ctx.session.ad.uid })
});

admin_settings_balance_add_scene.action('yes', async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });

    await admin.dec("balance", Number(ctx.session.amount));
    await ad.inc("buy_balance", Number(ctx.session.amount));

/*    await bot.telegram.sendMessage(admin_chat, ctx.i18n.t("admin_settings_balance_add_scene_done", {
        method: ad.method,
        amount: ctx.session.amount
    }));
    */

    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_add_scene_done", {
        method: ad.method,
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_settings_balance ${ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_settings_balance_add_scene
}