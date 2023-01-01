const { BaseScene } = require('telegraf');
const { back_keyboard, yes_no_keyboard, withdrawal_scene_ask_speed_keyboard, withdrawal_max_keyboard } = require('../helpers/keyboards');
const { $admin, $user, $withdrawal } = require('../connection/mongoose');
const { getUser, saveWithdrawal, btc_convert } = require('../helpers/utils');
const { btc_account } = require('../connection/btc');
const moment = require("moment");
const fromExponential = require('from-exponential');

const withdrawal_scene = new BaseScene('withdrawal_scene');
withdrawal_scene.enter(async (ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene"), back_keyboard("balance"));
});

withdrawal_scene.on('text', async(ctx) => {
    if (ctx.message.text.length < 26) return ctx.replyWithHTML(ctx.i18n.t("noValid_btc_address"), back_keyboard("balance"));
    ctx.session.address = ctx.message.text;

    const user = await getUser(ctx.from.id);
    if (user.vouchers.length !== 0) {
        ctx.session.speed_id = 1;

        return ctx.scene.enter("withdrawal_scene_2")
    }

    return ctx.scene.enter("withdrawal_scene_ask_speed")
});

const withdrawal_scene_ask_speed = new BaseScene('withdrawal_scene_ask_speed');
withdrawal_scene_ask_speed.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("withdrawal_scene_ask_speed"), {
            parse_mode: "HTML",
            reply_markup: withdrawal_scene_ask_speed_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_ask_speed"), withdrawal_scene_ask_speed_keyboard());
    }
});

withdrawal_scene_ask_speed.action('back', async(ctx) => {
    await ctx.deleteMessage();

    return ctx.scene.enter("withdrawal_scene")
});

withdrawal_scene_ask_speed.action(/^speed (\d+)$/i, async (ctx) => {
    const user = await getUser(ctx.from.id);
    const admin = await $admin.findOne({ uid: 0 });

    ctx.session.speed_id = Number(ctx.match[1]);
    if ((user.balance - admin.withdrawal_commission[ctx.session.speed_id]) <= 0 || (user.balance - admin.withdrawal_commission[ctx.session.speed_id]) < admin.min_withdrawal) return ctx.answerCbQuery(`❗️ Не хватает средств на данный тип комиссии, воспользуйтесь другим типом комиссии`, true);

    return ctx.scene.enter("withdrawal_scene_2")
});

const withdrawal_scene_2 = new BaseScene('withdrawal_scene_2');
withdrawal_scene_2.enter(async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    const user = await getUser(ctx.from.id);

    if (user.vouchers.length !== 0) {
        var vouchers = "<b>🎀 Ваучеры на бесплатный вывод активны:</b>";

        for (const voucher of user.vouchers) {
            vouchers += `\n- срок действия: до ${moment(voucher.finished_date).format('MMMM Do YYYY, HH:mm')} (МСК) (${voucher.count} шт.)`
        }
        ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_2_voucher", {
            vouchers: vouchers,
            amount: admin.max_withdrawal,
            min: admin.min_withdrawal,
            can_withdraw: fromExponential(user.balance.toFixed(8)).replace(/0*$/, ""),
        }), withdrawal_max_keyboard(user.balance));
    } else {
            ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_2", {
                min: admin.min_withdrawal,
                commission: admin.withdrawal_commission[ctx.session.speed_id],
                can_withdraw: fromExponential((user.balance - admin.withdrawal_commission[ctx.session.speed_id] >= 0 ? user.balance - admin.withdrawal_commission[ctx.session.speed_id] : 0).toFixed(8)).replace(/0*$/, "")
            }), withdrawal_max_keyboard(user.balance - admin.withdrawal_commission[ctx.session.speed_id]));
    }
});

withdrawal_scene_2.action('back', async(ctx) => {
    const user = await getUser(ctx.from.id);
    if (user.vouchers.length !== 0) {
        return ctx.scene.enter("withdrawal_scene")
    }

    return ctx.scene.enter("withdrawal_scene_ask_speed")
});

withdrawal_scene_2.action('withdrawal_max', async (ctx) => {
    const user = await getUser(ctx.from.id);
    const admin = await $admin.findOne({ uid: 0 });
    if (user.vouchers.length === 0) {
        if (user.balance - admin.withdrawal_commission[ctx.session.speed_id] < admin.min_withdrawal) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_error_min_notification", {
            min: admin.min_withdrawal
        }), true)

        if (user.balance - admin.withdrawal_commission[ctx.session.speed_id] <= 0) return ctx.answerCbQuery(`❗️ Не хватает средств на данный тип комиссии, воспользуйтесь другим типом комиссии`, true);

        if (user.balance - admin.withdrawal_commission[ctx.session.speed_id] > admin.max_withdrawal) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_error_max_notification", {
            max: admin.max_withdrawal
        }), true)
    } else {
        if (user.balance < admin.min_withdrawal) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_error_min_notification", {
            min: admin.min_withdrawal
        }), true)

        if (user.balance <= 0) return ctx.answerCbQuery(`❗️ Не хватает средств на данный тип комиссии, воспользуйтесь другим типом комиссии`, true);

        if (user.balance> admin.max_withdrawal) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_error_max_notification", {
            max: admin.max_withdrawal
        }), true)
    }

    const rub = await btc_convert(user.balance);

    ctx.session.amount = user.balance;
    ctx.session.amount_in_rub = rub;
    ctx.session.commission = user.vouchers.length !== 0 ? 0 : admin.withdrawal_commission[ctx.session.speed_id];

    await ctx.editMessageText(ctx.i18n.t("withdrawal_scene_request", {
        amount: ctx.session.amount,
        address: ctx.session.address,
        commission: ctx.session.commission
    }), yes_no_keyboard());
});

withdrawal_scene_2.on('text', async (ctx)=> {
    const user = await getUser(ctx.from.id);
    const admin = await $admin.findOne({ uid: 0 });

    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    if (Number(ctx.message.text) > user.balance - admin.withdrawal_commission[ctx.session.speed_id]) return ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_error_balance", {
        can_withdraw: fromExponential((user.balance - admin.withdrawal_commission[ctx.session.speed_id]).toFixed(8))
    }), back_keyboard("back"))

    if(Number(ctx.message.text) < admin.min_withdrawal) return ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_error_min", {
        min: admin.min_withdrawal
    }), back_keyboard("back"))

    if(Number(ctx.message.text) > admin.max_withdrawal) return ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_error_max", {
        max: admin.max_withdrawal
    }), back_keyboard("back"))

    var split = ctx.message.text.split('.');
    if (split[1].length > 8) return ctx.replyWithHTML(ctx.i18n.t("after_eight_error"), back_keyboard("back"));

    const rub = await btc_convert(Number(ctx.message.text));

    ctx.session.amount = Number(ctx.message.text);
    ctx.session.amount_in_rub = rub;
    ctx.session.commission = user.vouchers.length !== 0 ? 0 : admin.withdrawal_commission[ctx.session.speed_id];

    ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_request", {
        amount: ctx.session.amount,
        address: ctx.session.address,
        commission: ctx.session.commission
    }), yes_no_keyboard());
});

withdrawal_scene_2.action('no', (ctx) => {
    return ctx.scene.enter("withdrawal_scene")
});

withdrawal_scene_2.action('yes', async(ctx) => {
    const user = await getUser(ctx.from.id);
    const admin = await $admin.findOne({ uid: 0 });

    if(ctx.session.amount > user.balance) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_error_balance", {
        can_withdraw: user.balance
    }), true);

    if(ctx.session.amount < admin.min_withdrawal) return ctx.answerCbQuery(ctx.i18n.t("withdrawal_scene_error_min", {
        min: admin.min_withdrawal
    }), true);

    var uid;
    try {
        const txHash = await btc_account.send(ctx.session.address, ctx.session.amount, "BTC", { fee: admin.withdrawal_commission_satoshi[ctx.session.speed_id] })
        uid = await saveWithdrawal(ctx);


        await ctx.deleteMessage();

        await ctx.replyWithHTML(ctx.i18n.t("withdrawal_scene_pending", {
            uid: uid,
            amount: ctx.session.amount,
            address: ctx.session.address,
            link: `https://explorer.btc.com/btc/transaction/${txHash}`
        }));
    } catch (err) {
        console.log(err)
        return ctx.answerCbQuery(`Вывод сейчас недоступен`, true);
    }

    const withdrawal = await $withdrawal.findOne({ uid: uid });
    await user.dec("balance", ctx.session.amount + ctx.session.commission);
    await withdrawal.set("user_balance", user.balance);

    if (ctx.session.commission > 0) {
        await admin.inc("commission_balance", ctx.session.commission - (admin.withdrawal_commission_satoshi[ctx.session.speed_id] * 0.00000001));
    }

    if (user.vouchers[0]) {
        var count = user.vouchers[0].count - 1;


        if (count > 0) {
            user.vouchers.push({
                uid: user.vouchers[0].uid,
                count: count,
                finished_date: moment(user.vouchers[0].finished_date).format()
            })
            await user.save();
        }

        user.vouchers.splice(0, 1);
        await user.save();
    }

    return ctx.scene.leave();
});

withdrawal_scene_2.action('no', (ctx) => {
    return ctx.scene.enter("withdrawal_scene_2");
});

module.exports = {
    withdrawal_scene,
    withdrawal_scene_ask_speed,
    withdrawal_scene_2
}