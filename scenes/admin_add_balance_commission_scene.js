const { BaseScene } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { $ad, $admin } = require('../connection/mongoose');
const { bot } = require('../connection/telegram');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');
const { admin_chat } = require('../helpers/utils');

const admin_add_balance_commission_scene = new BaseScene('admin_add_balance_commission_scene');
admin_add_balance_commission_scene.enter(async (ctx) => {
    ctx.session.admin = await $admin.findOne({ uid: 0 })
    await ctx.editMessageText(ctx.i18n.t("admin_add_balance_commission_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_add_balance").reply_markup
    });
});

admin_add_balance_commission_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_add_balance"));
    if (Number(ctx.message.text) > ctx.session.admin.commission_balance) return ctx.replyWithHTML(ctx.i18n.t("admin_add_balance_commission_scene_error", {
        balance: ctx.session.admin.commission_balance
    }), back_keyboard("admin_add_balance"));
    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_add_balance_commission_scene", {
        amount: ctx.session.amount
    }), yes_no_keyboard());
});

admin_add_balance_commission_scene.action('no', async (ctx) => {
    return ctx.scene.enter("admin_add_balance_commission_scene");
});

admin_add_balance_commission_scene.action('yes', async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    await admin.inc("balance", Number(ctx.session.amount));
    await admin.dec("commission_balance", Number(ctx.session.amount));

    await ctx.editMessageText(ctx.i18n.t("admin_add_balance_commission_scene_done", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_add_balance").reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_add_balance_commission_scene
}