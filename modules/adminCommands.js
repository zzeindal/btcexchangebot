const { bot, user_client } = require("../connection/telegram");
const { Key } = require("telegram-keyboard")
const {
    admin_keyboard,
    admin_stats_keyboard,
    admin_stats_users_keyboard,
    get_all_users_keyboard,
    back_keyboard,
    admin_get_file_all_users_keyboard,
    admin_methods_keyboard,
    admin_method_check_keyboard,
    rate_keyboard,
    admin_stats_exchange_other_keyboard,
    admin_stats_exchange_byYear_keyboard,
    admin_get_file_deal_byYear_keyboard,
    admin_stats_exchange_keyboard,
    requisites_keyboard,
    choose_requisite_keyboard,
    get_user_keyboard,
    admin_user_sessions_keyboard,
    admin_stats_audience_keyboard,
    admin_stats_registration_keyboard,
    admin_stats_registration_byYear_keyboard,
    admin_more_keyboard,
    admin_withdrawal_commission_keyboard,
    admin_get_ad_exchange_stats_keyboard,
    admin_balance_keyboard,
    admin_check_order_keyboard,
    admin_order_done_keyboard,
    admin_order_cancel_keyboard,
    admin_add_balance_keyboard,
    admin_add_balance_sell_keyboard,
    admin_settings_balance_keyboard,
    admin_settings_balance_byId_keyboard,
    admin_settings_balance_remove_keyboard,
    admin_lessbalance_notifications_have_keyboard,
    admin_lessbalance_notifications_no_keyboard,
    admin_settings_balance_limit_keyboard,
    admin_advertisement_keyboard,
    admin_check_advertisement_keyboard,
    admin_advertisement_bonus_keyboard,
    admin_order_keyboard,
    admin_bonus_keyboard,
    admin_delete_bonus_keyboard,
    admin_vouchers_keyboard,
    admin_delete_voucher_keyboard,
    agent_support_keyboard,
    admin_commission_network_keyboard,
    admin_ad_exchange_stats_keyboard,
    admin_ad_exchange_stats_byYear_keyboard,
    admin_ad_exchange_24hours_keyboard,
    admin_commission_withdrawal_keyboard,
    admin_commission_sell_keyboard,
    admin_stats_exchange_year_choose_day_keyboard,
    admin_method_check_keyboard_limit,
    admin_order_find_keyboard,
    admin_order_byYear_keyboard,
    admin_order_year_choose_day_keyboard,
    admin_order_transfer_done_keyboard
} = require("../helpers/keyboards");

const Excel = require('exceljs');
const { $user, $deal, $ad, $admin, $advertisement, $bonus, $voucher, $withdrawal, $income, $cheque } = require("../connection/mongoose");
const moment = require("moment");
const { Keyboard } = require("telegram-keyboard");
const { statuses, btc_account_address, botUsername, months, getUser } = require("../helpers/utils");
const fs = require("fs");
const { btc_account } = require("../connection/btc");
const fromExponential = require('from-exponential');

bot.action("close_info", async (ctx) => {
    await ctx.deleteMessage();
});

bot.hears("/order", async (ctx) => {
    const ad = await $ad.findOne({ adminChat: ctx.chat.id });
    if (!ad) return;

    var deals = await $deal.find({ ad_uid: ad.uid });
    if (deals.length === 0) return ctx.replyWithHTML(`Нет сделок`)
    deals.sort((a, b) => {
        if (a.uid > b.uid) {
            return -1;
        }
        if (a.uid < b.uid) {
            return 1;
        }
        return 0;
    });


    var data = [];
    var data_temp = [];
    for (var i = 0; i < 15 && i < deals.length; i++) {
        data_temp.push(deals[i])
    }

    var date_button = moment(data_temp[0].created_at).format('L');

    data_temp.sort((a, b) => {
        if (a.uid < b.uid) {
            return -1;
        }
        if (a.uid > b.uid) {
            return 1;
        }
        return 0;
    });

    for (var i = 0; i < data_temp.length; i++) {
        var method_text = data_temp[i].method == "sell" ? "🔵" : "🟢";
        var date = moment(data_temp[i].created_at).format('HH:mm');
        var emoji = '';
        if (data_temp[i].status === 3) {
            emoji = "✅"
        } else if (data_temp[i].status === 4) {
            emoji = "❌"
        } else if (data_temp[i].status === 1 || data_temp[i].status === 2) {
            emoji = "🔄"
        }

        data.push(Key.callback(`${method_text} #${data_temp[i].uid} - ${data_temp[i].amount_in_rub} - ${data_temp[i].rate} - ${date} ${emoji}`, `admin_check_order ${data_temp[i].uid}`));
    }

    const keyboard1 = Keyboard.make(data, { columns: 1 });
    const keyboard2 = Keyboard.make([
        Key.callback("⬅️", `order_go 15`),
        Key.callback(date_button, "admin_order_find"),
        Key.callback("➡️", `order_go 15`),
        Key.callback("Скрыть", "close_info")
    ], { columns: 3 })

    const keyboard = Keyboard.combine(keyboard1, keyboard2).inline();

    ctx.replyWithHTML(ctx.i18n.t("admin_order"), keyboard);
});

bot.action("/order", async (ctx) => {
    const ad = await $ad.findOne({ adminChat: ctx.chat.id });
    if (!ad) return;

    var deals = await $deal.find({ ad_uid: ad.uid });
    deals.sort((a, b) => {
        if (a.uid > b.uid) {
            return -1;
        }
        if (a.uid < b.uid) {
            return 1;
        }
        return 0;
    });

    var data = [];
    var data_temp = [];
    for (var i = 0; i < 15 && i < deals.length; i++) {
        data_temp.push(deals[i])
    }

    var date_button = moment(data_temp[data_temp.length - 1].created_at).format('L');

    data_temp.sort((a, b) => {
        if (a.uid < b.uid) {
            return -1;
        }
        if (a.uid > b.uid) {
            return 1;
        }
        return 0;
    });

    for (var i = 0; i < data_temp.length; i++) {
        var method_text = data_temp[i].method == "sell" ? "🔵" : "🟢";
        var date = moment(data_temp[i].created_at).format('HH:mm');
        var emoji = '';
        if (data_temp[i].status === 3) {
            emoji = "✅"
        } else if (data_temp[i].status === 4) {
            emoji = "❌"
        } else if (data_temp[i].status === 1 || data_temp[i].status === 2) {
            emoji = "🔄"
        }

        data.push(Key.callback(`${method_text} #${data_temp[i].uid} - ${data_temp[i].amount_in_rub} - ${data_temp[i].rate} - ${date} ${emoji}`, `admin_check_order ${data_temp[i].uid}`));
    }

    const keyboard1 = Keyboard.make(data, { columns: 1 });
    const keyboard2 = Keyboard.make([
        Key.callback("⬅️", `order_go 15`),
        Key.callback(date_button, "admin_order_find"),
        Key.callback("➡️", `order_go 15`),
        Key.callback("Скрыть", "close_info")
    ], { columns: 3 })

    const keyboard = Keyboard.combine(keyboard1, keyboard2).inline();

    ctx.replyWithHTML(ctx.i18n.t("admin_order"), keyboard);
});

bot.action(/^order_go (\d+)$/i, async (ctx) => {
    const ad = await $ad.findOne({ adminChat: ctx.chat.id });
    if (!ad) return;

    var deals = await $deal.find({ ad_uid: ad.uid });
    deals.sort((a, b) => {
        if (a.uid > b.uid) {
            return -1;
        }
        if (a.uid < b.uid) {
            return 1;
        }
        return 0;
    });

    var data = [];
    var data_temp = [];
    for (var i = ctx.match[1]; i < Number(ctx.match[1]) + 15 && i < deals.length; i++) {
        data_temp.push(deals[i])
    }

    data_temp.sort((a, b) => {
        if (a.uid < b.uid) {
            return -1;
        }
        if (a.uid > b.uid) {
            return 1;
        }
        return 0;
    });
    var date_button = moment(data_temp[data_temp.length - 1].created_at).format('L');
    for (var i = 0; i < data_temp.length;i++) {
        checked = true;
        var method_text = data_temp[i].method == "sell" ? "🔵" : "🟢";
        var date = moment(data_temp[i].created_at).format('HH:mm');
        var emoji = '';
        if (data_temp[i].status === 3) {
            emoji = "✅"
        } else if (data_temp[i].status === 4) {
            emoji = "❌"
        } else if (data_temp[i].status === 1 || data_temp[i].status === 2) {
            emoji = "🔄"
        }

        data.push(Key.callback(`${method_text} #${data_temp[i].uid} - ${data_temp[i].amount_in_rub} - ${data_temp[i].rate} - ${date} ${emoji}`, `admin_check_order ${data_temp[i].uid}`));
    }
    if (!checked) return ctx.answerCbQuery(`Больше нет доступных обменов.`);

    var keyboard1;
    if (data.length < 15) {
        keyboard1 = Keyboard.make([
            Key.callback(`⬅️`, `order_go ${Number(ctx.match[1]) - 15}`),
            Key.callback(date_button, "admin_order_find"),
            Key.callback(`➡️`, `order_go 0`),
            Key.callback("Скрыть", "close_info")
        ], { columns: 3 })
    } else if (Number(ctx.match[1]) === 0) {
        data = [];
        for (var i = 0; i < 15; i++) {
            var method_text = data_temp[i].method == "sell" ? "🔵" : "🟢";
            var date = moment(data_temp[i].created_at).format('HH:mm');
            var emoji = '';
            if (data_temp[i].status === 3) {
                emoji = "✅"
            } else if (data_temp[i].status === 4) {
                emoji = "❌"
            } else if (data_temp[i].status === 1 || data_temp[i].status === 2) {
                emoji = "🔄"
            }

            data.push(Key.callback(`${method_text} #${data_temp[i].uid} - ${data_temp[i].amount_in_rub} - ${data_temp[i].rate} - ${date} ${emoji}`, `admin_check_order ${data_temp[i].uid}`));
        }
        keyboard1 = Keyboard.make([
            Key.callback(`⬅️`, `order_go 15`),
            Key.callback(date_button, "admin_order_find"),
            Key.callback(`➡️`, `order_go 15`),
            Key.callback("Скрыть", "close_info")
        ], { columns: 3 })
    } else {
        keyboard1 = Keyboard.make([
            Key.callback(`⬅️`, `order_go ${Number(ctx.match[1]) - 15}`),
            Key.callback(date_button, "admin_order_find"),
            Key.callback(`➡️`, `order_go ${Number(ctx.match[1]) + 15}`),
            Key.callback("Скрыть", "close_info")
        ], { columns: 3 })
    }
    const keyboard2 = Keyboard.make(data, { columns: 1 });
    const keyboard = Keyboard.combine(keyboard2, keyboard1).inline();

    await ctx.editMessageText(ctx.i18n.t("admin_order"), {
        parse_mode: "HTML",
        reply_markup: keyboard.reply_markup
    });
});

bot.action('admin_order_find', async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_order_find"), {
            parse_mode: "HTML",
            reply_markup: (await admin_order_find_keyboard()).reply_markup
        });
    } catch (err) {
        await ctx.deleteMessage();

        ctx.replyWithHTML(ctx.i18n.t("admin_order_find"), (await admin_order_find_keyboard()));
    }
});

bot.action(/^admin_order_find_year (\d+)$/i, async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_order_find_year"), {
        parse_mode: "HTML",
        reply_markup: admin_order_byYear_keyboard(ctx.match[1]).reply_markup
    })
});

bot.action(/^admin_order_find_year (\d+) (\d+)$/i, async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange_year_choose_day"), {
            parse_mode: "HTML",
            reply_markup: admin_order_year_choose_day_keyboard(ctx.match[1], ctx.match[2]).reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_stats_exchange_year_choose_day"), admin_order_year_choose_day_keyboard(ctx.match[1], ctx.match[2]));
    }
});

bot.action(/^admin_order_find_year (\d+) (\d+) (\d+) (\d+)$/i, async (ctx) => {
    var deals = await $deal.find();
    var data_filtered = [];

    for (var i = 0; i < deals.length; i++) {
        var year = moment(deals[i].created_at).year();
        var month = moment(deals[i].created_at).month();
        var day = Number(moment(deals[i].created_at).format('D'));
        if (year === Number(ctx.match[1]) && month === Number(ctx.match[2]) && day === Number(ctx.match[3])) {
            data_filtered.push(deals[i])
        }
    }

    if (data_filtered.length === 0) return ctx.answerCbQuery(ctx.i18n.t("admin_exchange_noDeals"), true);
    data_filtered.sort((a, b) => {
        if (a.uid > b.uid) {
            return -1;
        }
        if (a.uid < b.uid) {
            return 1;
        }
        return 0;
    });


    var data_temp = [];
    var data = [];
    var checked = true;
    var date_button = moment(data_filtered[ctx.match[4]].created_at).format('L');
    for (var i = ctx.match[4]; i < Number(ctx.match[4]) + 15 && i < data_filtered.length; i++) {
        data_temp.push(data_filtered[i])
    }

    data_temp.sort((a, b) => {
        if (a.uid < b.uid) {
            return -1;
        }
        if (a.uid > b.uid) {
            return 1;
        }
        return 0;
    });

    for (var i = 0; i < data_temp.length;i++) {
        checked = true;
        var method_text = data_temp[i].method == "sell" ? "🔵" : "🟢";
        var date = moment(data_temp[i].created_at).format('HH:mm');
        var emoji = '';
        if (data_temp[i].status === 3) {
            emoji = "✅"
        } else if (data_temp[i].status === 4) {
            emoji = "❌"
        } else if (data_temp[i].status === 1 || data_temp[i].status === 2) {
            emoji = "🔄"
        }

        data.push(Key.callback(`${method_text} ${data_temp[i].amount_in_rub} RUB - ${data_temp[i].rate} - ${date} ${emoji}`, `admin_check_order ${data_temp[i].uid}`));
    }
    if (!checked) return ctx.answerCbQuery(`Больше нет доступных обменов.`);

    var keyboard1;
    if (data.length < 15) {
        keyboard1 = Keyboard.make([
            Key.callback(`⬅️`, `admin_order_find_year ${ctx.match[1]} ${ctx.match[2]} ${ctx.match[3]} ${Number(ctx.match[4]) - 15}`),
            Key.callback(date_button, "admin_order_find"),
            Key.callback(`➡️`, `admin_order_find_year ${ctx.match[1]} ${ctx.match[2]} ${ctx.match[3]} 0`),
            Key.callback("Скрыть", "close_info")
        ], { columns: 3 })
    } else if (Number(ctx.match[4]) === 0) {
        data = [];
        for (var i = 0; i < 15; i++) {
            var method_text = data_filtered[i].method == "sell" ? "🔵" : "🟢";
            var date = moment(data_filtered[i].created_at).format('HH:mm');
            var emoji = '';
            if (data_filtered[i].status === 3) {
                emoji = "✅"
            } else if (data_filtered[i].status === 4) {
                emoji = "❌"
            } else if (data_filtered[i].status === 1 || data_filtered[i].status === 2) {
                emoji = "🔄"
            }

            data.push(Key.callback(`${method_text} ${data_filtered[i].amount_in_rub} RUB - ${data_filtered[i].rate} - ${date} ${emoji}`, `admin_check_order ${data_filtered[i].uid}`));
        }
        keyboard1 = Keyboard.make([
            Key.callback(`⬅️`, `admin_order_find_year ${ctx.match[1]} ${ctx.match[2]} ${ctx.match[3]} 15`),
            Key.callback(date_button, "admin_order_find"),
            Key.callback(`➡️`, `admin_order_find_year ${ctx.match[1]} ${ctx.match[2]} ${ctx.match[3]} 15`),
            Key.callback("Скрыть", "close_info")
        ], { columns: 3 })
    } else {
        keyboard1 = Keyboard.make([
            Key.callback(`⬅️`, `admin_order_find_year ${ctx.match[1]} ${ctx.match[2]} ${ctx.match[3]} ${Number(ctx.match[4]) - 15}`),
            Key.callback(date_button, "admin_order_find"),
            Key.callback(`➡️`, `admin_order_find_year ${ctx.match[1]} ${ctx.match[2]} ${ctx.match[3]} ${Number(ctx.match[4]) + 15}`),
            Key.callback("Скрыть", "close_info")
        ], { columns: 3 })
    }
    const keyboard2 = Keyboard.make(data, { columns: 1 });
    const keyboard = Keyboard.combine(keyboard2, keyboard1).inline();

    await ctx.editMessageText(ctx.i18n.t("admin_order"), {
        parse_mode: "HTML",
        reply_markup: keyboard.reply_markup
    });
});


bot.action(/admin_check_order (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    ctx.replyWithHTML(ctx.i18n.t("admin_check_order", {
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
        confirmed: deal.confirmed ? moment(deal.confirmed).format('MMMM Do YYYY, HH:mm:ss') : "-",
        finished: deal.finished !== '-' ? moment(deal.finished).format('MMMM Do YYYY, HH:mm:ss') : "-",
        admin: deal.administrator !== '-' ? `@${deal.administrator}` : "-"
    }), (await admin_check_order_keyboard(deal.uid)));
});


bot.action(/admin_order_transfer_done (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    if (deal.status !== 1) return;

    await ctx.replyWithHTML(ctx.i18n.t("admin_order_transfer_done_request"), admin_order_transfer_done_keyboard(deal.uid));
});

bot.action(/admin_order_transfer_done_ok (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    const ad = await $ad.findOne({ uid: deal.ad_uid });

    if (deal.status !== 1) return;

    await deal.set("status", 2);

    await bot.telegram.sendMessage(deal.ownerId, !deal.bot_balance ? ctx.i18n.t("deal_sell_scene_5", {
        uid: deal.uid,
        status: statuses[deal.status],
        date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        amount: deal.amount,
        in_rub: deal.amount * deal.rate,
        btc_address: deal.payment_btc_address,
        method: ad.method,
        requisites: deal.requisites
    }) : ctx.i18n.t("deal_sell_scene_5_bot_balance", {
        uid: deal.uid,
        status: statuses[deal.status],
        date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
        amount: deal.amount,
        in_rub: deal.amount * deal.rate,
        method: ad.method,
        requisites: deal.requisites
    }), {
        parse_mode: "HTML",
        reply_markup: agent_support_keyboard().reply_markup
    });

    ctx.replyWithHTML(ctx.i18n.t("admin_order_transfer_done_ok"), back_keyboard(`admin_check_order ${deal.uid}`));
});

bot.action(/admin_order_done (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    await ctx.replyWithHTML(ctx.i18n.t("admin_order_done_request", { amount: deal.amount_in_rub }), admin_order_done_keyboard(deal.uid));
});

bot.action(/admin_order_done_ok (\d+)$/i, async (ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    const ad = await $ad.findOne({ uid: deal.ad_uid });
    const admin = await $admin.findOne({ uid: 0 });

    if (deal.status === 3) return;

    await deal.set("status", 3);

    await deal.set("administrator", ctx.from.username);
    await deal.set("finished", moment().format());

    if (deal.method === "buy") {
        if (deal.wallet === "баланс") {
            const owner = await $user.findOne({ id: deal.ownerId });
            await owner.inc("balance", deal.amount);
            await deal.set("user_balance", owner.balance);

            await bot.telegram.sendMessage(deal.ownerId, ctx.i18n.t("deal_buy_scene_deal_created", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                rub: deal.amount_in_rub,
                method: ad.method,
                requisites: deal.requisites,
                address: deal.other_address
            }), {
                parse_mode: "HTML",
                reply_markup: agent_support_keyboard().reply_markup
            })
        } else {
            var commission = 0;
            if (deal.amount_in_rub < 2000) {
                commission = admin.sell_btc_commission_satoshi[0]
            }
            else if (deal.amount_in_rub >= 2000 && deal.amount_in_rub < 5000) {
                commission = admin.sell_btc_commission_satoshi[1]
            }
            else if (deal.amount_in_rub >= 5000 && deal.amount_in_rub < 20000) {
                commission = admin.sell_btc_commission_satoshi[2]
            }
            else if (deal.amount_in_rub >= 20000) {
                commission = admin.sell_btc_commission_satoshi[3]
            }
            const txHash = await btc_account.send(deal.other_address, deal.amount, "BTC", { fee: commission });
            await deal.set("txHash", txHash)

            await bot.telegram.sendMessage(deal.ownerId, ctx.i18n.t("deal_buy_scene_deal_pending_finish", {
                uid: deal.uid,
                status: statuses[deal.status],
                date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
                amount: deal.amount,
                rub: deal.amount_in_rub,
                method: ad.method,
                requisites: deal.requisites,
                address: deal.other_address,
                link: `https://explorer.btc.com/btc/transaction/${txHash}`
            }), {
                parse_mode: "HTML",
                reply_markup: agent_support_keyboard().reply_markup
            })
        }
    } else {
        await admin.inc("sell_balance", Number(deal.amount));

        await bot.telegram.sendMessage(deal.ownerId, !deal.bot_balance ? ctx.i18n.t("deal_sell_scene_5", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            in_rub: deal.amount * deal.rate,
            btc_address: deal.payment_btc_address,
            method: ad.method,
            requisites: deal.requisites
        }) : ctx.i18n.t("deal_sell_scene_5_bot_balance", {
            uid: deal.uid,
            status: statuses[deal.status],
            date: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            amount: deal.amount,
            in_rub: deal.amount * deal.rate,
            method: ad.method,
            requisites: deal.requisites
        }), {
            parse_mode: "HTML",
            reply_markup: agent_support_keyboard().reply_markup
        })
    }

    ctx.replyWithHTML(ctx.i18n.t("admin_order_done_ok"), back_keyboard(`admin_check_order ${deal.uid}`));
});

bot.action(/admin_order_cancel (\d+)$/i, async(ctx) => {
    const deal = await $deal.findOne({ uid: ctx.match[1] });
    ctx.replyWithHTML(ctx.i18n.t("admin_order_cancel_request", { amount: deal.amount_in_rub }), admin_order_cancel_keyboard(deal.uid));
});

bot.action(/admin_order_cancel_ok (\d+)$/i, (ctx) => {
    return ctx.scene.enter("admin_order_cancel_scene", { uid: ctx.match[1] });
});

bot.action('admin', async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("choose_section"), {
        parse_mode: "HTML",
        reply_markup: admin_keyboard().reply_markup
    });
});

bot.action('admin_messenger', (ctx) => {
    return ctx.scene.enter("admin_messenger_scene")
});


bot.action('admin_commission_network', async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_commission_network"), {
        reply_markup: admin_commission_network_keyboard().reply_markup
    });
});

bot.action('admin_commission_withdrawal', async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    await ctx.editMessageText(ctx.i18n.t("admin_commission_withdrawal", {
        commission: admin.withdrawal_commission_satoshi
    }), {
        parse_mode: "HTML",
        reply_markup: admin_commission_withdrawal_keyboard().reply_markup
    });
});

bot.action('admin_commission_sell', async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    await ctx.editMessageText(ctx.i18n.t("admin_commission_sell", {
        commission: admin.sell_btc_commission_satoshi
    }), {
        parse_mode: "HTML",
        reply_markup: admin_commission_sell_keyboard().reply_markup
    });
});

bot.action(/^admin_commission_withdrawal (\d+)$/i, async (ctx) => {
    return ctx.scene.enter("admin_commission_set_scene", { method: "withdrawal", speed_id: ctx.match[1] });
});

bot.action(/^admin_commission_sell (\d+)$/i, async (ctx) => {
    return ctx.scene.enter("admin_commission_set_scene", { method: "sell", speed_id: ctx.match[1] });
});

bot.action('admin_add_method', (ctx)=>{
    return ctx.scene.enter("admin_add_method_scene")
});

bot.action('admin_stats', async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("choose_section"), {
        parse_mode: "HTML",
        reply_markup: admin_stats_keyboard().reply_markup
    })
});

bot.action('admin_stats_users', async(ctx)=>{
    const users = await $user.find();
    await ctx.editMessageText(ctx.i18n.t("admin_stats_users", { count: users.length }), {
        parse_mode: "HTML",
        reply_markup: admin_stats_users_keyboard().reply_markup
    })
});

bot.action('get_all_users', async(ctx)=>{
    try {
        await ctx.editMessageText(ctx.i18n.t("choose_section"), {
            parse_mode: "HTML",
            reply_markup: get_all_users_keyboard().reply_markup
        })
    } catch(err) {
        await ctx.deleteMessage();
        await ctx.replyWithHTML(ctx.i18n.t("choose_section"), get_all_users_keyboard())
    }
});

bot.action('admin_stats_audience', async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("admin_stats_audience"), {
        parse_mode: "HTML",
        reply_markup: admin_stats_audience_keyboard().reply_markup
    });
});

bot.action('admin_stats_registration', async(ctx)=> {
    await ctx.editMessageText(ctx.i18n.t("admin_stats_registration"), {
        parse_mode: "HTML",
        reply_markup: (await admin_stats_registration_keyboard()).reply_markup
    });
});

bot.action(/admin_stats_registration (\d+)$/i, async(ctx)=> {
    await ctx.editMessageText(ctx.i18n.t("admin_stats_registration_byYear"), {
        parse_mode: "HTML",
        reply_markup: admin_stats_registration_byYear_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/admin_stats_registration (\d+) (\d+)$/i, async(ctx)=> {
    const users = await $user.find();
    var data = new Array(31).fill(0);

    for(const user of users) {
        var year = moment(user.registration_date).year();
        if(year === Number(ctx.match[1])) {
            var month = moment(user.registration_date).month();
            if (month === Number(ctx.match[2])) {
                var day = moment(user.registration_date).date() - 1;
                data[day]+=1;
            }
        }
    }

    var text = `Статистика регистраций за ${ctx.match[1]} год, ${Number(ctx.match[2]) + 1}-й месяц`;

    var sum = 0;
    for (var i = 0; i < data.length; i++) {
        text += `\nДень ${i + 1} -> <b>${data[i]}</b>`;
        sum += data[i];
    }

    text += `\n\nИтого за месяц: ${sum}`;

    await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_stats_registration ${ctx.match[1]}`).reply_markup
    })
});

bot.action("get_user_byId", (ctx)=> {
    return ctx.scene.enter("get_user_byId_scene")
});

bot.action(/get_user_byId (\d+)$/i, async(ctx)=> {
    const user = await $user.findOne({ id: ctx.match[1] });

    const buy = await $deal.find({ ownerId: user.id, method: "sell", status: 3 });
    const sell = await $deal.find({ ownerId: user.id, method: "buy", status: 3 });
    const cancel_buy = await $deal.find({ ownerId: user.id, method: "sell", status: 4 });
    const cancel_sell = await $deal.find({ ownerId: user.id, method: "buy", status: 4 });
    var amount_buy = 0;
    var amount_sell = 0;

    for(const deal of buy) {
        amount_buy+=deal.amount
    }
    for(const deal of sell) {
        amount_sell+=deal.amount
    }

    var income_sum = 0;
    var withdrawal_sum = 0;

    const incomes = await $income.find({ ownerId: user.id })
    var income_count = incomes.length;

    for (const income of incomes) {
        income_sum += income.amount;
    }

    const withdrawals = await $withdrawal.find({ ownerId: user.id });
    var withdrawal_count = withdrawals.length;
    for (const withdrawal of withdrawals) {
        withdrawal_sum += withdrawal.amount;
    }

    try {
        await ctx.editMessageText(ctx.i18n.t("get_user_byId_scene_done", {
            id: user.id,
            username: user.username,
            balance: fromExponential(user.balance),
            registration: moment(user.registration_date).format('MMMM Do YYYY, HH:mm:ss'),
            last_message: moment(user.last_message_date).format('MMMM Do YYYY, HH:mm:ss'),
            count_buy: buy.length,
            count_sell: sell.length,
            count_cancel_buy: cancel_buy.length,
            count_cancel_sell: cancel_sell.length,
            amount_buy: fromExponential(amount_buy),
            amount_sell: fromExponential(amount_sell),
            deposit_count: income_count,
            withdrawal_count: withdrawal_count,
            deposit_amount: fromExponential(income_sum),
            withdrawal_amount: fromExponential(withdrawal_sum),
            activeSessions: user.activeSessions.length
        }), (await get_user_keyboard(user.id, "admin_stats_users")));
    } catch (err) {
        await ctx.deleteMessage();

        ctx.replyWithHTML(ctx.i18n.t("get_user_byId_scene_done", {
            id: user.id,
            username: user.username,
            balance: fromExponential(user.balance),
            registration: moment(user.registration_date).format('MMMM Do YYYY, HH:mm:ss'),
            last_message: moment(user.last_message_date).format('MMMM Do YYYY, HH:mm:ss'),
            count_buy: buy.length,
            count_sell: sell.length,
            count_cancel_buy: cancel_buy.length,
            count_cancel_sell: cancel_sell.length,
            amount_buy: fromExponential(amount_buy),
            amount_sell: fromExponential(amount_sell),
            deposit_count: income_count,
            withdrawal_count: withdrawal_count,
            deposit_amount: fromExponential(income_sum),
            withdrawal_amount: fromExponential(withdrawal_sum),
            activeSessions: user.activeSessions.length
        }), (await get_user_keyboard(user.id, "admin_stats_users")));
    }

});

bot.action(/give_amount (\d+)$/i, (ctx)=> {
    return ctx.scene.enter("give_amount_scene", { id: ctx.match[1] });
});

bot.action(/get_finance (\d+)$/i, async (ctx) => {
    const user = await getUser(ctx.match[1]);
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(`№${user.id}`);
    worksheet.columns = [
        { header: 'Создана', key: 'created' },
        { header: 'ID операции', key: 'operation_id' },
        { header: 'Статус заявки', key: 'status' },
        { header: 'Сумма', key: 'amount' },
        { header: 'Операция', key: 'operation' },
        { header: 'Кошелёк', key: 'wallet' },
        { header: 'Id источника', key: 'id' },
        { header: 'Приемник', key: 'receiver' },
        { header: 'Способ оплаты', key: 'payMethod' },
        { header: 'Остаток по балансу', key: 'remainder' }
    ];

    var data = [];

    const deals = await $deal.find({ ownerId: user.id });
    for (const deal of deals) {
        const ad = await $ad.findOne({ uid: deal.ad_uid });

        data.push({
            created: moment(deal.created_at).format('MMMM Do YYYY, HH:mm'),
            'operation_id': deal.uid,
            status: statuses[deal.status],
            amount: `${deal.amount} (${deal.amount_in_rub} RUB)`,
            operation: deal.method === "sell" ? "Продажа" : "Покупка",
            wallet: deal.wallet,
            id: user.id,
            receiver: deal.other_address ? deal.other_address : user.id,
            payMethod: deal.method === "sell" ? `${ad.method} (*${deal.requisites.substr(-4)})` : ad.method,
            remainder: Number(deal.user_balance).toFixed(10)
        })
    }

    const withdrawals = await $withdrawal.find({ ownerId: user.id });
    for (const withdrawal of withdrawals) {
        data.push({
            created: moment(withdrawal.created_at).format('MMMM Do YYYY, HH:mm'),
            'operation_id': withdrawal.uid,
            status: "-",
            amount: `${withdrawal.amount} (${withdrawal.amount_in_rub} RUB)`,
            operation: "Вывод средств",
            wallet: "Баланс",
            id: user.id,
            receiver: withdrawal.address,
            remainder: Number(withdrawal.user_balance).toFixed(10)
        })
    }

    const incomes = await $income.find({ ownerId: user.id });
    for (const income of incomes) {
        data.push({
            created: moment(income.created_at).format('MMMM Do YYYY, HH:mm'),
            'operation_id': income.uid,
            status: "-",
            amount: `${income.amount} (${income.amount_in_rub} RUB)`,
            operation: "Внесение средств",
            wallet: "Внешний кошелек",
            id: income.address,
            receiver: user.id,
            remainder: Number(income.user_balance).toFixed(10)
        })
    }

    const cheques = await $cheque.find();
    for (const cheque of cheques) {
        if (cheque.ownerId === user.id && cheque.activated_by) {
            data.push({
                created: moment(cheque.finished).format('MMMM Do YYYY, HH:mm'),
                'operation_id': cheque.uid,
                status: "-",
                amount: `${cheque.amount} (${cheque.amount_in_rub} RUB)`,
                operation: "Перевод (чек)",
                wallet: "Баланс бота",
                id: user.id,
                receiver: cheque.activated_by,
                remainder: Number(cheque.user_balance).toFixed(10)
            })
        }
        if (cheque.activated_by && cheque.activated_by === user.id) {
            data.push({
                created: moment(cheque.finished).format('MMMM Do YYYY, HH:mm'),
                'operation_id': cheque.uid,
                status: "-",
                amount: `${cheque.amount} (${cheque.amount_in_rub} RUB)`,
                operation: "Пополнение (чек)",
                wallet: "Баланс бота",
                id: cheque.ownerId,
                receiver: user.id,
                remainder: Number(cheque.activator_user_balance).toFixed(10)
            })
        }

    }

    data.sort((a, b) => {
        const created_date_a = moment(a.created, 'MMMM Do YYYY, HH:mm');
        const created_date_b = moment(b.created, 'MMMM Do YYYY, HH:mm');
        if (created_date_a > created_date_b) {
            return -1;
        }
        if (created_date_a < created_date_b) {
            return 1;
        }
        return 0;
    });

    for (const elem of data) {
        const temp = {
            "created": elem.created,
            "operation_id": elem.operation_id,
            "status": elem.status,
            "amount": elem.amount,
            "operation": elem.operation,
            "wallet": elem.wallet,
            "id": elem.id,
            "receiver": elem.receiver,
            "payMethod": elem.payMethod,
            "remainder": elem.remainder
        };

        await worksheet.addRow(temp).commit();
    }

    await workbook.xlsx.writeFile(`./files/reports/${user.id}.xlsx`);

    if (data.length === 0) return ctx.answerCbQuery(ctx.i18n.t("get_finance_error"), true);

    try {
        await ctx.replyWithDocument({ source: `./files/reports/${ctx.match[1]}.xlsx` }, {
            caption: `Финансовый отчёт пользователя ${ctx.match[1]}`,
            reply_markup: back_keyboard(`get_user_byId ${ctx.match[1]}`).reply_markup
        });
    } catch(err) {
        ctx.answerCbQuery(ctx.i18n.t("get_finance_error"), true);
    }
});


bot.action(/get_all_users_by(.+)$/i, async(ctx)=> {
    const users = await $user.find();

    var sort_users;

    if(ctx.match[1] === "Balance") {
        sort_users = users.sort((a, b) => {
            if (a.balance > b.balance) {
                return -1;
            }
            if (a.balance < b.balance) {
                return 1;
            }
            
            return 0;
        });
    } else if(ctx.match[1] === "Amount") {
        sort_users = users.sort(async(a, b) => {
            const a_deals = await $deal.find({ ownerId: a.id,  status: 3 });
            const b_deals = await $deal.find({ ownerId: b.id,  status: 3 });

            var a_amount = 0;
            var b_amount = 0;
    
            for(const deal of a_deals) {
                a_amount+=deal.amount;
            }
    
            for(const deal of b_deals) {
                b_amount+=deal.amount;
            }

            if (a_amount > b_amount) {
                return -1;
            }
            if (a_amount < b_amount) {
                return 1;
            }
            
            return 0;
        });
    } else {
        sort_users = users.sort((a, b) => {
            if (a.last_message_date > b.last_message_date) {
                return -1;
            }
            if (a.last_message_date < b.last_message_date) {
                return 1;
            }
            
            return 0;
        });
    }

    fs.unlink(`./files/admin/${ctx.from.id}.xlsx`, (err => {
        if(err);
    }));


    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Список всех пользователей');
    worksheet.columns = [
      { header: 'id', key: 'id' },
      { header: 'Username', key: 'Username' },
      { header: 'Баланс', key: 'Баланс' },
      { header: 'Дата регистрации', key: 'Дата регистрации' },
      { header: 'Дата последней активности', key: 'Дата последней активности' },
      { header: 'Количество покупок', key: 'Количество покупок' },
      { header: 'Количество продаж', key: 'Количество продаж' },
      { header: 'Количество отменненых покупок', key: 'Количество отменненых покупок' },
      { header: 'Количество отменненых продаж', key: 'Количество отменненых продаж' },
      { header: 'Сумма покупок (успешных)', key: 'Сумма покупок (успешных)' },
      { header: 'Сумма продаж (успешных)', key: 'Сумма продаж (успешных)' },
      { header: 'Количество пополнений', key: 'Количество пополнений' },
      { header: 'Количество выводов', key: 'Количество выводов' },
      { header: 'Сумма пополнений', key: 'Сумма пополнений' },
      { header: 'Сумма выводов', key: 'Сумма выводов' },
      { header: 'Количество сессий', key: 'Количество сессий' }
    ];

    for(const user of sort_users) {
        const sell_deals = await $deal.find({ ownerId: user.id, method: "sell", status: 3 });
        const buy_deals = await $deal.find({ ownerId: user.id, method: "buy", status: 3 });

        const canceled_sell_deals = await $deal.find({ ownerId: user.id, method: "sell", status: 4 });
        const canceled_buy_deals = await $deal.find({ ownerId: user.id, method: "buy", status: 4 });

        var amount_sell_deals = 0;
        var amount_buy_deals = 0;

        for(const deal of sell_deals) {
            amount_sell_deals+=deal.amount;
        }

        for(const deal of buy_deals) {
            amount_buy_deals+=deal.amount;
        }

        var income_sum = 0;
        var withdrawal_sum = 0;

        const incomes = await $income.find({ ownerId: user.id })
        var income_count = incomes.length;

        for (const income of incomes) {
            income_sum += income.amount;
        }

        const withdrawals = await $withdrawal.find({ ownerId: user.id });
        var withdrawal_count = withdrawals.length;
        for (const withdrawal of withdrawals) {
            withdrawal_sum += withdrawal.amount;
        }

        const data =  {
            "id": user.id,
            "Username": user.username,
            "Баланс": user.balance + " BTC",
            "Дата регистрации": moment(user.registration_date).format('MMMM Do YYYY, HH:mm:ss'),
            "Дата последней активности": moment(user.last_message_date).format('MMMM Do YYYY, HH:mm:ss'),
            "Количество покупок": buy_deals.length,
            "Количество продаж": sell_deals.length,
            "Количество отменненых покупок": canceled_buy_deals.length,
            "Количество отменненых продаж": canceled_sell_deals.length,
            "Сумма покупок (успешных)": amount_buy_deals + " BTC",
            "Сумма продаж (успешных)": amount_sell_deals + " BTC",
            "Количество пополнений": income_count,
            "Количество выводов": withdrawal_count,
            "Сумма пополнений": fromExponential(income_sum),
            "Сумма выводов": fromExponential(withdrawal_sum),
            "Количество сессий": user.activeSessions.length
        };

        await worksheet.addRow(data).commit();
    }

    await workbook.xlsx.writeFile(`./files/admin/${ctx.from.id}.xlsx`);    
    await ctx.editMessageText(ctx.i18n.t("get_all_users"), {
        parse_mode: "HTML",
        reply_markup: admin_get_file_all_users_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/^get_file_all_users (.+)$/i, async(ctx)=> {
    await ctx.deleteMessage();

    var text;

    if (ctx.match[1] === "Balance") text = "Сортировка пользователей по балансу";
    else if (ctx.match[1] === "Amount") text = "Сортировка пользователей по сумме сделок";
    else text = "Сортировка пользователей по времени последней активности";

    await ctx.replyWithDocument({ source: `./files/admin/${ctx.from.id}.xlsx` }, {
        caption: text,
        reply_markup: back_keyboard("get_all_users").reply_markup
    });
});

bot.action('admin_stats_exchange', async(ctx)=>{
    var deals = await $deal.find();
    const startTime = moment();

    for(var i = 0;i<deals.length;i++) {
        var duration = moment.duration(startTime.diff(moment(deals[i].created_at))).asHours();
        if(duration > 24) {
            deals.splice(i, 1);
        }
    }

    var sold = 0;
    var bought = 0;
    var done = 0;
    var cancel = 0;

    for (const deal of deals) {
        if (deal.status === 3) {
            if (deal.method === "buy") {
                sold += deal.amount;
            } else {
                bought += deal.amount;
            }
            done += 1;
        }


        if(deal.status === 4) {
            cancel+=1;
        }
    }

    await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange", {
        sold: bought,
        bought: sold,
        done: done,
        cancel: cancel
    }), admin_stats_exchange_keyboard());
});

bot.action('admin_stats_exchange_other', async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange_other"), {
            parse_mode: "HTML",
            reply_markup: (await admin_stats_exchange_other_keyboard()).reply_markup
        });
    } catch (err) {
        await ctx.deleteMessage();

        ctx.replyWithHTML(ctx.i18n.t("admin_stats_exchange_other"), (await admin_stats_exchange_other_keyboard()));
    }
});

bot.action(/^admin_stats_exchange_year (\d+)$/i, async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange_year"), {
        parse_mode: "HTML",
        reply_markup: admin_stats_exchange_byYear_keyboard(ctx.match[1]).reply_markup
    })
});

bot.action(/^admin_stats_exchange_year (\d+) (\d+)$/i, async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange_year_choose_day"), {
            parse_mode: "HTML",
            reply_markup: admin_stats_exchange_year_choose_day_keyboard(ctx.match[1], ctx.match[2]).reply_markup
        });
    } catch (err) {
        ctx.replyWithHTML(ctx.i18n.t("admin_stats_exchange_year_choose_day"), admin_stats_exchange_year_choose_day_keyboard(ctx.match[1], ctx.match[2]));
    }
});


bot.action(/^admin_stats_exchange_year (\d+) (\d+) (\d+)$/i, async (ctx) => {
    const deals = await $deal.find();
    var data = [];

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(`Отчёт за ${ctx.match[3]}.${ctx.match[2]}.${ctx.match[1]}`);
    worksheet.columns = [
      { header: 'ID заявки', key: 'id' },
      { header: 'Вид', key: 'method' },
      { header: 'Способ оплаты', key: 'payment_method' },
      { header: 'Сумма заявки RUB', key: 'amount_rub' },
      { header: 'Сумма заявки BTC', key: 'amount_btc' },
      { header: 'Курс продажи RUB', key: 'rate' },
      { header: 'Статус заявки', key: 'status' },
      { header: 'Реквизиты', key: 'requisites' },
      { header: 'Создана', key: 'created' },
      { header: 'Выполнена', key: 'done' },
      { header: 'Id пользователя ', key: 'user_id' },
      { header: 'Username ', key: 'username' }
    ];

    for(var i = 0;i<deals.length;i++) {
        var year = moment(deals[i].created_at).year();
        var month = moment(deals[i].created_at).month();
        var day = Number(moment(deals[i].created_at).format('D'));
        if(year === Number(ctx.match[1]) && month === Number(ctx.match[2]) && day === Number(ctx.match[3])) {
            data.push(deals[i])
        }
    }

    if (data.length === 0) return ctx.answerCbQuery(ctx.i18n.t("admin_exchange_noDeals"), true);
    data.sort((a, b) => {        
        if (a.uid > b.uid) {
            return -1;
        }
        if (a.uid < b.uid) {
            return 1;
        }
        return 0;
    });

    for(const deal of data) {
        const ad = await $ad.findOne({ uid: deal.ad_uid });
        const owner = await $user.findOne({ id: deal.ownerId });

        const data =  {
            "id": deal.uid,
            "method": deal.method === "sell" ? "покупка" : "продажа",
            "payment_method": ad.method,
            "amount_rub": deal.amount_in_rub,
            "amount_btc": deal.amount,
            "rate": deal.rate,
            "status": statuses[deal.status],
            "requisites": deal.requisites,
            "created": moment(deal.created_at).format('MMMM Do YYYY, HH:mm:ss'),
            "done": deal.finished === "-" ? "-" : moment(deal.finished).format('MMMM Do YYYY, HH:mm:ss'),
            "user_id": deal.ownerId,
            "username": owner.username
        };

        await worksheet.addRow(data).commit();
    }

    await workbook.xlsx.writeFile(`./files/admin/${ctx.from.id}.xlsx`);    
    await ctx.editMessageText(ctx.i18n.t("get_deals_byYear"), {
        parse_mode: "HTML",
        reply_markup: admin_get_file_deal_byYear_keyboard(ctx.match[1], ctx.match[2], ctx.match[3]).reply_markup
    });
});

bot.action(/get_file_deals_byYear (\d+) (\d+) (\d+)$/i, async(ctx)=> {
    await ctx.deleteMessage();

    await ctx.replyWithDocument({ source: `./files/admin/${ctx.from.id}.xlsx` }, back_keyboard(`admin_stats_exchange_year ${ctx.match[1]} ${ctx.match[2]}`));
});

bot.action("get_exchange_byId", (ctx)=> {
    return ctx.scene.enter("get_exchange_byId_scene")
});

bot.action('admin_methods', async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("admin_methods"), {
        parse_mode: "HTML",
        reply_markup: (await admin_methods_keyboard()).reply_markup
    });
});

bot.action(/^admin_method_check (\d+)$/i, async(ctx)=>{
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    if (!ad.active) return ctx.answerCbQuery(ctx.i18n.t("admin_method_notActive"), true);
    await ad.set("buy_balance", Number(ad.buy_balance).toFixed(15))
    var keyboard;

    const finder = await $ad.findOne({ adminChat: ctx.chat.id });
    if (finder) {
        keyboard = await admin_method_check_keyboard_limit(ad);
    } else {
        keyboard = await admin_method_check_keyboard(ad);
    }
    await ctx.editMessageText(ctx.i18n.t("admin_method_check", {
        method: ad.method,
        balance: ad.buy_balance,
        chat_link: ad.chat_link
    }), {
        parse_mode: "HTML",
        reply_markup: keyboard.reply_markup
    });
});

bot.action(/admin_ad_change_requisites (\d+)$/i, async(ctx)=> {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    if(!ad.active) return ctx.answerCbQuery(ctx.i18n.t("admin_method_notActive"), true);
    await ctx.editMessageText(ctx.i18n.t("admin_ad_change_requisites"), {
        parse_mode: "HTML",
        reply_markup: requisites_keyboard(ad).reply_markup
    });
});

bot.action(/add_requisite (\d+)$/i, (ctx)=> {
    return ctx.scene.enter("add_requisite_scene", { uid: ctx.match[1] });
});

bot.action(/choose_requisite (\d+) (\d+)$/i, async(ctx)=> {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    if(!ad.active) return ctx.answerCbQuery(ctx.i18n.t("admin_method_notActive"), true);

    await ctx.editMessageText(`${ad.requisites_archive[ctx.match[2]]} (${ad.requisites === ad.requisites_archive[ctx.match[2]] ? "актив" : "архив"})`, {
        parse_mode: "HTML",
        reply_markup: (await choose_requisite_keyboard(ctx.match[1], ctx.match[2])).reply_markup
    })
});

bot.action(/edit_requisite_off (\d+) (\d+)$/i, async(ctx)=> {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    await ad.set("sell_active", false);
    await ad.set("buy_active", false);
    await ad.set("requisites", "-");

    await ctx.editMessageText(`${ad.requisites_archive[ctx.match[2]]} (${ad.requisites === ad.requisites_archive[ctx.match[2]] ? "актив" : "архив"})`, {
        parse_mode: "HTML",
        reply_markup: (await choose_requisite_keyboard(ctx.match[1], ctx.match[2])).reply_markup
    })
});

bot.action(/edit_requisite_on (\d+) (\d+)$/i, async(ctx)=> {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    await ad.set("requisites", ad.requisites_archive[ctx.match[2]]);

    await ctx.editMessageText(`${ad.requisites_archive[ctx.match[2]]} (${ad.requisites === ad.requisites_archive[ctx.match[2]] ? "актив" : "архив"})`, {
        parse_mode: "HTML",
        reply_markup: (await choose_requisite_keyboard(ctx.match[1], ctx.match[2])).reply_markup
    })
});

bot.action(/delete_requisite (\d+) (\d+)$/i, async(ctx)=> {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    await ctx.editMessageText(ctx.i18n.t("delete_requisite", {
        requisite: `*${ad.requisites_archive[ctx.match[2]].substr(-4)}`
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_ad_change_requisites ${ad.uid}`).reply_markup
    });

    ad.requisites_archive.splice(ctx.match[2], 1)
    await ad.save();
});

bot.action(/^admin_ad_change_selling_rate (\d+)$/i, async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("admin_change_rate"), {
        parse_mode: "HTML",
        reply_markup: rate_keyboard("selling_rate", ctx.match[1]).reply_markup
    });
});

bot.action(/^admin_ad_change_buying_rate (\d+)$/i, async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("admin_change_rate"), {
        parse_mode: "HTML",
        reply_markup: rate_keyboard("buying_rate", ctx.match[1]).reply_markup
    });
});

bot.action(/^admin_ad_change_(.+) (\d+)$/i, async(ctx)=>{
    return ctx.scene.enter(`admin_ad_change_${ctx.match[1]}_scene`, { uid: ctx.match[2] });
});

bot.action(/^admin_ad_sell_(.+) (\d+)$/i, async(ctx)=>{
    const ad = await $ad.findOne({ uid: ctx.match[2] });

    await ad.set("sell_active", ctx.match[1] === "off" ? false : true);

    const finder = await $ad.findOne({ adminChat: ctx.chat.id });
    if (finder) {
        keyboard = await admin_method_check_keyboard_limit(ad);
    } else {
        keyboard = await admin_method_check_keyboard(ad);
    }
    await ctx.editMessageText(ctx.i18n.t("admin_method_check", {
        method: ad.method,
        balance: ad.buy_balance,
        chat_link: ad.chat_link
    }), {
        parse_mode: "HTML",
        reply_markup: keyboard.reply_markup
    });
});

bot.action(/^admin_ad_buy_(.+) (\d+)$/i, async(ctx)=>{
    const ad = await $ad.findOne({ uid: ctx.match[2] });
    if (ctx.match[1] === "on") {
        if (ad.buy_balance <= 0) return ctx.answerCbQuery(`Резерв способа оплаты 0, нужно пополнить`, true);
    }

    await ad.set("buy_active", ctx.match[1] === "off" ? false : true);
    const finder = await $ad.findOne({ adminChat: ctx.chat.id });
    if (finder) {
        keyboard = await admin_method_check_keyboard_limit(ad);
    } else {
        keyboard = await admin_method_check_keyboard(ad);
    }

    await ctx.editMessageText(ctx.i18n.t("admin_method_check", {
        method: ad.method,
        balance: ad.buy_balance,
        chat_link: ad.chat_link
    }), {
        parse_mode: "HTML",
        reply_markup: keyboard.reply_markup
    });
});

bot.action(/^admin_ad_delete (\d+)$/i, (ctx)=>{
    return ctx.scene.enter("admin_ad_delete_scene", { uid: ctx.match[1] });
});

bot.action(/^admin_block (\d+)$/i, async(ctx)=>{
    const user = await $user.findOne({ id: ctx.match[1] });
    await user.set("banned", true);
    await ctx.editMessageText(ctx.i18n.t("admin_user_banned"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`get_user_byId ${user.id}`).reply_markup
    });
});

bot.action(/^admin_unblock (\d+)$/i, async(ctx)=>{
    const user = await $user.findOne({ id: ctx.match[1] });
    await user.set("banned", false);
    await ctx.editMessageText(ctx.i18n.t("admin_user_unbanned"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`get_user_byId ${user.id}`).reply_markup
    });
});

bot.action(/^admin_user_sessions (\d+)$/i, async(ctx)=>{
    await ctx.editMessageText(ctx.i18n.t("admin_user_sessions"), {
        parse_mode: "HTML",
        reply_markup: (await admin_user_sessions_keyboard(ctx.match[1])).reply_markup
    });
});

bot.action(/^admin_cancel_session (\d+) (\d+)$/i, async(ctx)=>{
    const user = await $user.findOne({ id: ctx.match[1] });
    if(user.id === Number(ctx.match[2])) return ctx.answerCbQuery(ctx.i18n.t("admin_user_cancel_session_error"), true);
    const index = user.activeSessions.indexOf(Number(ctx.match[2]));

    if (index !== -1) {
        user.activeSessions.splice(index, 1);
    }
    await user.save();

    await ctx.editMessageText(ctx.i18n.t("admin_user_cancel_session"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_user_sessions ${ctx.match[1]}`).reply_markup
    });
});

bot.action(/admin_more$/i, async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_more"), {
            parse_mode: "HTML",
            reply_markup: (await admin_more_keyboard()).reply_markup
        });
    } catch (err) {
        await ctx.deleteMessage();
        ctx.replyWithHTML(ctx.i18n.t("admin_more"), (await admin_more_keyboard()));
    }

});

bot.action(/^admin_change_(.+)$/i, async(ctx)=>{
    return ctx.scene.enter(`admin_change_${ctx.match[1]}_scene`);
});

bot.action("admin_withdrawal_commission", async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    await ctx.editMessageText(ctx.i18n.t("admin_withdrawal_commission", {
        commission: admin.withdrawal_commission
    }), {
        parse_mode: "HTML",
        reply_markup: admin_withdrawal_commission_keyboard().reply_markup
    });
});

bot.action("admin_set_withdrawal_dynamic", async(ctx)=> {
    const admin = await $admin.findOne({ uid: 0 });
    await admin.set("withdrawal_commission_blockchain", true);
    await admin.set("withdrawal_commission_blockchain_percent", 0);
    await ctx.editMessageText(ctx.i18n.t("admin_set_withdrawal_dynamic"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_withdrawal_commission")
    });
});

bot.action(/^admin_set_withdrawal_byHand (\d+)$/i, (ctx)=> {
    return ctx.scene.enter("admin_set_withdrawal_byHand_scene", { speed_id: ctx.match[1] });
});

bot.action("admin_set_withdrawal_dynamic_percent", (ctx)=> {
    return ctx.scene.enter("admin_set_withdrawal_dynamic_percent_scene")
});

bot.action(/admin_ad_exchange_stats (\d+)$/i, async (ctx) => {
    const deals = await $deal.find({ ad_uid: ctx.match[1] });
    var sell = 0;
    var sell_rub = 0;
    var buy = 0;
    var buy_rub = 0;
    var done = 0;
    var cancel = 0;

    for (const deal of deals) {
        if (deal.status === 3) {
            if (deal.method === "buy") {
                sell += deal.amount;
                sell_rub += deal.amount_in_rub;
            } else {
                buy += deal.amount;
                buy_rub += deal.amount_in_rub;
            }
            done += 1
        }


        if (deal.status === 4) {
            cancel += 1;
        }
    }

    await ctx.editMessageText(ctx.i18n.t("admin_ad_exchange_stats", {
        sell: sell,
        sell_rub: sell_rub,
        buy: buy,
        buy_rub: buy_rub,
        done: done,
        cancel: cancel
    }), {
        parse_mode: "HTML",
        reply_markup: admin_ad_exchange_24hours_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/admin_ad_exchange_stats_go (\d+)$/i, async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange_other"), {
            parse_mode: "HTML",
            reply_markup: (await admin_ad_exchange_stats_keyboard(ctx.match[1])).reply_markup
        });
    } catch (err) {
        await ctx.deleteMessage();

        ctx.replyWithHTML(ctx.i18n.t("admin_stats_exchange_other"), (await admin_ad_exchange_stats_keyboard(ctx.match[1])));
    }
});

bot.action(/^admin_ad_exchange_stats_year (\d+) (\d+)$/i, async (ctx) => {
    try {
        await ctx.editMessageText(ctx.i18n.t("admin_stats_exchange_year"), {
            parse_mode: "HTML",
            reply_markup: admin_ad_exchange_stats_byYear_keyboard(ctx.match[1], ctx.match[2]).reply_markup
        })
    } catch (err) {
        await ctx.deleteMessage();
        ctx.replyWithHTML(ctx.i18n.t("admin_stats_exchange_year"), admin_ad_exchange_stats_byYear_keyboard(ctx.match[1], ctx.match[2]))
    }

});

bot.action(/^admin_ad_exchange_stats_year (\d+) (\d+) (\d+)$/i, async (ctx) => {
    const deals = await $deal.find({ ad_uid: ctx.match[1] });
    var data = [];

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(`Отчёт за ${months[ctx.match[3]]} ${ctx.match[2]} г.`);
    worksheet.columns = [
        { header: 'ID заявки', key: 'id' },
        { header: 'Вид', key: 'method' },
        { header: 'Способ оплаты', key: 'payment_method' },
        { header: 'Сумма заявки RUB', key: 'amount_rub' },
        { header: 'Сумма заявки BTC', key: 'amount_btc' },
        { header: 'Курс продажи RUB', key: 'rate' },
        { header: 'Статус заявки', key: 'status' },
        { header: 'Реквизиты', key: 'requisites' },
        { header: 'Создана', key: 'created' },
        { header: 'Выполнена', key: 'done' },
        { header: 'Id пользователя ', key: 'user_id' },
        { header: 'Username ', key: 'username' },
        { header: 'Администратор', key: 'administrator'}
    ];

    for (var i = 0; i < deals.length; i++) {
        var year = moment(deals[i].created_at).year();
        var month = moment(deals[i].created_at).month();

        if (year === Number(ctx.match[2]) && month === Number(ctx.match[3])) {
            data.push(deals[i])
        }
    }

    if (data.length === 0) return ctx.answerCbQuery(ctx.i18n.t("admin_exchange_noDeals"), true);
    data.sort((a, b) => {
        if (a.uid > b.uid) {
            return -1;
        }
        if (a.uid < b.uid) {
            return 1;
        }
        return 0;
    });

    for (const deal of data) {
        const ad = await $ad.findOne({ uid: deal.ad_uid });
        const owner = await $user.findOne({ id: deal.ownerId });

        const data = {
            "id": deal.uid,
            "method": deal.method === "sell" ? "покупка" : "продажа",
            "payment_method": ad.method,
            "amount_rub": deal.amount_in_rub,
            "amount_btc": deal.amount,
            "rate": deal.rate,
            "status": statuses[deal.status],
            "requisites": deal.requisites,
            "created": moment(deal.created_at).format('MMMM Do YYYY, HH:mm:ss'),
            "done": deal.finished === "-" ? "-" : moment(deal.finished).format('MMMM Do YYYY, HH:mm:ss'),
            "user_id": deal.ownerId,
            "username": owner.username,
            "administrator": deal.administrator
        };

        await worksheet.addRow(data).commit();
    }

    await workbook.xlsx.writeFile(`./files/admin/${ctx.from.id}.xlsx`);
    await ctx.editMessageText(ctx.i18n.t("get_deals_byYear"), {
        parse_mode: "HTML",
        reply_markup: admin_get_ad_exchange_stats_keyboard(ctx.match[1], ctx.match[2]).reply_markup
    });
});

bot.action(/get_file_ad_exchange_stats (\d+) (\d+)$/i, async(ctx)=> {
    await ctx.deleteMessage();

    await ctx.replyWithDocument({ source: `./files/admin/${ctx.from.id}.xlsx` }, back_keyboard(`admin_ad_exchange_stats_year ${ctx.match[1]} ${ctx.match[2]}`));
});

bot.action("admin_balance", async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    const ads = await $ad.find({ active: true });
    const users = await $user.find();
    var users_balance = 0;
    var ads_balance = 0;
    for(const ad of ads) {
        ads_balance+=ad.buy_balance
    }

    for(const user of users) {
        users_balance+=user.balance;
    }

    var text = `
Баланс общей коровы: ${fromExponential((admin.balance + admin.sell_balance + users_balance + ads_balance).toFixed(10))}
Основной баланс: ${fromExponential((admin.balance).toFixed(10)) } BTC
Комиссионный баланс: ${fromExponential((admin.commission_balance).toFixed(10))} BTC
Баланс продаж: ${fromExponential((admin.sell_balance).toFixed(10))} BTC
Баланс пользователей: ${fromExponential((users_balance).toFixed(10)) } BTC
    
    `

    for(const ad of ads) {
        text+=`\nБаланс <b>«${ad.method}»</b> ${ad.buy_balance} BTC`
    }

    await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: admin_balance_keyboard().reply_markup
    })
})

bot.action("admin_add_balance", async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_add_balance", {
        address: btc_account_address
    }), {
        parse_mode: "HTML",
        reply_markup: admin_add_balance_keyboard().reply_markup
    });
});

bot.action("admin_add_balance_set", (ctx) => {
    return ctx.scene.enter("admin_add_balance_set_scene")
});

bot.action("admin_add_balance_sell", async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    if (admin.sell_balance <= 0) return ctx.answerCbQuery(ctx.i18n.t("admin_add_balance_sell_error"), true);

    return ctx.scene.enter("admin_add_balance_sell_scene");
});

bot.action("admin_add_balance_commission", async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    if (admin.commission_balance <= 0) return ctx.answerCbQuery(ctx.i18n.t("admin_add_balance_commission_error"), true);

    return ctx.scene.enter("admin_add_balance_commission_scene");
});

bot.action("admin_withdraw_balance", async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    if(admin.balance <= 0) return ctx.answerCbQuery(ctx.i18n.t("admin_withdraw_balance"), true);
    return ctx.scene.enter("admin_withdraw_balance_scene")
});

bot.action("admin_settings_balance", async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance", {
        balance: admin.balance
    }), {
        parse_mode: "HTML",
        reply_markup: (await admin_settings_balance_keyboard()).reply_markup
    });
});

bot.action(/admin_settings_balance (\d+)$/i, async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });

    await ctx.editMessageText(ctx.i18n.t("admin_settings_byId_balance", {
        method: ad.method,
        amount: ad.buy_balance
    }), {
        parse_mode: "HTML",
        reply_markup: admin_settings_balance_byId_keyboard(ad.uid).reply_markup
    });
});

bot.action(/admin_settings_balance_add (\d+)$/i, (ctx) => {
    return ctx.scene.enter("admin_settings_balance_add_scene", { uid: ctx.match[1] });
});

bot.action(/admin_settings_balance_remove (\d+)$/i, async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_remove", {
        method: ad.method
    }), {
        parse_mode: "HTML",
        reply_markup: admin_settings_balance_remove_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/admin_settings_balance_remove_done (\d+)$/i, async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    const admin = await $admin.findOne({ uid: 0 });

    await admin.inc("balance", ad.buy_balance);
    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_remove_done", {
        amount: ad.buy_balance
    }), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_settings_balance ${ctx.match[1]}`)
    })

    await ad.set("buy_balance", 0);
});

bot.action("admin_notifications_balance", async(ctx) => {
    const admin = await $admin.findOne({ uid: 0 });

    if(admin.lessbalance_notifications.length !== 0) {
        await ctx.editMessageText(ctx.i18n.t("admin_notifications_balance_have", {
            amount: admin.lessbalance_notifications[0]
        }), {
            parse_mode: "HTML",
            reply_markup: admin_lessbalance_notifications_have_keyboard().reply_markup
        });
    } else {
        await ctx.editMessageText(ctx.i18n.t("admin_notifications_balance_no"), {
            parse_mode: "HTML",
            reply_markup: admin_lessbalance_notifications_no_keyboard().reply_markup
        });
    }
});

bot.action("admin_add_notification", (ctx) => {
    return ctx.scene.enter("admin_add_notification_scene")
});

bot.action("admin_delete_notification", async (ctx) => {
    const admin = await $admin.findOne({ uid: 0 });
    admin.lessbalance_notifications.pop();
    await admin.save();

    await ctx.editMessageText(ctx.i18n.t("admin_delete_notification"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_balance").reply_markup
    });
});

bot.action(/admin_settings_balance_limit (\d+)$/i, async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });
    if (ad.balance_limit !== 0) {
        await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_limit", {
            amount: ad.balance_limit
        }), {
            parse_mode: "HTML",
            reply_markup: admin_settings_balance_limit_keyboard(ctx.match[1]).reply_markup
        });
    } else {
        return ctx.scene.enter("admin_settings_balance_limit_scene", {
            uid: ctx.match[1]
        });
    }
})

bot.action(/admin_settings_balance_limit_remove (\d+)$/i, async(ctx) => {
    const ad = await $ad.findOne({ uid: ctx.match[1] });

    await ad.set("balance_limit", 0);
    await ctx.editMessageText(ctx.i18n.t("admin_settings_balance_limit_remove"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_settings_balance ${ctx.match[1]}`)
    })
})

bot.action("admin_advertisement", async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_advertisement"), {
        parse_mode: "HTML",
        reply_markup: (await admin_advertisement_keyboard()).reply_markup
    });
});

bot.action("admin_add_advertisement", (ctx) => {
    return ctx.scene.enter("admin_add_advertisement_scene")
});

bot.action(/admin_check_advertisement (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });

    await ctx.editMessageText(ctx.i18n.t("admin_check_advertisement", {
        name: advertisement.name,
        link_source: advertisement.link_source,
        botUsername: botUsername,
        password: advertisement.password,
        created_at: moment(advertisement.created_at).format('MMMM Do YYYY, HH:mm:ss'),
        released_at: advertisement.released_at !== "-" ? moment(advertisement.released_at).format('MMMM Do YYYY, HH:mm:ss') : "-",
    }), {
        parse_mode: "HTML",
        reply_markup: admin_check_advertisement_keyboard(advertisement.uid).reply_markup
    });
});

bot.action(/admin_advertisement_edit_time (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });
    if (!advertisement.active) return ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_isNotActive"), true);
    return ctx.scene.enter("admin_advertisement_edit_time_scene", { uid: ctx.match[1] });
})

bot.action(/admin_advertisement_bonus (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });
    if (!advertisement.active) return ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_isNotActive"), true);
    if (advertisement.bonus.length !== 0) {
        await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_ok", {
            percent: advertisement.bonus[0].percent,
            limit: advertisement.bonus[0].limit,
            finished_date: moment(advertisement.bonus[0].finished_date).format('MMMM Do YYYY, HH:mm:ss')
        }), {
            parse_mode: "HTML",
            reply_markup: (await admin_advertisement_bonus_keyboard(advertisement.uid)).reply_markup
        })
    } else {
        await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_no"), {
            parse_mode: "HTML",
            reply_markup: (await admin_advertisement_bonus_keyboard(advertisement.uid)).reply_markup
        })
    }
});

bot.action(/admin_advertisement_bonus_delete (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });
    if (!advertisement.active) return ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_isNotActive"), true);
    advertisement.bonus.pop();
    await advertisement.save();
    await ctx.editMessageText(ctx.i18n.t("admin_advertisement_bonus_delete"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard(`admin_check_advertisement ${ctx.match[1]}`).reply_markup
    });
})

bot.action(/admin_advertisement_bonus_add (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });
    if (!advertisement.active) return ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_isNotActive"), true);

    return ctx.scene.enter("admin_advertisement_bonus_add_scene", { uid: ctx.match[1] });
});

bot.action(/admin_advertisement_stats (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });
    if (!advertisement.active) return ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_isNotActive"), true);

    const users = await $user.find({ registration_password: advertisement.password });

    var days = [];
    var count = [];

    for (const user of users) {
        var day = moment(user.registration_date).date() - 1;
        var month = moment(user.registration_date).month() + 1;
        var year = moment(user.registration_date).year();

        if (!days.includes(`${day}.${month}.${year}`)) {
            days.push(`${day}.${month}.${year}`);
        }

        var index = days.indexOf(`${day}.${month}.${year}`);
        if (!count[index]) {
            count[index] = 0;
        }
        count[index] += 1;
    }

    var text = "";

    var sum = 0;
    for (var i = 0; i < days.length; i++) {
        sum += count[i];

        text+=`\n${days[i]} --> ${count[i]}`
    }

    text += `\n\nИтого за месяц: ${sum}`;
    try {
        await ctx.editMessageText(text, {
            parse_mode: "HTML",
            reply_markup: back_keyboard(`admin_check_advertisement ${advertisement.uid}`).reply_markup
        })
    } catch (err) {
        await ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_stats_error"), true);
    }
});

bot.action(/admin_advertisement_delete (\d+)$/i, async (ctx) => {
    const advertisement = await $advertisement.findOne({ uid: ctx.match[1] });
    if (!advertisement.active) return ctx.answerCbQuery(ctx.i18n.t("admin_advertisement_isNotActive"), true);

    await advertisement.set("active", false);
    await ctx.editMessageText(ctx.i18n.t("admin_advertisement_delete"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_advertisement").reply_markup
    });
});

bot.action("admin_bonuses", async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_bonuses"), {
        parse_mode: "HTML",
        reply_markup: admin_bonus_keyboard().reply_markup
    });
})

bot.action("admin_bonus_all_users", async (ctx) => {
    return ctx.scene.enter("admin_bonus_all_users_scene")
});

bot.action("admin_bonus_by_userId", async (ctx) => {
    return ctx.scene.enter("admin_bonus_by_userId_scene_start")
});

bot.action("admin_bonus_by_countDeals", async (ctx) => {
    return ctx.scene.enter("admin_bonus_by_countDeals_scene_start")
});

bot.action("admin_bonus_by_amountDeals", async (ctx) => {
    return ctx.scene.enter("admin_bonus_by_amountDeals_scene_start")
});

bot.action(/admin_delete_bonus (\d+)$/i, async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_delete_bonus"), {
        parse_mode: "HTML",
        reply_markup: admin_delete_bonus_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/admin_delete_bonus_ok (\d+)$/i, async (ctx) => {
    const bonus = await $bonus.findOne({ uid: ctx.match[1] });
    if (!bonus.active) return ctx.answerCbQuery(ctx.i18n.t("admin_delete_bonus_error"), true);
    await bonus.set("active", false);
    await ctx.editMessageText(ctx.i18n.t("admin_delete_bonus_ok"));

    const users = await $user.find();

    for (const user of users) {
        for (const elem of user.bonus) {
            if (elem.uid === bonus.uid) {
                user.bonus.pop();
            }
        }

        await user.save();
    }
})

bot.action("admin_vouchers", async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_vouchers"), {
        parse_mode: "HTML",
        reply_markup: admin_vouchers_keyboard().reply_markup
    });
});

bot.action("admin_vouchers_all_users", (ctx) => {
    return ctx.scene.enter("admin_vouchers_all_users_scene")
})

bot.action("admin_vouchers_by_userId", (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_userId_scene_start")
})

bot.action("admin_vouchers_by_countDeals", (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_countDeals_scene_start")
})

bot.action("admin_vouchers_by_amountDeals", (ctx) => {
    return ctx.scene.enter("admin_vouchers_by_amountDeals_scene_start")
})

bot.action(/admin_delete_voucher (\d+)$/i, async (ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_delete_voucher"), {
        parse_mode: "HTML",
        reply_markup: admin_delete_voucher_keyboard(ctx.match[1]).reply_markup
    });
});

bot.action(/admin_delete_voucher_ok (\d+)$/i, async (ctx) => {
    const voucher = await $voucher.findOne({ uid: ctx.match[1] });
    if (!voucher.active) return ctx.answerCbQuery(ctx.i18n.t("admin_delete_voucher_error"), true);
    await voucher.set("active", false);
    await ctx.editMessageText(ctx.i18n.t("admin_delete_voucher_ok"));

    const users = await $user.find();

    for (const user of users) {
        for (var i = 0; i < user.vouchers.length;i++) {
            if (user.vouchers[i].uid === voucher.uid) {
                user.vouchers.splice(i, 1);
            }
        }

        await user.save();
    }
})
