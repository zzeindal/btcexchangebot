const { BaseScene } = require("telegraf");
const { $deal, $user, $ad } = require("../connection/mongoose");
const { back_keyboard } = require("../helpers/keyboards");
const { statuses } = require("../helpers/utils");
const moment = require("moment");

const get_exchange_byId_scene = new BaseScene('get_exchange_byId_scene');
get_exchange_byId_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("get_exchange_byId_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_stats_exchange").reply_markup
    });
});

get_exchange_byId_scene.on('text', async(ctx) => {
    if(!Number(ctx.message.text)) return ctx.replyWithHTML(ctx.i18n.t("not_integer"), back_keyboard("admin_stats_exchange"));
    const deal = await $deal.findOne({ uid: Number(ctx.message.text) });
    if(!deal) return ctx.replyWithHTML(ctx.i18n.t("no_deal_byId"), back_keyboard("admin_stats_exchange"));

    const ad = await $ad.findOne({ uid: deal.ad_uid });
    const user = await $user.findOne({ id: deal.ownerId });
    await ctx.replyWithHTML(ctx.i18n.t("get_exchange_byId_scene_done", {
        id: deal.uid,
        purpose: deal.method == "sell" ? "покупка 🔵" : "продажа 🟢",
        method: ad.method,
        amount_in_rub: deal.amount_in_rub,
        amount: deal.amount,
        rate: deal.rate,
        status: statuses[deal.status],
        why_canceled: deal.why_canceled ? deal.why_canceled : '-',
        requisites: deal.requisites,
        created: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        finished: deal.finished !== '-' ? moment(deal.finished).format('MMMM Do YYYY, HH:mm:ss') : "-",
        username: user.username,
        admin: deal.administrator !== '-' ? `@${deal.administrator}` : "-"
    }), back_keyboard("admin_stats_exchange"));
});

module.exports = {
    get_exchange_byId_scene
}