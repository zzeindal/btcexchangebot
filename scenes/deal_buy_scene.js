const { BaseScene } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');
const { $ad, $deal, $admin, $bonus } = require('../connection/mongoose');
const { back_keyboard, transfer_done_keyboard, agent_support_keyboard, admin_i_see_keyboard, deal_buy_scene_keyboard, deal_scene_keyboard } = require('../helpers/keyboards');
const { getUser, saveDeal, nowpayments, saveDeal_buy, statuses, split_number, btc_convert } = require('../helpers/utils');
const { bot } = require('../connection/telegram');
const moment = require("moment");
const { btc_account } = require('../connection/btc');
const fromExponential = require('from-exponential');

const deal_buy_scene = new BaseScene('deal_buy_scene');
deal_buy_scene.enter(async(ctx) => {
    ctx.session.ad = await $ad.findOne({ uid: ctx.scene.state.uid });

    ctx.session.buying_rate = Number(ctx.session.ad.buying_rate).toFixed(2);

    if (ctx.scene.state.perexod) {
        await ctx.editMessageText(ctx.i18n.t("deal_buy_scene"), {
            parse_mode: "HTML",
            reply_markup: deal_scene_keyboard(ctx.session.ad.uid, "buy").reply_markup
        });
    } else {
        ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene"),deal_scene_keyboard(ctx.session.ad.uid, "buy"));
    }
});

deal_buy_scene.action('another', (ctx) => {
    ctx.session.another = true;
    ctx.session.bot = false;

    return ctx.scene.enter("deal_buy_scene_2", { new: true })
});

deal_buy_scene.action('bot', (ctx) => {
    ctx.session.bot = true;
    ctx.session.another = false;

    return ctx.scene.enter("deal_buy_scene_2", { new: true })
});

const deal_buy_scene_2 = new BaseScene('deal_buy_scene_2');
deal_buy_scene_2.enter(async (ctx) => {
    if (!ctx.scene.state.new) {
        await ctx.editMessageText(ctx.i18n.t("deal_buy_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } else {
        ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_2"), back_keyboard("back"));
    }
});

deal_buy_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("deal_buy_scene", { perexod: true, uid: ctx.session.ad.uid });
});

deal_buy_scene_2.on('text', async (ctx) => {
    var split = (ctx.message.text.toLowerCase()).split("btc");

    if((split.length === 1 && !Number(ctx.message.text)) || (split.length === 2 && !Number(split[0])) || split.length > 2) return ctx.replyWithHTML(ctx.i18n.t("not_integer_btc"), back_keyboard("back"));

    ctx.session.max_amount = fromExponential(ctx.session.ad.buy_max < 0 ? ctx.session.ad.buy_balance : (ctx.session.ad.buy_max > ctx.session.ad.buy_balance ? ctx.session.ad.buy_balance.toFixed(8).replace(/0*$/, "") : ctx.session.ad.buy_max.toFixed(8).replace(/0*$/, "")));

    var max_rate_rub = split_number(`${Number(ctx.session.max_amount * ctx.session.buying_rate).toFixed(2)}`);
    var min_rate_rub = split_number(`${Number(ctx.session.ad.buy_min * ctx.session.buying_rate).toFixed(2)}`);

    if (split.length === 1) {
        if (Number(ctx.message.text) < ctx.session.ad.buy_min * ctx.session.buying_rate) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_2_error_min", {
                min: ctx.session.ad.buy_min,
                min_rate_rub: min_rate_rub
            }), back_keyboard("back"));
        }
        if (Number(ctx.message.text) > ctx.session.max_amount * ctx.session.buying_rate) {

            return ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_2_error_max", {
                max: ctx.session.max_amount,
                max_rate_rub: max_rate_rub
            }), back_keyboard("back"));
        }
    } else {
        var doublesplit = split[0].split('.');
        if (doublesplit[1] && doublesplit[1].length > 9) return ctx.replyWithHTML(ctx.i18n.t("after_eight_error"), back_keyboard("back"));

        if(Number(split[0]) < ctx.session.ad.buy_min) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_2_error_min", {
                min: ctx.session.ad.buy_min,
                min_rate_rub: min_rate_rub
            }), back_keyboard("back"));
        }
        if(Number(split[0]) > ctx.session.max_amount) {
            return ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_2_error_max", {
                max: ctx.session.max_amount,
                max_rate_rub: max_rate_rub
            }), back_keyboard("back"));
        }
    }

    const user = await getUser(ctx.from.id);
    ctx.session.temp_amount = split.length === 2 ? Number(Number(split[0]).toFixed(8)) : Number(Number((Number(split[0]) / ctx.session.buying_rate).toFixed(8)));
    ctx.session.amount_in_rub = split.length === 1 ? Number(ctx.message.text).toFixed(2) : Number(ctx.session.temp_amount * ctx.session.buying_rate).toFixed(2);

    ctx.session.bonus_amount = 0;
    ctx.session.bonus_limited = 0;
    ctx.session.bonus_percent = 0;
  
    if (user.bonus[0]) {
        ctx.session.bonus_willBeDeleted = user.bonus[0].finished_date;
        ctx.session.bonus_percent = user.bonus[0].percent;
        ctx.session.buying_rate_bonus = Number(ctx.session.buying_rate - (ctx.session.buying_rate * user.bonus[0].percent / 100));

        if (ctx.session.amount_in_rub <= user.bonus[0].limit) {
            ctx.session.amount = Number(Number(ctx.session.amount_in_rub / ctx.session.buying_rate_bonus).toFixed(8))

            ctx.session.bonus_limited = Number(ctx.session.amount_in_rub);
            ctx.session.bonus_amount = 0;
        } else {
            ctx.session.amount = Number(Number((ctx.session.amount_in_rub - user.bonus[0].limit) / ctx.session.buying_rate).toFixed(8));

            ctx.session.bonus_limited = Number(user.bonus[0].limit);
            ctx.session.bonus_amount += Number(Number(user.bonus[0].limit / ctx.session.buying_rate_bonus).toFixed(8))
        }

        ctx.session.amount += Number(ctx.session.bonus_amount);
    } else {
        ctx.session.amount = Number(ctx.session.temp_amount);
    }

    ctx.session.amount = Number(ctx.session.amount).toFixed(8)
    if(!ctx.session.bot) {
        return ctx.scene.enter("deal_buy_scene_2_ask_address")
    }

    return ctx.scene.enter("deal_buy_scene_3");
});

const deal_buy_scene_2_ask_address = new BaseScene('deal_buy_scene_2_ask_address');
deal_buy_scene_2_ask_address.enter(async(ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("deal_buy_scene_2_ask_address"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch(err) {
        ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_2_ask_address"), back_keyboard("back"));
    }
});

deal_buy_scene_2_ask_address.on('text', async (ctx) => {
    if (ctx.message.text.length < 26) return ctx.replyWithHTML(ctx.i18n.t("noValid_btc_address"), back_keyboard("balance"));

    ctx.session.address = ctx.message.text;

    return ctx.scene.enter("deal_buy_scene_3");
});

deal_buy_scene_2_ask_address.action('back', (ctx) => {
    return ctx.scene.enter("deal_buy_scene_2");
});


const deal_buy_scene_3 = new BaseScene('deal_buy_scene_3');
deal_buy_scene_3.enter(async (ctx) => {
    const user = await getUser(ctx.from.id);

    const keyboard = Keyboard.make([
        Key.callback("✅ Да", "yes"),
        Key.callback("🔙 Назад", "back")
    ], { columns: 1 }).inline();

    var rate_text;

    if (user.bonus.length !== 0) {
        rate_text = `<del>${split_number(`${ctx.session.buying_rate}`)}</del> ${split_number(`${Number(ctx.session.buying_rate - (ctx.session.buying_rate * user.bonus[0].percent / 100)).toFixed(2)}`)}`
    } else {
        rate_text = split_number(`${ctx.session.buying_rate}`);
    }

    try {
        await ctx.editMessageText(ctx.i18n.t("deal_buy_scene_3", {
            amount: ctx.session.amount,
            rub: split_number(`${ctx.session.amount_in_rub}`),
            rate_text: rate_text
        }), {
            parse_mode: "HTML",
            reply_markup: keyboard.reply_markup
        });
    } catch(err) {
        ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_3", {
            amount: ctx.session.amount,
            rub: split_number(`${ctx.session.amount_in_rub}`),
            rate_text: rate_text
        }), keyboard);
    }
});

deal_buy_scene_3.action('back', async(ctx) => {
    if(ctx.session.bot) {
        return ctx.scene.enter("deal_buy_scene_2");
    }

    await ctx.deleteMessage();
    return ctx.scene.enter("deal_buy_scene_2_ask_address");
});

deal_buy_scene_3.action('yes', async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.bonus[0]) {
        var temp = user.bonus[0];
        user.bonus.pop();
        await user.save();

        if (temp.limit - ctx.session.bonus_limited > 0) {
            user.bonus.push({
                uid: temp.uid,
                percent: temp.percent,
                limit: temp.limit - ctx.session.bonus_limited,
                finished_date: moment(temp.finished_date).format()
            });

            await user.save();
        }
    }

    const deal = await saveDeal_buy(ctx);
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    ctx.session.deal_uid = deal.uid;

    await ctx.deleteMessage();
    await ad.dec("buy_balance", deal.amount);

    const result = await ctx.replyWithHTML(ctx.i18n.t("deal_buy_scene_deal_created", {
        uid: deal.uid,
        status: statuses[deal.status],
        date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        amount: deal.amount,
        rub: split_number(`${deal.amount_in_rub}`),
        method: ctx.session.ad.method,
        requisites: ctx.session.ad.requisites,
        address: ctx.session.bot ? "на баланс бота" : ctx.session.address
    }), transfer_done_keyboard(deal.uid, "buy"))

    const my_deal = await $deal.findOne({ uid: deal.uid });
    await my_deal.set("message_id", result.message_id);


    return ctx.scene.leave();
});


deal_buy_scene_3.action('paid', async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.session.deal_uid });
    if (deal.status >= 4) {
        return ctx.editMessageText(ctx.i18n.t("deal_already_canceled", { uid: deal.uid }), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("open_deals").reply_markup
        });
    }

    return ctx.scene.enter("deal_buy_scene_4")
});

/*
deal_buy_scene_3.action('cancel', async(ctx) => {
    const deal = await $deal.findOne({ uid: Number(ctx.session.deal_uid) })
    const user = await getUser(ctx.from.id);

    if (deal.status >= 4) {
        return ctx.editMessageText(ctx.i18n.t("deal_already_canceled", { uid: deal.uid }), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("open_deals").reply_markup
        });
    }
    await deal.set("status", 4);
    await deal.set("finished", moment().format())

    if (deal.bonus_willBeDeleted && !user.bonus[0]) { //вернем бонус если использован после отмены
        const count = await $bonus.countDocuments();

        let newBonus = new $bonus({
            uid: count + 1,
            purpose: `for ${user.id}`,
            limit: ctx.session.bonus_limited,
            percent: ctx.session.bonus_percent,
            finished_date: moment(ctx.session.bonus_willBeDeleted, "DD.MM.YYYY - HH:mm").format(),
            active: true
        });

        await newBonus.save();

        user.bonus.push({
            uid: count + 1,
            percent: ctx.session.bonus_percent,
            limit: ctx.session.bonus_limited,
            finished_date: moment(ctx.session.bonus_willBeDeleted, "DD.MM.YYYY - HH:mm").format()
        })

        await user.save();
    }

    if (user.bonus[0]) {
        user.bonus[0].limit += ctx.session.bonus_limited;
        await user.save();
    }

    await ctx.replyWithHTML(ctx.i18n.t("deal_canceled", { uid: deal.uid }));
    await ctx.replyWithHTML(`
<b>📋📌 Сделка №${deal.uid}</b>
<b>Статус:</b> ⛔ Отменена 

<b>Заявка создана:</b> ${moment(deal.created_at).format('MMMM Do YYYY, HH:mm')} (МСК)
<b>Заявка завершена:</b> ${moment(deal.finished).format('MMMM Do YYYY, HH:mm')} (МСК)
<b>Сумма покупки:</b> ${deal.amount} BTC
<b>Сумма к оплате:</b> ${deal.amount_in_rub} Руб

Реквизиты для оплаты ${ctx.session.ad.method}:
<code>${ctx.session.ad.requisites}</code>`);

    return ctx.scene.leave();
});
*/

const deal_buy_scene_4 = new BaseScene('deal_buy_scene_4');
deal_buy_scene_4.enter(async(ctx) => {
    const deal = await $deal.findOne({ uid: Number(ctx.session.deal_uid) })
    await deal.set("status", 1);

    await ctx.editMessageText(ctx.i18n.t("deal_buy_scene_deal_created", {
        uid: deal.uid,
        status: statuses[deal.status],
        date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        amount: deal.amount,
        rub: split_number(`${deal.amount_in_rub}`),
        method: ctx.session.ad.method,
        requisites: ctx.session.ad.requisites
    }), {
        parse_mode: "HTML",
        reply_markup: agent_support_keyboard().reply_markup
    })

    await bot.telegram.sendMessage(ctx.session.ad.adminChat, ctx.i18n.t("deal_buy_scene_finish", { uid: deal.uid }), 
    { parse_mode: "HTML", reply_markup: admin_i_see_keyboard().reply_markup });

    return ctx.scene.leave();
});
module.exports = {
    deal_buy_scene,
    deal_buy_scene_2,
    deal_buy_scene_2_ask_address,
    deal_buy_scene_3,
    deal_buy_scene_4
}