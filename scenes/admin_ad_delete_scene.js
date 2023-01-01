const { BaseScene } = require('telegraf');
const { $ad } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard, admin_method_check_keyboard } = require('../helpers/keyboards');

const admin_ad_delete_scene = new BaseScene('admin_ad_delete_scene');
admin_ad_delete_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    await ctx.editMessageText(ctx.i18n.t("admin_ad_delete_scene", {
        method: ctx.session.ad.method
    }), {
        parse_mode: "HTML",
        reply_markup: yes_no_keyboard().reply_markup
    });
});

admin_ad_delete_scene.action('no', async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_method_check"), {
        parse_mode: "HTML",
        reply_markup: (await admin_method_check_keyboard(ctx.session.ad.uid)).reply_markup
    });

    return ctx.scene.leave();
});

admin_ad_delete_scene.action('yes', async(ctx) => {
    await ctx.session.ad.set("active", false);
    
    await ctx.editMessageText(ctx.i18n.t("admin_ad_delete_scene_done", {
        method: ctx.session.ad.method
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_methods").reply_markup
    });
    
    return ctx.scene.leave();
});

module.exports = {
    admin_ad_delete_scene
}