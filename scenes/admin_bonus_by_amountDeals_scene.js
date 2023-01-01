const { BaseScene } = require("telegraf");
const { $admin, $advertisement, $bonus, $user, $deal } = require("../connection/mongoose");
const { back_keyboard, yes_no_keyboard, admin_bonus_delete_keyboard } = require("../helpers/keyboards");
const moment = require("moment");
const { bot } = require("../connection/telegram");


const admin_bonus_by_amountDeals_scene_start = new BaseScene('admin_bonus_by_amountDeals_scene_start');
admin_bonus_by_amountDeals_scene_start.enter(async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_amountDeals_scene_start"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_bonuses").reply_markup
    });
});

admin_bonus_by_amountDeals_scene_start.on('text', async (ctx) => {
    var text = ctx.message.text.split(" ");
    if (text.length !== 2 || !Number(text[0]) || !Number(text[1])) return ctx.replyWithHTML(ctx.i18n.t("error_form"), back_keyboard("admin_bonuses"));
    ctx.session.amount = text[0];
    ctx.session.days = text[1];

    return ctx.scene.enter("admin_bonus_by_amountDeals_scene")
});

const admin_bonus_by_amountDeals_scene = new BaseScene('admin_bonus_by_amountDeals_scene');
admin_bonus_by_amountDeals_scene.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_amountDeals_scene"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_amountDeals_scene"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    }
});

admin_bonus_by_amountDeals_scene.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_start")
});

admin_bonus_by_amountDeals_scene.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    if (Number(ctx.message.text) > 30) return ctx.replyWithHTML(ctx.i18n.t("admin_bonus_percent_error"), back_keyboard("back"));
    ctx.session.percent = Number(ctx.message.text);

    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_2")
});

const admin_bonus_by_amountDeals_scene_2 = new BaseScene('admin_bonus_by_amountDeals_scene_2');
admin_bonus_by_amountDeals_scene_2.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_amountDeals_scene_2"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_amountDeals_scene_2"), back_keyboard("back"));
    }
});

admin_bonus_by_amountDeals_scene_2.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_amountDeals_scene")
});

admin_bonus_by_amountDeals_scene_2.on('text', async (ctx) => {
    if (!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("back"));
    ctx.session.limit = Number(ctx.message.text);

    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_3")
});

const admin_bonus_by_amountDeals_scene_3 = new BaseScene('admin_bonus_by_amountDeals_scene_3');
admin_bonus_by_amountDeals_scene_3.enter(async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_amountDeals_scene_3"), {
            parse_mode: "HTML",
            reply_markup: back_keyboard("back").reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_amountDeals_scene_3"), back_keyboard("back"));
    }
});

admin_bonus_by_amountDeals_scene_3.action('back', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_2")
});

admin_bonus_by_amountDeals_scene_3.on('text', async (ctx) => {
    var dateFormat = "DD.MM.YYYY - HH:mm";

    const result = moment(ctx.message.text, dateFormat, true).isValid();

    if (!result) return ctx.replyWithHTML(ctx.i18n.t("error_time"), back_keyboard("back"));
    if (!moment(new Date()).isBefore(moment(ctx.message.text, dateFormat))) {
        return ctx.replyWithHTML(ctx.i18n.t("past_time"), back_keyboard("back"));
    }

    ctx.session.finished_date = ctx.message.text;
    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_4")
});

const admin_bonus_by_amountDeals_scene_4 = new BaseScene('admin_bonus_by_amountDeals_scene_4');
admin_bonus_by_amountDeals_scene_4.enter(async (ctx) => {
    const users = await $user.find();
    var count = 0;

    for (const user of users) {
        if (user.bonus.length === 0) {
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
                count += 1;
            }
        }
    }

    try {
        await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_amountDeals_scene_4", {
            amount: ctx.session.amount,
            days: ctx.session.days,
            percent: ctx.session.percent,
            limit: ctx.session.limit,
            count: count
        }), {
            parse_mode: "HTML",
            reply_markup: yes_no_keyboard().reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_bonus_by_amountDeals_scene_4", {
            amount: ctx.session.amount,
            days: ctx.session.days,
            percent: ctx.session.percent,
            limit: ctx.session.limit,
            count: count
        }), yes_no_keyboard());
    }
});

admin_bonus_by_amountDeals_scene_4.action('no', (ctx) => {
    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_3")
});

admin_bonus_by_amountDeals_scene_4.action('yes', async (ctx) => {
    const count = await $bonus.countDocuments();

    let newBonus = new $bonus({
        uid: count + 1,
        purpose: "amountDeals",
        limit: ctx.session.limit,
        percent: ctx.session.percent,
        finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format(),
        active: true
    });

    await newBonus.save();

    const users = await $user.find();
    var count_deals = 0;

    for (const user of users) {
        if (user.bonus.length === 0) {
            const deals = await $deal.find({ ownerId: user.id, status: 3 });
            var user_dealsAmount = 0;

            for (const deal of deals) {
                var now = moment(new Date());
                var end = moment(deal.created_at);
                var duration = moment.duration(now.diff(end));
                var days = duration.asDays();

                if (days <= ctx.session.days) {
                    user_dealsAmount += 1;
                }
            }

            if (user_dealsAmount >= ctx.session.amount) {
                count_deals += 1;

                user.bonus.push({
                    uid: count + 1,
                    percent: ctx.session.percent,
                    limit: ctx.session.limit,
                    finished_date: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format()
                })

                await bot.telegram.sendMessage(user.id, ctx.i18n.t("admin_messenger_bonus", { limit: ctx.session.limit, percent: ctx.session.percent, finished: moment(ctx.session.finished_date, "DD.MM.YYYY - HH:mm").format('MMMM Do YYYY, HH:mm') }), { parse_mode: "HTML" })

                await user.save();
            }

        }
    }
    await ctx.editMessageText(ctx.i18n.t("admin_bonus_by_amountDeals_scene_finish", {
        amount: ctx.session.amount,
        days: ctx.session.days,
        count: count_deals,
        percent: ctx.session.percent,
        limit: ctx.session.limit
    }), {
        parse_mode: "HTML",
        reply_markup: admin_bonus_delete_keyboard(count + 1).reply_markup
    });

    return ctx.scene.leave();
});


module.exports = {
    admin_bonus_by_amountDeals_scene_start,
    admin_bonus_by_amountDeals_scene,
    admin_bonus_by_amountDeals_scene_2,
    admin_bonus_by_amountDeals_scene_3,
    admin_bonus_by_amountDeals_scene_4
}