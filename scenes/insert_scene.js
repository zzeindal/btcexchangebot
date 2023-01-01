const { BaseScene } = require('telegraf');
const { back_keyboard } = require('../helpers/keyboards');
const generator = require('generate-password');
const { NPApi } = require('../connection/telegram');
const { $admin } = require('../connection/mongoose');
const { btc_convert } = require('../helpers/utils');

const insert_scene = new BaseScene('insert_scene');
insert_scene.enter(async(ctx) => {
    ctx.session.admin = await $admin.findOne({ uid: 0 });

    await ctx.editMessageText(ctx.i18n.t("insert_scene", {
        min: ctx.session.admin.min_insert
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("balance").reply_markup
    });
});

insert_scene.action('back', (ctx) => {
    return ctx.scene.enter("insert_scene");
});

insert_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("balance"));
    if(Number(ctx.message.text) < ctx.session.admin.min_insert) return ctx.replyWithHTML(ctx.i18n.t("insert_scene_error", {
        min: ctx.session.admin.min_insert
    }), back_keyboard("balance"));
    const rub = await btc_convert(Number(ctx.message.text));

    const password = generator.generate({
        length: 15,
        numbers: true
    });

    const request = await NPApi.createPayment({
        order_id: password,
        price_amount: rub,
        pay_amount: Number(ctx.message.text),
        price_currency: "rub",
        pay_currency: "btc",
        order_description: (ctx.from.id).toString(),
        ipn_callback_url: "http://85.192.48.6:80/api/payments/nowpayments"
    });
    ctx.session.payment_id = request.payment_id;
    await ctx.replyWithHTML(ctx.i18n.t("insert_scene_ok", {
        address: request.pay_address
    }), back_keyboard("back"));
});

module.exports = {
    insert_scene
}