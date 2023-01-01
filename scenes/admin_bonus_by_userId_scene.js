const { BaseScene } = require("telegraf");
const { $bonus, $user } = require("../connection/mongoose");
const { back_keyboard, yes_no_keyboard, admin_bonus_delete_keyboard, admin_bonus_by_userId_scene_bonusYes_keyboard } = require("../helpers/keyboards");
const moment = require("moment");
const { getUser } = require("../helpers/utils");
const { bot } = require("../connection/telegram");


const admin_bonus_by_userId_scene_start = new BaseScene('admin_bonus_by_userId_scene_start');
admin_bonus_by_userId_scene_start.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_start"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_bonuses").reply_markup
    });
});

admin_bonus_by_userId_scene_start.on('text', async (ctx) => {
    ctx.session.id = ctx.message.text;

    return ctx.scene.enter("admin_bonus_by_userId_scene")
});

const admin_bonus_by_userId_scene = new BaseScene('admin_bonus_by_userId_scene');
admin_bonus_by_userId_scene.enter(async (ctx) => {
    const user = await $user.findOne({ id: ctx.session.id });
    if (user.bonus.length > 0) {
        return ctx.scene.enter("admin_bonus_by_userId_scene_bonusYes");
    } else {
        return ctx.scene.enter("admin_bonus_by_userId_scene_bonusNo");
    }
});

const admin_bonus_by_userId_scene_bonusYes = new BaseScene('admin_bonus_by_userId_scene_bonusYes');
admin_bonus_by_userId_scene_bonusYes.enter(async (ctx) => {
    const user = await $user.findOne({ id: ctx.session.id });

    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_bonusYes", {
            id: user.id,
            username: user.username,
            percent: user.bonus[0].percent,
            limit: user.bonus[0].limit,
            finished: moment(user.bonus[0].finished_date).format('MMMM Do YYYY, HH:mm:ss')
        }), {
            parse_mode: "HTML",
            reply_markup: admin_bonus_by_userId_scene_bonusYes_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_userId_scene_bonusYes", {
            id: user.id,
            username: user.username,
            percent: user.bonus[0].percent,
            limit: user.bonus[0].limit,
            finished: moment(user.bonus[0].finished_date).format('MMMM Do YYYY, HH:mm:ss')
        }), {
            parse_mode: "HTML",
            reply_markup: admin_bonus_by_userId_scene_bonusYes_keyboard().reply_markup
        });
    }
});

admin_bonus_by_userId_scene_bonusYes.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_start")
});

admin_bonus_by_userId_scene_bonusYes.action('delete', async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_bonus_delete"), {
        parse_mode: "HTML",
        reply_markup: yes_no_keyboard().reply_markup
    });
});

admin_bonus_by_userId_scene_bonusYes.action('no', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_start");
});

admin_bonus_by_userId_scene_bonusYes.action('yes', async (ctx) => {
    const user = await $user.findOne({ id: ctx.session.id });
    user.bonus.pop();
    await user.save();

    await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_deleted"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_bonuses").reply_markup
    });

    return ctx.scene.leave();
});

const admin_bonus_by_userId_scene_bonusNo = new BaseScene('admin_bonus_by_userId_scene_bonusNo');
admin_bonus_by_userId_scene_bonusNo.enter(async (ctx) => {
    const user = await $user.findOne({ id: ctx.session.id });
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_bonusNo", {
            id: user.id,
            username: user.username
        }), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_userId_scene_bonusNo", {
            id: user.id,
            username: user.username
        }), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    }
});

admin_bonus_by_userId_scene_bonusNo.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_start")
});

admin_bonus_by_userId_scene_bonusNo.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    if (Number(ctx.message.text) > 30) return ctx.replyWithHTML(ctx.i18n.t("admin_bonus_percent_error"), back_keyboard("back"));
    ctx.session.percent = Number(ctx.message.text);

    return ctx.scene.enter("admin_bonus_by_userId_scene_2")
});

const admin_bonus_by_userId_scene_2 = new BaseScene('admin_bonus_by_userId_scene_2');
admin_bonus_by_userId_scene_2.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_userId_scene_2"), back_keyboard("back"));
    }
});

admin_bonus_by_userId_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_bonusNo")
});

admin_bonus_by_userId_scene_2.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    ctx.session.limit = Number(ctx.message.text);

    return ctx.scene.enter("admin_bonus_by_userId_scene_3")
});

const admin_bonus_by_userId_scene_3 = new BaseScene('admin_bonus_by_userId_scene_3');
admin_bonus_by_userId_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_userId_scene_3"), back_keyboard("back"));
    }
});

admin_bonus_by_userId_scene_3.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_2")
});

admin_bonus_by_userId_scene_3.on('text', async (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";

    const result = moment(ctx.message.text, dateFormat, true).isValid();

    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));
    if (!moment(new Date()).isBefore(moment(ctx.message.text, dateFormat))) {
        return ctx.replyWithHTML(ctx.i18n.t("past_time"), back_keyboard("back"));
    }

    ctx.session.finished_date = ctx.message.text;
    return ctx.scene.enter("admin_bonus_by_userId_scene_4")
});

const admin_bonus_by_userId_scene_4 = new BaseScene('admin_bonus_by_userId_scene_4');
admin_bonus_by_userId_scene_4.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_4", {
            percent: ctx.session.percent,
            limit: ctx.session.limit,
            id: ctx.session.id
        }), {
            parse_mode: "HTML",
            reply_markup: yes_no_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_userId_scene_4", {
            percent: ctx.session.percent,
            limit: ctx.session.limit,
            id: ctx.session.id
        }), yes_no_keyboard());
    }
});

admin_bonus_by_userId_scene_4.action('no', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_3")
});

admin_bonus_by_userId_scene_4.action('yes', async (ctx) => {
    const count = await $bonus.countDocuments();

    let newBonus = new $bonus({
        uid: count + 1,
        purpose: `for ${ctx.session.id}`,
        limit: ctx.session.limit,
        percent: ctx.session.percent,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format(),
        active: true
    });

    await newBonus.save();

    const user = await $user.findOne({ id: ctx.session.id });

    user.bonus.push({
        uid: count + 1,
        percent: ctx.session.percent,
        limit: ctx.session.limit,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format()
    })

    await bot.telegram.sendMessage(user.id, ctx.i18n.t("admin_messenger_bonus", { limit: ctx.session.limit, percent: ctx.session.percent, finished: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm') }), { parse_mode: "HTML" })
    await user.save();

    await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_userId_scene_finish", {
        percent: ctx.session.percent,
        limit: ctx.session.limit,
        id: ctx.session.id
    }), {
        parse_mode: "HTML",
        reply_markup: admin_bonus_delete_keyboard(count + 1).reply_markup
    });

    return ctx.scene.leave();
});


module.exports = {
    admin_bonus_by_userId_scene_start,
    admin_bonus_by_userId_scene_bonusNo,
    admin_bonus_by_userId_scene_bonusYes,
    admin_bonus_by_userId_scene,
    admin_bonus_by_userId_scene_2,
    admin_bonus_by_userId_scene_3,
    admin_bonus_by_userId_scene_4
}