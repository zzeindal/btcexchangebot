const { BaseScene } = require("telegraf");
const { $admin } = require("../connection/mongoose");
const { back_keyboard } = require("../helpers/keyboards");

const admin_change_min_withdrawal_scene = new BaseScene('admin_change_min_withdrawal_scene');
admin_change_min_withdrawal_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_change_min_withdrawal_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_more").reply_markup
    });
});

admin_change_min_withdrawal_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_more"));
    const admin = await $admin.findOne({ uid: 0 });
    await admin.set("min_withdrawal", Number(ctx.message.text));
    ctx.replyWithHTML(ctx.i18n.t("admin_change_min_withdrawal_scene_done", {
        amount: ctx.message.text
    }), back_keyboard("admin_more"));

    return ctx.scene.leave();
});

module.exports = {
    admin_change_min_withdrawal_scene
}