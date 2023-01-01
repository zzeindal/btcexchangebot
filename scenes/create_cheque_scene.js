const { BaseScene } = require('telegraf');
const { getUser, botUsername, btc_convert, split_number } = require('../helpers/utils');
const { back_keyboard, create_cheque_keyboard } = require('../helpers/keyboards');
const generator = require('generate-password');
const { $cheque, $user } = require('../connection/mongoose');
const moment = require('../node_modules/moment/moment');
const fromExponential = require('from-exponential');

const create_cheque_scene_start = new BaseScene('create_cheque_scene_start');
create_cheque_scene_start.enter(async (ctx) => {
    ctx.session.user = await getUser(ctx.from.id);

    ctx.replyWithHTML(ctx.i18n.t("create_cheque_scene_start"), create_cheque_keyboard())
});

create_cheque_scene_start.action('RUB', async (ctx) => {
    ctx.session.btc = false;
    ctx.session.rub = true;

    return ctx.scene.enter("create_cheque_scene")
});

create_cheque_scene_start.action('BTC', async (ctx) => {
    ctx.session.btc = true;
    ctx.session.rub = false;

    return ctx.scene.enter("create_cheque_scene")
});

const create_cheque_scene = new BaseScene('create_cheque_scene');
create_cheque_scene.enter(async(ctx) => {
    ctx.session.user = await getUser(ctx.from.id);

    const course = await btc_convert(ctx.session.user.balance);
    ctx.replyWithHTML(ctx.i18n.t("create_cheque_scene", {
        value: ctx.session.btc ? "BTC" : "RUB",
        balance: ctx.session.user.balance,
        rub: split_number(`${course.toFixed(2)}`)
    }), back_keyboard("back"))
});

create_cheque_scene.action('back', (ctx) => {
    return ctx.scene.enter("create_cheque_scene_start");
});

create_cheque_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    var rub;
    var btc;

    if (ctx.session.btc) {
        var split = ctx.message.text.split('.');
        if (split[1] && split[1].length > 10) return ctx.replyWithHTML(ctx.i18n.t("after_decimal_error"), back_keyboard("back"));
        rub = Number(await btc_convert(ctx.message.text)).toFixed(2);
        btc = Number(ctx.message.text).toFixed(10);
    } else {
        const course = await btc_convert(1);
        rub = Number(ctx.message.text).toFixed(2);
        btc = Number(rub / course).toFixed(10);
    }

    if (rub < 1) return ctx.replyWithHTML(ctx.i18n.t("create_cheque_scene_error"), back_keyboard("back"));
    if (btc > Number(ctx.session.user.balance)) return ctx.replyWithHTML(ctx.i18n.t("not_enoughFunds"), back_keyboard("back"));

    const user = await $user.findOne({ uid: ctx.session.user.uid })
    await user.dec("balance", btc);

    const password = generator.generate({
        length: 20,
        numbers: true
    });

    const count = await $cheque.countDocuments();


    let newCheque = new $cheque({
        uid: count + 1,
        ownerId: ctx.session.user.id,
        amount: btc,
        amount_in_rub: rub,
        password: password,
        active: true,
        created_at: moment().format(),
        user_balance: ctx.session.user.balance
    });

    await newCheque.save();
    await ctx.replyWithHTML(ctx.i18n.t("create_cheque_scene_done", {
        amount: fromExponential(btc).replace(/0*$/, ""),
        rub: split_number(`${Number(rub).toFixed(2)}`),
        botUsername: botUsername,
        password: password
    }));

    return ctx.scene.leave();
});

module.exports = {
    create_cheque_scene_start,
    create_cheque_scene
}