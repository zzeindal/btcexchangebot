const { BaseScene } = require('telegraf');
const { back_keyboard, main_keyboard, revoke_session_keyboard } = require('../helpers/keyboards');
const { $user } = require("../connection/mongoose");
const { bot } = require('../connection/telegram');

const sign_in_scene = new BaseScene('sign_in_scene');
sign_in_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("sign_in_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("profile").reply_markup
    });
});

sign_in_scene.on('text', async(ctx) => {
    if(Number(ctx.message.text) === ctx.from.id) return ctx.replyWithHTML(ctx.i18n.t("sign_in_scene_error"), back_keyboard("profile"));
    const user = await $user.findOne({ id: Number(ctx.message.text) });
    if(!user || !user.password) return ctx.replyWithHTML(ctx.i18n.t("sign_in_scene_error_user"), back_keyboard("profile"));

    ctx.session.id = Number(ctx.message.text);

    return ctx.scene.enter("sign_in_scene_2")
});

const sign_in_scene_2 = new BaseScene('sign_in_scene_2');
sign_in_scene_2.enter(async(ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("sign_in_scene_2"), back_keyboard("profile"), back_keyboard("back"));
});

sign_in_scene_2.on('back', (ctx) => {
    return ctx.scene.enter("sign_in_scene")
});

sign_in_scene_2.on('text', async(ctx) => {
    const user = await $user.findOne({ id: ctx.session.id });
    if(user.password !== ctx.message.text) return ctx.replyWithHTML(ctx.i18n.t("sign_in_scene_2_error"), back_keyboard("back"));

    for(const session of user.activeSessions) {
        await bot.telegram.sendMessage(session, ctx.i18n.t("sign_in_scene_sms_owner", {
            username: ctx.from.username ? `@${ctx.from.username} (${ctx.from.id})` : ctx.from.id
        }), {
            parse_mode: "HTML",
            reply_markup: revoke_session_keyboard(ctx.from.id).reply_markup
        })
    }

    user.activeSessions.push(ctx.from.id);
    await user.save();

    await ctx.replyWithHTML(ctx.i18n.t("sign_in_scene_2_done"), await main_keyboard(ctx));
    
    return ctx.scene.leave();
});

module.exports = {
    sign_in_scene,
    sign_in_scene_2
}