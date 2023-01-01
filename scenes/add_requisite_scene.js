const { BaseScene } = require('telegraf');
const { $ad } = require('../connection/mongoose');
const { yes_no_keyboard, back_keyboard } = require('../helpers/keyboards');

const add_requisite_scene = new BaseScene('add_requisite_scene');
add_requisite_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    await ctx.editMessageText(ctx.i18n.t("add_requisite_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_ad_change_requisites ${ctx.session.ad.uid}`).reply_markup
    })
});

add_requisite_scene.on('text', async(ctx) => {
    ctx.session.requisite = ctx.message.text;

    ctx.replyWithHTML(ctx.i18n.t("add_requisite_scene_request", {
        requisite: ctx.session.requisite
    }), yes_no_keyboard());
});

add_requisite_scene.action('no', (ctx) => {
    return ctx.scene.enter("add_requisite_scene", { uid: ctx.session.ad.uid });
});

add_requisite_scene.action('yes', async(ctx) => {
    ctx.session.ad.requisites_archive.push(ctx.session.requisite);
    await ctx.session.ad.save();

    await ctx.editMessageText(ctx.i18n.t("add_requisite_scene_done"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_ad_change_requisites ${ctx.session.ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    add_requisite_scene
}