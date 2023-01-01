const { BaseScene } = require("telegraf");
const { $admin, $advertisement } = require("../connection/mongoose");
const { back_keyboard } = require("../helpers/keyboards");
const moment = require("moment");

const admin_advertisement_edit_time_scene = new BaseScene('admin_advertisement_edit_time_scene');
admin_advertisement_edit_time_scene.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_advertisement_edit_time_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_check_advertisement ${ctx.scene.state.uid}`).reply_markup
    });
});

admin_advertisement_edit_time_scene.on('text', async (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";
    const result = moment(ctx.message.text, dateFormat, true).isValid();

    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));

    const advertisement = await $advertisement.findOne({ uid: ctx.scene.state.uid });
    await advertisement.set("released_at", moment(ctx.message.text, dateFormat).format())

    ctx.replyWithHTML(ctx.i18n.t("admin_advertisement_edit_time_scene_done"), back_keyboard(`admin_check_advertisement ${ctx.scene.state.uid}`));

    return ctx.scene.leave();
});

module.exports = {
    admin_advertisement_edit_time_scene
}