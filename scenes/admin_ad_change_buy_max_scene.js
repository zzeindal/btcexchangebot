const { BaseScene } = require('telegraf');
const { $ad } = require('../connection/mongoose');
const { back_keyboard, yes_no_keyboard, max_hand_keyboard } = require('../helpers/keyboards');

const admin_ad_change_buy_max_scene = new BaseScene('admin_ad_change_buy_max_scene');
admin_ad_change_buy_max_scene.enter(async(ctx) => {    
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_max_scene"), {
        parse_mode: "HTML",
        reply_markup: max_hand_keyboard(ctx.session.ad.uid).reply_markup
    });
});

admin_ad_change_buy_max_scene.action('max', async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_max_scene_request"), {
        parse_mode: "HTML",
        reply_markup: yes_no_keyboard().reply_markup
    });
});

admin_ad_change_buy_max_scene.action('hand', (ctx) => {
    return ctx.scene.enter("admin_ad_change_buy_max_scene_2")
});

admin_ad_change_buy_max_scene.action('no', async(ctx) => {
    return ctx.scene.enter("admin_ad_change_buy_max_scene", { uid: ctx.session.ad.uid });
});

admin_ad_change_buy_max_scene.action('yes', async (ctx) => {
    if (ctx.session.ad.buy_balance < ctx.session.ad.buy_min) return ctx.answerCbQuery(ctx.i18n.t("admin_ad_change_max_error"), true);
    await ctx.session.ad.set("buy_max", -1);
    
    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_max_scene_done"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_method_check ${ctx.session.ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});

const admin_ad_change_buy_max_scene_2 = new BaseScene('admin_ad_change_buy_max_scene_2');
admin_ad_change_buy_max_scene_2.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_max_scene_2"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("back").reply_markup
    });
});

admin_ad_change_buy_max_scene_2.action("back", (ctx) => {
    return ctx.scene.enter("admin_ad_change_buy_max_scene", { uid: ctx.session.ad.uid });
});

//ctx.session.ad.buy_balance < Number(ctx.message.text) ? ctx.session.ad.buy_balance + ctx.session.ad.balance_limit : Number(ctx.message.text);
admin_ad_change_buy_max_scene_2.on("text", (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    if (Number(ctx.message.text) < ctx.session.ad.buy_min) return ctx.replyWithHTML(ctx.i18n.t("admin_ad_change_max_error"), back_keyboard("back"));

    ctx.session.amount = Number(ctx.message.text);

    ctx.replyWithHTML(ctx.i18n.t("admin_ad_change_buy_max_scene_2_request", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: yes_no_keyboard().reply_markup
    });
});

admin_ad_change_buy_max_scene_2.action('no', async(ctx) => {
    return ctx.scene.enter("admin_ad_change_buy_max_scene")
});

admin_ad_change_buy_max_scene_2.action('yes', async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });
    console.log(ctx.session.amount);

    await ad.set("buy_max", ctx.session.amount);
    console.log(ad);

    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_buy_max_scene_2_done", {
        amount: ctx.session.amount
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_method_check ${ctx.session.ad.uid}`).reply_markup
    });

    return ctx.scene.leave();
});


module.exports = {
    admin_ad_change_buy_max_scene,
    admin_ad_change_buy_max_scene_2
}