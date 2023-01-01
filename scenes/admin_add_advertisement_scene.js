const { BaseScene } = require("telegraf");
const { $admin, $advertisement } = require("../connection/mongoose");
const { back_keyboard, admin_add_advertisement_scene_keyboard } = require("../helpers/keyboards");
const moment = require("moment");
const generator = require('generate-password');
const { saveAdvertisement, botUsername } = require("../helpers/utils");

const admin_add_advertisement_scene = new BaseScene('admin_add_advertisement_scene');
admin_add_advertisement_scene.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_add_advertisement_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_advertisement").reply_markup
    });
});

admin_add_advertisement_scene.on('text', (ctx) => {
    ctx.session.name = ctx.message.text;
    return ctx.scene.enter("admin_add_advertisement_scene_2")
});

const admin_add_advertisement_scene_2 = new BaseScene('admin_add_advertisement_scene_2');
admin_add_advertisement_scene_2.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_add_advertisement_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_add_advertisement_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    }
});

admin_add_advertisement_scene_2.action("back", (ctx) => {
    return ctx.scene.enter("admin_add_advertisement_scene")
});

admin_add_advertisement_scene_2.on('text', (ctx) => {
    ctx.session.link_source = ctx.message.text;
    return ctx.scene.enter("admin_add_advertisement_scene_3")
});

const admin_add_advertisement_scene_3 = new BaseScene('admin_add_advertisement_scene_3');
admin_add_advertisement_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_add_advertisement_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_add_advertisement_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    }
});

admin_add_advertisement_scene_3.action("back", (ctx) => {
    return ctx.scene.enter("admin_add_advertisement_scene_2")
});

admin_add_advertisement_scene_3.on('text', (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";
    const result = moment(ctx.message.text, dateFormat, true).isValid();
    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));
    ctx.session.date = ctx.message.text;

    return ctx.scene.enter("admin_add_advertisement_scene_4")
});

const admin_add_advertisement_scene_4 = new BaseScene('admin_add_advertisement_scene_4');
admin_add_advertisement_scene_4.enter(async (ctx) => {
    ctx.session.password = generator.generate({
        length: 30,
        numbers: true
    });

    try {
        await ctx.editMessageText(ctx.i18n.t("admin_add_advertisement_scene_request", {
            name: ctx.session.name,
            link_source: ctx.session.link_source,
            botUsername: botUsername,
            password: ctx.session.password,
            created_at: moment().format('MMMM Do YYYY, HH:mm:ss'),
            released_at: moment(ctx.session.date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm:ss')
        }), {
            parse_mode: "HTML",
            reply_markup: admin_add_advertisement_scene_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_add_advertisement_scene_request", {
            name: ctx.session.name,
            link_source: ctx.session.link_source,
            botUsername: botUsername,
            password: ctx.session.password,
            created_at: moment().format('MMMM Do YYYY, HH:mm:ss'),
            released_at: moment(ctx.session.date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm:ss')
        }), {
            parse_mode: "HTML",
            reply_markup: admin_add_advertisement_scene_keyboard().reply_markup
        });
    }
});

admin_add_advertisement_scene_4.action("back", (ctx) => {
    return ctx.scene.enter("admin_add_advertisement_scene_3")
});

admin_add_advertisement_scene_4.action("cancel", (ctx) => {
    return ctx.scene.enter("admin_add_advertisement_scene")
});

admin_add_advertisement_scene_4.action("ok", async (ctx) => {
    await saveAdvertisement(ctx);

    await ctx.editMessageText(ctx.i18n.t("admin_add_advertisement_scene_done", {
        name: ctx.session.name,
        link_source: ctx.session.link_source,
        botUsername: botUsername,
        password: ctx.session.password,
        created_at: moment().format('MMMM Do YYYY, HH:mm:ss'),
        released_at: moment(ctx.session.date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm:ss')
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_advertisement").reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_add_advertisement_scene,
    admin_add_advertisement_scene_2,
    admin_add_advertisement_scene_3,
    admin_add_advertisement_scene_4
}