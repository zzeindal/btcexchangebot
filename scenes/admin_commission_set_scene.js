const { bitcoinToFiat } = require('bitcoin-conversion');
const { BaseScene } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { $ad, $admin } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');

const admin_commission_set_scene = new BaseScene('admin_commission_set_scene');
admin_commission_set_scene.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_commission_set_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_commission_network`).reply_markup
    });
});

admin_commission_set_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_commission_network"));
    if (Number(ctx.message.text) >= 50000) return ctx.replyWithHTML(ctx.i18n.t("admin_commission_set_scene"), yes_no_keyboard());
    ctx.session.commission = Number(ctx.message.text);

    const admin = await $admin.findOne({ uid: 0 });
    if (ctx.scene.state.method === "withdrawal") {
        admin.withdrawal_commission_satoshi[ctx.scene.state.speed_id] = Number(ctx.message.text);
    } else {
        admin.sell_btc_commission_satoshi[ctx.scene.state.speed_id] = Number(ctx.message.text);
    }
    await admin.save();

    ctx.replyWithHTML(ctx.i18n.t("admin_commission_set_scene_finish"), back_keyboard("admin_commission_network"));

    return ctx.scene.leave();
});

admin_commission_set_scene.action('no', async (ctx) => {
    return ctx.scene.enter("admin_commission_set_scene");
});

admin_commission_set_scene.action('yes', async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    if (ctx.scene.state.method === "withdrawal") {
        admin.withdrawal_commission_satoshi[ctx.scene.state.speed_id] = Number(ctx.message.text);
    } else {
        admin.sell_btc_commission_satoshi[ctx.scene.state.speed_id] = Number(ctx.message.text);
    }

    await admin.save();
    await ctx.editMessageText(ctx.i18n.t("admin_commission_set_scene_finish"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_commission_network").reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_commission_set_scene
}