const { BaseScene } = require("telegraf");
const { $admin, $advertisement, $bonus } = require("../connection/mongoose");
const { back_keyboard, yes_no_keyboard } = require("../helpers/keyboards");
const moment = require("moment");

const admin_advertisement_bonus_add_scene = new BaseScene('admin_advertisement_bonus_add_scene');
admin_advertisement_bonus_add_scene.enter(async (ctx) => {
    ctx.session.uid = ctx.scene.state.uid;

    await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_add_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_advertisement_bonus ${ctx.scene.state.uid}`).reply_markup
    });
});

admin_advertisement_bonus_add_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.percent = ctx.message.text;

    return ctx.scene.enter("admin_advertisement_bonus_add_scene_2")
});

const admin_advertisement_bonus_add_scene_2 = new BaseScene('admin_advertisement_bonus_add_scene_2');
admin_advertisement_bonus_add_scene_2.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_add_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_advertisement_bonus_add_scene_2"), back_keyboard("back"));
    }
});

admin_advertisement_bonus_add_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("admin_advertisement_bonus_add_scene", { uid: ctx.session.uid });
});

admin_advertisement_bonus_add_scene_2.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"));
    ctx.session.limit = ctx.message.text;

    return ctx.scene.enter("admin_advertisement_bonus_add_scene_3")
});


const admin_advertisement_bonus_add_scene_3 = new BaseScene('admin_advertisement_bonus_add_scene_3');
admin_advertisement_bonus_add_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_add_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_advertisement_bonus_add_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    }
});

admin_advertisement_bonus_add_scene_3.action('back', (ctx) => {
    return ctx.scene.enter("admin_advertisement_bonus_add_scene_2");
});

admin_advertisement_bonus_add_scene_3.on('text', async (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";

    const result = moment(ctx.message.text, dateFormat, true).isValid();

    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));

    ctx.session.finished_date = ctx.message.text;
    const advertisement = await $advertisement.findOne({ uid: ctx.session.uid });

    ctx.replyWithHTML(ctx.i18n.t("admin_advertisement_bonus_scene_request", {
        percent: ctx.session.percent,
        name: advertisement.name
    }), {
        parse_mode: "HTML",
        reply_markup: yes_no_keyboard().reply_markup
    });
});

admin_advertisement_bonus_add_scene_3.action('no', (ctx) => {
    return ctx.scene.enter("admin_advertisement_bonus_add_scene", { uid: ctx.session.uid });
});

admin_advertisement_bonus_add_scene_3.action('yes', async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.session.uid });
    if (advertisement.bonus.length !== 0) {
        advertisement.bonus.pop();
        await advertisement.save();
    }

    const count = await $bonus.countDocuments();

    let newBonus = new $bonus({
        uid: count + 1,
        purpose: "advertisement",
        limit: ctx.session.limit,
        percent: ctx.session.percent,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format(),
        active: true
    });

    await newBonus.save();

    advertisement.bonus.push({
        uid: count + 1,
        percent: ctx.session.percent,
        limit: ctx.session.limit,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format()
    });
    await advertisement.save();

    await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_scene_done", {
        limit: ctx.session.limit
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_advertisement_bonus ${advertisement.uid}`).reply_markup
    });

    return ctx.scene.leave();
});


module.exports = {
    admin_advertisement_bonus_add_scene,
    admin_advertisement_bonus_add_scene_2,
    admin_advertisement_bonus_add_scene_3
}