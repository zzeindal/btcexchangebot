const { BaseScene } = require("telegraf");
const { $user, $voucher } = require("../connection/mongoose");
const { back_keyboard, yes_no_keyboard, admin_voucher_delete_keyboard } = require("../helpers/keyboards");
const moment = require("moment");
const { bot } = require("../connection/telegram");

const admin_vouchers_by_userId_scene_start = new BaseScene('admin_vouchers_by_userId_scene_start');
admin_vouchers_by_userId_scene_start.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_userId_scene_start"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_vouchers").reply_markup
    });
});

admin_vouchers_by_userId_scene_start.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_vouchers"));
    ctx.session.id = ctx.message.text;

    return ctx.scene.enter("admin_vouchers_by_userId_scene")
});

const admin_vouchers_by_userId_scene = new BaseScene('admin_vouchers_by_userId_scene');
admin_vouchers_by_userId_scene.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_userId_scene"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_vouchers_by_userId_scene"), back_keyboard("back"));
    }
});

admin_vouchers_by_userId_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_vouchers"));
    ctx.session.count = Number(ctx.message.text);

    return ctx.scene.enter("admin_vouchers_by_userId_scene_2")
});

const admin_vouchers_by_userId_scene_2 = new BaseScene('admin_vouchers_by_userId_scene_2');
admin_vouchers_by_userId_scene_2.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_userId_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_vouchers_by_userId_scene_2"), back_keyboard("back"));
    }
});

admin_vouchers_by_userId_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_userId_scene")
});

admin_vouchers_by_userId_scene_2.on('text', async (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";

    const result = moment(ctx.message.text, dateFormat, true).isValid();

    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));
    if (!moment(new Date()).isBefore(moment(ctx.message.text, dateFormat))) {
        return ctx.replyWithHTML(ctx.i18n.t("past_time"), back_keyboard("back"));
    }
    ctx.session.finished_date = ctx.message.text;
    return ctx.scene.enter("admin_vouchers_by_userId_scene_3")
});

const admin_vouchers_by_userId_scene_3 = new BaseScene('admin_vouchers_by_userId_scene_3');
admin_vouchers_by_userId_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_userId_scene_3", {
            count: ctx.session.count,
            id: ctx.session.id
        }), {
            parse_mode: "HTML",
            reply_markup: yes_no_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_vouchers_by_userId_scene_3", {
            count: ctx.session.count,
            id: ctx.session.id
        }), yes_no_keyboard());
    }
});

admin_vouchers_by_userId_scene_3.action('no', (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_userId_scene_2")
});

admin_vouchers_by_userId_scene_3.action('yes', async (ctx) => {
    const count = await $voucher.countDocuments();

    let newVoucher = new $voucher({
        uid: count + 1,
        count: ctx.session.count,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format(),
        active: true
    });

    await newVoucher.save();

    const user = await $user.findOne({ id: ctx.session.id });

    user.vouchers.push({
        uid: count + 1,
        count: ctx.session.count,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format()
    })

    await bot.telegram.sendMessage(user.id, ctx.i18n.t("admin_messenger_voucher", { count: ctx.session.count, finished: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm') }), { parse_mode: "HTML" })

    await user.save();

    await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_userId_scene_finish", {
        count: ctx.session.count,
        id: ctx.session.id
    }), {
        parse_mode: "HTML",
        reply_markup: admin_voucher_delete_keyboard(count + 1).reply_markup
    });

    return ctx.scene.leave();
});


module.exports = {
    admin_vouchers_by_userId_scene_start,
    admin_vouchers_by_userId_scene,
    admin_vouchers_by_userId_scene_2,
    admin_vouchers_by_userId_scene_3
}