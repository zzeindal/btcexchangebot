const { BaseScene } = require('telegraf');
const generator = require('generate-password');

const fs = require('fs');
const { set_password_scene_generate_password, back_keyboard, profile_keyboard, yes_no_keyboard } = require('../helpers/keyboards');
const { getUser, check_letters } = require('../helpers/utils');
const { $user } = require('../connection/mongoose');

const set_password_scene = new BaseScene('set_password_scene');
set_password_scene.enter(async (ctx) => {
    ctx.session.back = ctx.scene.state.back;
    ctx.replyWithHTML(ctx.i18n.t("set_password_scene"), set_password_scene_generate_password(ctx.session.back));
});

set_password_scene.action('generate', async(ctx) => {
    var password = generator.generate({
        length: 10,
        numbers: true
    });

    ctx.session.password = password;

    return ctx.scene.enter("set_password_scene_2", { generated: true });
});

set_password_scene.on('text', async (ctx) => {
    if (check_letters(ctx.message.text) || ctx.message.text.length < 5 || ctx.message.text.length > 25) return ctx.replyWithHTML(ctx.i18n.t("set_password_scene_length_error"), back_keyboard(ctx.session.back));
    ctx.session.password = ctx.message.text;

    return ctx.scene.enter("set_password_scene_2");
});

const set_password_scene_2 = new BaseScene('set_password_scene_2');
set_password_scene_2.enter(async(ctx) => {
    try {
        await ctx.editMessageText(ctx.scene.state.generated ? ctx.i18n.t("set_password_scene_2_generated", {
            password: ctx.session.password
        }) : ctx.i18n.t("set_password_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        })
    } catch(err) {
        ctx.replyWithHTML(ctx.scene.state.generated ? ctx.i18n.t("set_password_scene_2_generated", {
            password: ctx.session.password
        }) : ctx.i18n.t("set_password_scene_2"), back_keyboard("back"))
    }
});

set_password_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("set_password_scene", { back: ctx.session.back });
});

set_password_scene_2.on('text', async (ctx) => {
    if (ctx.session.password !== ctx.message.text) return ctx.replyWithHTML(ctx.i18n.t("set_password_scene_2_same_error"), back_keyboard("back"))
    return ctx.scene.enter("set_password_scene_3")
});

const set_password_scene_3 = new BaseScene('set_password_scene_3');
set_password_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("set_password_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        })
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("set_password_scene_3"), back_keyboard("back"))
    }
});

set_password_scene_3.action('back', (ctx) => {
    return ctx.scene.enter("set_password_scene_2")
});

set_password_scene_3.on('text', async (ctx) => {
    const check = await $user.findOne({ secret_word: ctx.message.text });
    if (check) return ctx.replyWithHTML(ctx.i18n.t("set_password_scene_3_error"), back_keyboard("back"));

    const user = await $user.findOne({ secret_word: ctx.message.text });
    if (user) return ctx.replyWithHTML(ctx.i18n.t("Данное секретное слово занято, выберите другое:"), back_keyboard("back"))
    ctx.session.secret_word = ctx.message.text;

    ctx.replyWithHTML(ctx.i18n.t("set_password_scene_3_request"), yes_no_keyboard());

});

set_password_scene_3.action('yes', async (ctx) => {
    const user = await getUser(ctx.from.id);
    await user.set("password", ctx.session.password);
    await user.set("secret_word", ctx.session.secret_word);

    fs.appendFile(`./files/passwords/${user.secret_word}.txt`, `ID - ${user.id}\nПароль - ${user.password}\nСекретное слово - ${user.secret_word}`, 'utf8', function (err) {
        if (err) { };
    });

    await ctx.editMessageText(ctx.i18n.t("set_password_scene_finish", {
        id: user.id,
        password: ctx.session.password
    }), {
        parse_mode: "HTML",
        reply_markup: (await profile_keyboard(ctx.from.id, user.id)).reply_markup
    });

    return ctx.scene.leave();
});

set_password_scene_3.action('no', (ctx) => {
    return ctx.scene.enter("set_password_scene_3")
});

module.exports = {
    set_password_scene,
    set_password_scene_2,
    set_password_scene_3
}