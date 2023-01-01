const { BaseScene } = require("telegraf");
const { $admin } = require("../connection/mongoose");
const { back_keyboard } = require("../helpers/keyboards");

const admin_set_withdrawal_dynamic_percent_scene = new BaseScene('admin_set_withdrawal_dynamic_percent_scene');
admin_set_withdrawal_dynamic_percent_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_set_withdrawal_dynamic_percent_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_withdrawal_commission").reply_markup
    });
});

admin_set_withdrawal_dynamic_percent_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_more"));
    const admin = await $admin.findOne({ uid: 0 });
    await admin.set("withdrawal_commission_blockchain", true);
    await admin.set("withdrawal_commission_blockchain_percent", Number(ctx.message.text));
    ctx.replyWithHTML(ctx.i18n.t("admin_set_withdrawal_dynamic_percent_scene_done", {
        percent: ctx.message.text
    }), back_keyboard("admin_withdrawal_commission"));

    return ctx.scene.leave();
});

module.exports = {
    admin_set_withdrawal_dynamic_percent_scene
}