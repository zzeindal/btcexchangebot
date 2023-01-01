const { BaseScene } = require('telegraf');
const { $ad } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard } = require('../helpers/keyboards');

const admin_ad_change_buying_rate_fixed_scene = new BaseScene('admin_ad_change_buying_rate_fixed_scene');
admin_ad_change_buying_rate_fixed_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    await ctx.editMessageText(ctx.i18n.t("ad_change_buying_rate_fixed_scene", {
        method: ctx.session.ad.method
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_ad_change_buying_rate ${ctx.session.ad.uid}`).reply_markup
    });
});

admin_ad_change_buying_rate_fixed_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.rate = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("ad_change_buying_rate_fixed_request", {
        rate: ctx.session.rate
    }), yes_no_keyboard());
});

admin_ad_change_buying_rate_fixed_scene.action('no', async (ctx) => {
    return ctx.scene.leave("admin_ad_change_buying_rate_fixed_scene", { uid: ctx.session.ad.uid });
});

admin_ad_change_buying_rate_fixed_scene.action('yes', async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });
    await ad.set("buying_rate", ctx.session.rate);
    await ad.set("buying_rate_blockchain", false);
    
    await ctx.editMessageText(ctx.i18n.t("ad_change_buying_rate_fixed_done", {
        rate: ctx.session.rate
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_method_check ${ctx.session.ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_ad_change_buying_rate_fixed_scene
}