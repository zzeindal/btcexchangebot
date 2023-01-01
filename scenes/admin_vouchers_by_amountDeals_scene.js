const { BaseScene } = require("telegraf");
const { $user, $voucher, $deal } = require("../connection/mongoose");
const { back_keyboard, yes_no_keyboard, admin_voucher_delete_keyboard } = require("../helpers/keyboards");
const moment = require("moment");
const { bot } = require("../connection/telegram");

const admin_vouchers_by_amountDeals_scene_start = new BaseScene('admin_vouchers_by_amountDeals_scene_start');
admin_vouchers_by_amountDeals_scene_start.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_amountDeals_scene_start"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_vouchers").reply_markup
    });
});

admin_vouchers_by_amountDeals_scene_start.on('text', async (ctx) => {
    var text = ctx.message.text.split(" ");
    if (text.length !== 2 || !Number(text[0]) || !Number(text[1])) return ctx.replyWithHTML(ctx.i18n.t("error_form"), back_keyboard("admin_bonuses"));
    ctx.session.amount = text[0];
    ctx.session.days = text[1];

    return ctx.scene.enter("admin_vouchers_by_amountDeals_scene")
});

const admin_vouchers_by_amountDeals_scene = new BaseScene('admin_vouchers_by_amountDeals_scene');
admin_vouchers_by_amountDeals_scene.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_amountDeals_scene"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_vouchers_by_amountDeals_scene"), back_keyboard("back"));
    }
});

admin_vouchers_by_amountDeals_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_vouchers"));
    ctx.session.count = Number(ctx.message.text);

    return ctx.scene.enter("admin_vouchers_by_amountDeals_scene_2")
});

const admin_vouchers_by_amountDeals_scene_2 = new BaseScene('admin_vouchers_by_amountDeals_scene_2');
admin_vouchers_by_amountDeals_scene_2.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_amountDeals_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_vouchers_by_amountDeals_scene_2"), back_keyboard("back"));
    }
});

admin_vouchers_by_amountDeals_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_amountDeals_scene")
});

admin_vouchers_by_amountDeals_scene_2.on('text', async (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";

    const result = moment(ctx.message.text, dateFormat, true).isValid();

    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));
    if (!moment(new Date()).isBefore(moment(ctx.message.text, dateFormat))) {
        return ctx.replyWithHTML(ctx.i18n.t("past_time"), back_keyboard("back"));
    }
    ctx.session.finished_date = ctx.message.text;
    return ctx.scene.enter("admin_vouchers_by_amountDeals_scene_3")
});

const admin_vouchers_by_amountDeals_scene_3 = new BaseScene('admin_vouchers_by_amountDeals_scene_3');
admin_vouchers_by_amountDeals_scene_3.enter(async (ctx) => {
    const users = await $user.find();
    ctx.session.users_count = 0;

    for (const user of users) {
            const deals = await $deal.find({ ownerId: user.id, status: 3 });
            var user_dealsAmount = 0;

            for (const deal of deals) {
                var now = moment(new Date());
                var end = moment(deal.created_at);
                var duration = moment.duration(end.diff(now));
                var days = duration.asDays();

                if (days <= ctx.session.days) {
                    user_dealsAmount += deal.amount;
                }
            }

            if (user_dealsAmount >= ctx.session.amount) {
                ctx.session.users_count += 1;
            }
    }

    try {
        await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_amountDeals_scene_3", {
            count: ctx.session.count,
            count_users: count,
            amount: ctx.session.amount,
            days: ctx.session.days
        }), {
            parse_mode: "HTML",
            reply_markup: yes_no_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_vouchers_by_amountDeals_scene_3", {
            count: ctx.session.count,
            count_users: ctx.session.users_count,
            amount: ctx.session.amount,
            days: ctx.session.days
        }), yes_no_keyboard());
    }
});

admin_vouchers_by_amountDeals_scene_3.action('no', (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_amountDeals_scene_2")
});

admin_vouchers_by_amountDeals_scene_3.action('yes', async (ctx) => {
    const count = await $voucher.countDocuments();

    let newVoucher = new $voucher({
        uid: count + 1,
        count: ctx.session.count,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format(),
        active: true
    });

    await newVoucher.save();

    const users = await $user.find();
    for (const user of users) {
            const deals = await $deal.find({ ownerId: user.id, status: 3 });
            var user_dealsAmount = 0;

            for (const deal of deals) {
                var now = moment(new Date());
                var end = moment(deal.created_at);
                var duration = moment.duration(now.diff(end));
                var days = duration.asDays();

                if (days <= ctx.session.days) {
                    user_dealsAmount += deal.amount;
                }
            }

            if (user_dealsAmount >= ctx.session.amount) {
                user.bonus.push({
                    uid: count + 1,
                    count: ctx.session.count,
                    finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format()
                })

                await bot.telegram.sendMessage(user.id, ctx.i18n.t("admin_messenger_voucher", { count: ctx.session.count, finished: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm') }), { parse_mode: "HTML" })

                await user.save();
            }


    }

    await ctx.editMessageText(ctx.i18n.t("admin_vouchers_by_amountDeals_scene_finish", {
        count: ctx.session.count,
        count_users: ctx.session.users_count,
        amount: ctx.session.amount,
        days: ctx.session.days
    }), {
        parse_mode: "HTML",
        reply_markup: admin_voucher_delete_keyboard(count + 1).reply_markup
    });

    return ctx.scene.leave();
});


module.exports = {
    admin_vouchers_by_amountDeals_scene_start,
    admin_vouchers_by_amountDeals_scene,
    admin_vouchers_by_amountDeals_scene_2,
    admin_vouchers_by_amountDeals_scene_3
}