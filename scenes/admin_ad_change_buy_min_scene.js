const { BaseScene } = require('telegraf');
const { $ad } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');

const admin_ad_change_buy_min_scene = new BaseScene('admin_ad_change_buy_min_scene');
admin_ad_change_buy_min_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_min_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_method_check ${ctx.session.ad.uid}`).reply_markup
    });
});

admin_ad_change_buy_min_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.amount = Number(ctx.message.text);

    await ctx.replyWithHTML(ctx.i18n.t("admin_ad_change_buy_min_scene_request", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: yes_no_keyboard().reply_markup
    });
});

admin_ad_change_buy_min_scene.action('no', async (ctx) => {
    return ctx.scene.enter("admin_ad_change_buy_min_scene", { uid: ctx.session.ad.uid });
});

admin_ad_change_buy_min_scene.action('yes', async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });

    await ad.set("buy_min", ctx.session.amount);
    
    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_min_scene_done", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_method_check ${ctx.session.ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_ad_change_buy_min_scene
}