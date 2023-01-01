const { BaseScene } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { $ad, $admin } = require('../connection/mongoose');
const { bot } = require('../connection/telegram');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');
const { admin_chat } = require('../helpers/utils');

const admin_add_balance_set_scene = new BaseScene('admin_add_balance_set_scene');
admin_add_balance_set_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_add_balance_set_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_add_balance").reply_markup
    });
});

admin_add_balance_set_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_add_balance_set_scene_request", {
        amount: ctx.session.amount
    }), yes_no_keyboard());
});

admin_add_balance_set_scene.action('no', async(ctx) => {
    return ctx.scene.enter("admin_add_balance_set_scene");
});

admin_add_balance_set_scene.action('yes', async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 })
    await admin.inc("balance", Number(ctx.session.amount));

    await bot.telegram.sendMessage(admin_chat, ctx.i18n.t("admin_add_balance_set_scene_done", {
        amount: ctx.session.amount
    }));

    await ctx.editMessageText(ctx.i18n.t("admin_add_balance_set_scene_done", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_add_balance").reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_add_balance_set_scene
}