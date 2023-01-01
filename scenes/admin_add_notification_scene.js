const { bitcoinToFiat } = require('bitcoin-conversion');
const { BaseScene } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { $ad, $admin } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');

const admin_add_notification_scene = new BaseScene('admin_add_notification_scene');
admin_add_notification_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_add_notification_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_balance").reply_markup
    });
});

admin_add_notification_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_add_notification_scene_request", {
        amount: ctx.session.amount
    }), yes_no_keyboard());
});

admin_add_notification_scene.action('no', async(ctx) => {
    return ctx.scene.enter("admin_add_notification_scene");
});

admin_add_notification_scene.action('yes', async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    for(const elem of admin.lessbalance_notifications) {
        admin.lessbalance_notifications.pop();
    }
    await admin.save();

    admin.lessbalance_notifications.push(ctx.session.amount);
    await admin.save();

    await ctx.editMessageText(ctx.i18n.t("admin_add_notification_scene_done", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_balance").reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_add_notification_scene
}