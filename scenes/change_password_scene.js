const { BaseScene } = require('telegraf');
const generator = require('generate-password');

const fs = require('fs');
const { set_password_scene_generate_password, back_keyboard, profile_keyboard } = require('../helpers/keyboards');
const { getUser, check_letters } = require('../helpers/utils');

const change_password_scene = new BaseScene('change_password_scene');
change_password_scene.enter(async (ctx) => {
    ctx.session.back = ctx.scene.state.back;

    if (ctx.scene.state.edit) {
        await ctx.editMessageText(ctx.i18n.t("change_password_scene"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("profile").reply_markup
        });
    } else {
        ctx.replyWithHTML(ctx.i18n.t("change_password_scene"), back_keyboard("profile"));
    }
});

change_password_scene.on('text', async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.password !== ctx.message.text) return ctx.replyWithHTML(ctx.i18n.t("change_password_scene_error"), back_keyboard("profile"));
    return ctx.scene.enter("change_password_scene_2");
});

const change_password_scene_2 = new BaseScene('change_password_scene_2');
change_password_scene_2.enter(async (ctx) => {

    try {
        await ctx.editMessageText(ctx.i18n.t("change_password_scene_2"), set_password_scene_generate_password(ctx.session.back));
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("change_password_scene_2"), set_password_scene_generate_password(ctx.session.back));
    }
});

change_password_scene_2.action('generate', async (ctx) => {
    var password = generator.generate({
        length: 10,
        numbers: true
    });

    ctx.session.password = password;

    return ctx.scene.enter("change_password_scene_3", { generated: true });
});

change_password_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("change_password_scene", { edit: true, back: ctx.session.back });
});

change_password_scene_2.on('text', async (ctx) => {
    if (check_letters(ctx.message.text) || ctx.message.text.length < 5 || ctx.message.text.length > 25) return ctx.replyWithHTML(ctx.i18n.t("set_password_scene_length_error"), back_keyboard("back"));

    const user = await getUser(ctx.from.id);
    if (ctx.message.text === user.password) return ctx.replyWithHTML(ctx.i18n.t("same_password"), back_keyboard("back"));
    ctx.session.password = ctx.message.text;

    return ctx.scene.enter("change_password_scene_3");
});

const change_password_scene_3 = new BaseScene('change_password_scene_3');
change_password_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.scene.state.generated ? ctx.i18n.t("change_password_scene_3_generated", {
            password: ctx.session.password
        }) : ctx.i18n.t("change_password_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        })
    } catch (err) {
        ctx.replyWithHTML(ctx.scene.state.generated ? ctx.i18n.t("change_password_scene_3_generated", {
            password: ctx.session.password
        }) : ctx.i18n.t("change_password_scene_3"), back_keyboard("back"))
    }
});

change_password_scene_3.action('back', (ctx) => {
    return ctx.scene.enter("change_password_scene_2")
});

change_password_scene_3.on('text', async (ctx) => {
    if (ctx.session.password !== ctx.message.text) return ctx.replyWithHTML(ctx.i18n.t("change_password_scene_3_same_error"), back_keyboard("back"))
    const user = await getUser(ctx.from.id);
    await user.set("password", ctx.session.password);

    fs.unlink(`./files/passwords/${user.secret_word}.txt`, (err => {
        if (err) { };
    }));

    fs.appendFile(`./files/passwords/${user.secret_word}.txt`, `ID - ${user.id}\nПароль - ${user.password}\nСекретное слово - ${user.secret_word}`, 'utf8', function (err) {
        if (err) { };
    });

    await ctx.replyWithHTML(ctx.i18n.t("change_password_scene_finish", {
        id: user.id,
        password: ctx.session.password
    }), (await profile_keyboard(ctx.from.id, user.id)));

    return ctx.scene.leave();
});

module.exports = {
    change_password_scene,
    change_password_scene_2,
    change_password_scene_3
}