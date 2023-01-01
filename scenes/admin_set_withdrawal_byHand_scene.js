const { BaseScene } = require("telegraf");
const { $admin } = require("../connection/mongoose");
const { back_keyboard } = require("../helpers/keyboards");

const admin_set_withdrawal_byHand_scene = new BaseScene('admin_set_withdrawal_byHand_scene');
admin_set_withdrawal_byHand_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_set_withdrawal_byHand_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_withdrawal_commission").reply_markup
    });
});

admin_set_withdrawal_byHand_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_more"));
    const admin = await $admin.findOne({ uid: 0 });
    admin.withdrawal_commission[ctx.scene.state.speed_id] = Number(ctx.message.text);
    await admin.save();

    ctx.replyWithHTML(ctx.i18n.t("admin_set_withdrawal_byHand_scene_done", {
        amount: ctx.message.text
    }), back_keyboard("admin_withdrawal_commission"));

    return ctx.scene.leave();
});

module.exports = {
    admin_set_withdrawal_byHand_scene
}