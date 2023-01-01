const { BaseScene } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');
const { $ad, $deal, $admin } = require('../connection/mongoose');
const { check_deal_keyboard, back_keyboard, transfer_done_keyboard, agent_support_keyboard, admin_i_see_keyboard, deal_sell_scene_4_keyboard, deal_scene_keyboard } = require('../helpers/keyboards');
const { getUser, saveDeal_sell, nowpayments, statuses, split_number, btc_transfer_address } = require('../helpers/utils');
const generator = require('generate-password');
const { bot, NPApi } = require('../connection/telegram');
const moment = require("moment");
const fromExponential = require('from-exponential');

const deal_sell_scene = new BaseScene('deal_sell_scene');
deal_sell_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    ctx.session.selling_rate = Number(ctx.session.ad.selling_rate).toFixed(2);

    if (ctx.scene.state.perexod) {
        await ctx.editMessageText(ctx.i18n.t("deal_sell_scene"), {
            parse_mode: "HTML",
            reply_markup: deal_scene_keyboard(ctx.session.ad.uid, "sell").reply_markup
        });
    } else {
        ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene"), deal_scene_keyboard(ctx.session.ad.uid, "sell"));
    }
});

deal_sell_scene.action('another', (ctx) => {
    ctx.session.another = true;
    ctx.session.bot = false;

    return ctx.scene.enter("deal_sell_scene_2", { new: true });
});

deal_sell_scene.action('bot', (ctx) => {
    ctx.session.bot = true;
    ctx.session.another = false;

    return ctx.scene.enter("deal_sell_scene_2", { new: true });
});

const deal_sell_scene_2 = new BaseScene('deal_sell_scene_2');
deal_sell_scene_2.enter(async (ctx) => {
    if (!ctx.scene.state.new) {
        await ctx.editMessageText(ctx.i18n.t("deal_sell_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } else {
        ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_2"), back_keyboard("back"));
    }
});

deal_sell_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("deal_sell_scene", { perexod: true, uid: ctx.session.ad.uid });
});

deal_sell_scene_2.on('text', async(ctx) => {
    var split = (ctx.message.text.toLowerCase()).split("btc");

    if ((split.length === 1 && !Number(ctx.message.text)) || (split.length === 2 && !Number(split[0])) || split.length > 2) return ctx.replyWithHTML(ctx.i18n.t("not_integer_btc"), back_keyboard("back"));

    const user = await getUser(ctx.from.id);
    ctx.session.sell_max = ctx.session.ad.sell_max == -1 ? user.balance : ctx.session.ad.sell_max;

    var max_rate_rub = split_number(`${Number(ctx.session.ad.sell_max * ctx.session.selling_rate).toFixed(2)}`);
    var min_rate_rub = split_number(`${Number(ctx.session.ad.sell_min * ctx.session.selling_rate).toFixed(2)}`);

    if (split.length === 1) {
        if(Number(ctx.message.text) < ctx.session.ad.sell_min * ctx.session.selling_rate) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_2_error_min", {
                min: ctx.session.ad.sell_min,
                min_rate_rub: min_rate_rub
            }), back_keyboard("back"));
        }
        if(Number(ctx.message.text) > ctx.session.sell_max * ctx.session.selling_rate) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_2_error_max", {
                max: ctx.session.sell_max,
                max_rate_rub: max_rate_rub
            }), back_keyboard("back"));
        }
    } else {
        var doublesplit = split[0].split('.');
        if (doublesplit[1] && doublesplit[1].length > 9) return ctx.replyWithHTML(ctx.i18n.t("after_eight_error"), back_keyboard("back"));
        
        if(Number(split[0]) < ctx.session.ad.sell_min) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_2_error_min", {
                min: ctx.session.ad.sell_min,
                min_rate_rub: min_rate_rub
            }), back_keyboard("back"));
        }
        if (Number(split[0]) > ctx.session.sell_max) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_2_error_max", {
                max: ctx.session.sell_max,
                max_rate_rub: max_rate_rub
            }), back_keyboard("back"));
        }
    }

    ctx.session.amount = split.length === 2 ? Number(Number(split[0]).toFixed(8)) : Number((Number(split[0]) / ctx.session.selling_rate).toFixed(8));
    ctx.session.amount_in_rub = split.length === 1 ? Number(split[0]) : Number((ctx.session.amount * ctx.session.selling_rate).toFixed(2));
    
    if (ctx.session.bot && user.balance < ctx.session.amount) return ctx.replyWithHTML(ctx.i18n.t("not_enoughFunds"), back_keyboard("back"));

    return ctx.scene.enter("deal_sell_scene_3")
});

const deal_sell_scene_3 = new BaseScene('deal_sell_scene_3');
deal_sell_scene_3.enter(async(ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_3", {
        method: ctx.session.ad.method
    }), back_keyboard("back"));
});

deal_sell_scene_3.action('back', async (ctx) => {
    return ctx.scene.enter("deal_sell_scene_2")
});

deal_sell_scene_3.on('text', async(ctx) => {
    ctx.session.requisites = ctx.message.text;

    return ctx.scene.enter("deal_sell_scene_4");
});

const deal_sell_scene_4 = new BaseScene('deal_sell_scene_4');
deal_sell_scene_4.enter(async(ctx) => {
    const keyboard = Keyboard.make([
        Key.callback("✅ Да", "yes"),
        Key.callback("🔙 Назад", "back")
    ], { columns: 1 }).inline();

    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });
    ctx.session.selling_rate = ad.selling_rate;
    ctx.session.amount = Number(ctx.session.amount_in_rub / ctx.session.selling_rate).toFixed(8);

    ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_4", {
        amount: ctx.session.amount,
        rub: split_number(`${ctx.session.amount_in_rub}`),
        rate: split_number(`${ctx.session.selling_rate}`)
    }), keyboard);
});

deal_sell_scene_4.action('back', async(ctx) => {
    await ctx.deleteMessage();

    return ctx.scene.enter("deal_sell_scene_3");
});

deal_sell_scene_4.action('yes', async(ctx) => {
    const user = await getUser(ctx.from.id);
    const ad = await $ad.findOne({ uid: ctx.session.ad.uid });

    ctx.session.selling_rate = ad.selling_rate;
    ctx.session.amount = Number(ctx.session.amount_in_rub / ctx.session.selling_rate).toFixed(8);
    ctx.session.address = btc_transfer_address;
    const deal = await saveDeal_sell(ctx);

    ctx.session.deal_uid = deal.uid;

    if(ctx.session.bot) {
        await user.dec("balance", Number(ctx.session.amount));
        await deal.set("user_balance", user.balance);

        return ctx.scene.enter("deal_sell_scene_5", { uid: deal.uid, bot: true });
    } else {
        await ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_4_transfer", {
            uid: deal.uid,
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            amount: fromExponential(ctx.session.amount),
            in_rub: split_number(`${ctx.session.amount_in_rub}`),
            btc_address: btc_transfer_address
        }), transfer_done_keyboard(deal.uid, "sell"));


        const my_deal = await $deal.findOne({ uid: deal.uid });
        await my_deal.set("payment_btc_address", ctx.session.address);
        await my_deal.set("requisites", ctx.session.requisites);

        /*const password = generator.generate({
            length: 15,
            numbers: true
        });

        const request = await NPApi.createPayment({
            order_id: password,
            price_amount: ctx.session.amount * ctx.session.selling_rate,
            price_currency: "rub",
            pay_currency: "btc",
            pay_amount: ctx.session.amount
        });
        await ctx.deleteMessage();

        console.log(request);

        const result = await ctx.replyWithHTML(ctx.i18n.t("deal_sell_scene_4_transfer", {
            uid: deal.uid,
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            amount: ctx.session.amount,
            in_rub: split_number(`${(ctx.session.amount * ctx.session.selling_rate).toFixed(2)}`),
            amount_2: request.pay_amount,
            btc_address: request.pay_address
        }), transfer_done_keyboard(deal.uid, "sell"));

        ctx.session.address = request.pay_address;
        ctx.session.payment_id = request.payment_id;

        const my_deal = await $deal.findOne({ uid: deal.uid });
        await my_deal.set("message_id", result.message_id);
        await my_deal.set("payment_btc_address", ctx.session.address);
        await my_deal.set("payment_id", ctx.session.payment_id);
        await my_deal.set("requisites", ctx.session.requisites);
        await my_deal.set("amount_nowpayments", request.pay_amount);
        */
    }  

    return ctx.scene.leave();
});

const deal_sell_scene_5 = new BaseScene('deal_sell_scene_5');
deal_sell_scene_5.enter(async(ctx) => {
    const deal = await $deal.findOne({ uid: Number(ctx.session.deal_uid) })
    await deal.set("status", 2);

    ctx.replyWithHTML(!ctx.scene.state.bot ? ctx.i18n.t("deal_sell_scene_5", {
        uid: deal.uid,
        status: statuses[deal.status],
        date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        amount: deal.amount,
        in_rub: Number(ctx.session.amount_in_rub).toFixed(2),
        btc_address: ctx.session.address,
        method: ctx.session.ad.method,
        requisites: ctx.session.requisites
    }) : ctx.i18n.t("deal_sell_scene_5_bot_balance", {
        uid: deal.uid,
        status: statuses[deal.status],
        date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        amount: deal.amount,
        in_rub: Number(ctx.session.amount_in_rub).toFixed(2),
        method: ctx.session.ad.method,
        requisites: ctx.session.requisites
    }), agent_support_keyboard())

    await bot.telegram.sendMessage(ctx.session.ad.adminChat, ctx.i18n.t("deal_sell_scene_finish", { uid: deal.uid }), 
    { parse_mode: "HTML", reply_markup: admin_i_see_keyboard().reply_markup });

    return ctx.scene.leave();
});

module.exports = {
    deal_sell_scene,
    deal_sell_scene_2,
    deal_sell_scene_3,
    deal_sell_scene_4,
    deal_sell_scene_5
}