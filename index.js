const { bot } = require('./connection/telegram.js');
const { getUser, saveUser, admin_chat, btc_convert, split_number } = require('./helpers/utils');
const { Stage } = require('telegraf');
const { set_password_scene, set_password_scene_2, set_password_scene_3 } = require('./scenes/set_password_scene.js');
const { sign_in_scene, sign_in_scene_2 } = require('./scenes/sign_in_scene.js');
const { main_keyboard, go_to_main_keyboard, cheque_keyboard, admin_keyboard, admin_method_check_keyboard, admin_method_check_keyboard_limit } = require('./helpers/keyboards.js');
const { deal_sell_scene, deal_sell_scene_2, deal_sell_scene_3, deal_sell_scene_4, deal_sell_scene_5 } = require('./scenes/deal_sell_scene.js');
const { deal_buy_scene, deal_buy_scene_2, deal_buy_scene_2_ask_address, deal_buy_scene_4, deal_buy_scene_3 } = require('./scenes/deal_buy_scene.js');
const { insert_scene } = require('./scenes/insert_scene.js');
const { $user, $cheque, $advertisement, $admin, $ad } = require('./connection/mongoose.js');
const moment = require("moment");
const { admin_ad_change_sell_min_scene } = require('./scenes/admin_ad_change_sell_min_scene.js');
const { admin_ad_change_buy_min_scene } = require('./scenes/admin_ad_change_buy_min_scene.js');
const { admin_ad_delete_scene } = require('./scenes/admin_ad_delete_scene.js');
const { get_exchange_byId_scene } = require('./scenes/get_exchange_byId_scene.js');
const { give_amount_scene } = require('./scenes/give_amount_scene.js');
const { get_user_byId_scene } = require('./scenes/get_user_byId_scene.js');
const { create_cheque_scene, create_cheque_scene_start } = require('./scenes/create_cheque_scene.js');
const { admin_add_method_scene } = require('./scenes/admin_add_method_scene.js');
const { add_requisite_scene } = require('./scenes/add_requisite_scene.js');
const { admin_ad_change_selling_rate_fixed_scene } = require('./scenes/admin_ad_change_selling_rate_fixed_scene.js');
const { admin_ad_change_selling_rate_percent_scene } = require('./scenes/admin_ad_change_selling_rate_percent_scene.js');
const { admin_ad_change_buying_rate_fixed_scene } = require('./scenes/admin_ad_change_buying_rate_fixed_scene.js');
const { admin_ad_change_buying_rate_percent_scene } = require('./scenes/admin_ad_change_buying_rate_percent_scene.js');
const { admin_change_min_insert_scene } = require('./scenes/admin_change_min_insert_scene.js');
const { admin_change_min_withdrawal_scene } = require('./scenes/admin_change_min_withdrawal_scene.js');
const { admin_set_withdrawal_byHand_scene } = require('./scenes/admin_set_withdrawal_byHand_scene.js');
const { admin_set_withdrawal_dynamic_percent_scene } = require('./scenes/admin_set_withdrawal_dynamic_percent_scene.js');
const { withdrawal_scene, withdrawal_scene_2, withdrawal_scene_ask_speed } = require('./scenes/withdrawal_scene.js');
const { admin_add_balance_set_scene } = require('./scenes/admin_add_balance_set_scene.js');
const { admin_add_balance_sell_scene } = require('./scenes/admin_add_balance_sell_scene.js');
const { admin_withdraw_balance_scene, admin_withdraw_balance_scene_2 } = require('./scenes/admin_withdraw_balance_scene.js');
const { admin_settings_balance_add_scene } = require('./scenes/admin_settings_balance_add_scene.js');
const { admin_add_notification_scene } = require('./scenes/admin_add_notification_scene.js');
const { admin_settings_balance_limit_scene } = require('./scenes/admin_settings_balance_limit_scene.js');
const { admin_advertisement_edit_time_scene } = require('./scenes/admin_advertisement_edit_time_scene.js');
const { admin_advertisement_bonus_add_scene, admin_advertisement_bonus_add_scene_2, admin_advertisement_bonus_add_scene_3 } = require('./scenes/admin_advertisement_bonus_add_scene.js');
const { admin_add_advertisement_scene, admin_add_advertisement_scene_2, admin_add_advertisement_scene_3, admin_add_advertisement_scene_4 } = require('./scenes/admin_add_advertisement_scene.js');
const { change_password_scene, change_password_scene_2, change_password_scene_3 } = require('./scenes/change_password_scene.js');
const { admin_order_cancel_scene } = require('./scenes/admin_order_cancel_scene.js');
const { admin_bonus_all_users_scene, admin_bonus_all_users_scene_2, admin_bonus_all_users_scene_3, admin_bonus_all_users_scene_4 } = require('./scenes/admin_bonus_all_users_scene.js');
const { admin_bonus_by_countDeals_scene_start, admin_bonus_by_countDeals_scene, admin_bonus_by_countDeals_scene_2, admin_bonus_by_countDeals_scene_3, admin_bonus_by_countDeals_scene_4 } = require('./scenes/admin_bonus_by_countDeals_scene.js')
const { admin_bonus_by_amountDeals_scene_start, admin_bonus_by_amountDeals_scene, admin_bonus_by_amountDeals_scene_2, admin_bonus_by_amountDeals_scene_3, admin_bonus_by_amountDeals_scene_4 } = require('./scenes/admin_bonus_by_amountDeals_scene.js')
const {
    admin_bonus_by_userId_scene_start,
    admin_bonus_by_userId_scene_bonusNo,
    admin_bonus_by_userId_scene_bonusYes,
    admin_bonus_by_userId_scene,
    admin_bonus_by_userId_scene_2,
    admin_bonus_by_userId_scene_3,
    admin_bonus_by_userId_scene_4
} = require('./scenes/admin_bonus_by_userId_scene.js');
const { admin_vouchers_all_users_scene, admin_vouchers_all_users_scene_2, admin_vouchers_all_users_scene_3 } = require('./scenes/admin_vouchers_all_users_scene.js');
const { admin_vouchers_by_userId_scene_start, admin_vouchers_by_userId_scene, admin_vouchers_by_userId_scene_2, admin_vouchers_by_userId_scene_3 } = require('./scenes/admin_vouchers_by_userId_scene.js');
const {
    admin_vouchers_by_countDeals_scene_start,
    admin_vouchers_by_countDeals_scene,
    admin_vouchers_by_countDeals_scene_2,
    admin_vouchers_by_countDeals_scene_3
} = require('./scenes/admin_vouchers_by_countDeals_scene.js');

const {
    admin_vouchers_by_amountDeals_scene_start,
    admin_vouchers_by_amountDeals_scene,
    admin_vouchers_by_amountDeals_scene_2,
    admin_vouchers_by_amountDeals_scene_3
} = require('./scenes/admin_vouchers_by_amountDeals_scene.js');
const { admin_commission_set_scene } = require('./scenes/admin_commission_set_scene.js');
const { admin_messenger_scene, messengerScene, admin_messenger_scene_2, admin_messenger_scene_3 } = require('./scenes/admin_messenger_scene.js');
const { admin_add_balance_commission_scene } = require('./scenes/admin_add_balance_commission_scene.js');
const { admin_ad_change_buy_max_scene, admin_ad_change_buy_max_scene_2 } = require('./scenes/admin_ad_change_buy_max_scene.js');
const { admin_ad_change_sell_max_scene } = require('./scenes/admin_ad_change_sell_max_scene.js');
const fromExponential = require('from-exponential');


process
    .on('unhandledRejection', (reason, p) => {
        console.log(`Unhandled Rejection at Promise: ${reason}\n\n${p}`);
    })
    .on('uncaughtException', err => {
        console.log(`Uncaught Exception thrown: ${err}`);
    });

const stage = new Stage([
    set_password_scene,
    set_password_scene_2,
    set_password_scene_3,
    change_password_scene,
    change_password_scene_2,
    change_password_scene_3,
    sign_in_scene,
    sign_in_scene_2,
    deal_sell_scene,
    deal_sell_scene_2,
    deal_sell_scene_3,
    deal_sell_scene_4,
    deal_sell_scene_5,
    deal_buy_scene,
    deal_buy_scene_2,
    deal_buy_scene_2_ask_address,
    deal_buy_scene_3,
    deal_buy_scene_4,
    insert_scene,
    admin_ad_change_selling_rate_fixed_scene,
    admin_ad_change_selling_rate_percent_scene,
    admin_ad_change_buying_rate_fixed_scene,
    admin_ad_change_buying_rate_percent_scene,
    admin_ad_change_sell_min_scene,
    admin_ad_change_buy_min_scene,
    admin_ad_change_buy_max_scene,
    admin_ad_change_buy_max_scene_2,
    admin_ad_change_sell_max_scene,
    admin_ad_delete_scene,
    get_exchange_byId_scene,
    give_amount_scene,
    get_user_byId_scene,
    create_cheque_scene_start,
    create_cheque_scene,
    admin_add_method_scene,
    add_requisite_scene,
    admin_change_min_insert_scene,
    admin_change_min_withdrawal_scene,
    admin_set_withdrawal_byHand_scene,
    admin_set_withdrawal_dynamic_percent_scene,
    withdrawal_scene,
    withdrawal_scene_ask_speed,
    withdrawal_scene_2,
    admin_add_balance_set_scene,
    admin_add_balance_sell_scene,
    admin_add_balance_commission_scene,
    admin_withdraw_balance_scene,
    admin_withdraw_balance_scene_2,
    admin_settings_balance_add_scene,
    admin_add_notification_scene,
    admin_settings_balance_limit_scene,
    admin_advertisement_edit_time_scene,
    admin_advertisement_bonus_add_scene,
    admin_advertisement_bonus_add_scene_2,
    admin_advertisement_bonus_add_scene_3,
    admin_add_advertisement_scene,
    admin_add_advertisement_scene_2,
    admin_add_advertisement_scene_3,
    admin_add_advertisement_scene_4,
    admin_order_cancel_scene,
    admin_bonus_all_users_scene,
    admin_bonus_all_users_scene_2,
    admin_bonus_all_users_scene_3,
    admin_bonus_all_users_scene_4,
    admin_bonus_by_countDeals_scene_start,
    admin_bonus_by_countDeals_scene,
    admin_bonus_by_countDeals_scene_2,
    admin_bonus_by_countDeals_scene_3,
    admin_bonus_by_countDeals_scene_4,
    admin_bonus_by_amountDeals_scene_start,
    admin_bonus_by_amountDeals_scene,
    admin_bonus_by_amountDeals_scene_2,
    admin_bonus_by_amountDeals_scene_3,
    admin_bonus_by_amountDeals_scene_4,
    admin_bonus_by_userId_scene_start,
    admin_bonus_by_userId_scene_bonusNo,
    admin_bonus_by_userId_scene_bonusYes,
    admin_bonus_by_userId_scene,
    admin_bonus_by_userId_scene_2,
    admin_bonus_by_userId_scene_3,
    admin_bonus_by_userId_scene_4,
    admin_vouchers_all_users_scene,
    admin_vouchers_all_users_scene_2,
    admin_vouchers_all_users_scene_3,
    admin_vouchers_by_userId_scene_start,
    admin_vouchers_by_userId_scene,
    admin_vouchers_by_userId_scene_2,
    admin_vouchers_by_userId_scene_3,
    admin_vouchers_by_countDeals_scene_start,
    admin_vouchers_by_countDeals_scene,
    admin_vouchers_by_countDeals_scene_2,
    admin_vouchers_by_countDeals_scene_3,
    admin_vouchers_by_amountDeals_scene_start,
    admin_vouchers_by_amountDeals_scene,
    admin_vouchers_by_amountDeals_scene_2,
    admin_vouchers_by_amountDeals_scene_3,
    admin_commission_set_scene,
    admin_messenger_scene,
    admin_messenger_scene_2,
    admin_messenger_scene_3
]);

stage.hears("↩️ В главное меню", async (ctx) => {
    ctx.replyWithHTML(ctx.i18n.t("main"), await main_keyboard(ctx));
    return ctx.scene.leave();
});

stage.hears(["🏦 Баланс", "📕 Купить BTC", "📘 Продать BTC", "🗃️ Мой аккаунт", "🌐 Дополнительно", "🚀 Открытые сделки"], async (ctx, next) => {
    ctx.scene.leave();

    return next();
});

stage.hears('/panel', async (ctx) => {
    const ad = await $ad.findOne({ adminChat: ctx.chat.id });
    if (ad) {
        if (!ad.active) return ctx.replyWithHTML(ctx.i18n.t("admin_method_notActive"));

        return ctx.replyWithHTML(ctx.i18n.t("admin_method_check", {
            method: ad.method,
            balance: ad.buy_balance,
            chat_link: ad.chat_link
        }), (await admin_method_check_keyboard_limit(ad)));
    }

    if (ctx.chat.id !== Number(admin_chat)) return;

    const admin = await $admin.findOne({ uid: 0 });
    if (!admin) {
        let newAdmin = new $admin({
            uid: 0,
            admins: [],
            min_insert: 0,
            min_withdrawal: 0,
            withdrawal_commission: [0,0,0],
            balance: 0,
            sell_balance: 0,
            commission_balance: 0,
            lessbalance_notifications: [],
            withdrawal_commission_satoshi: [0,0,0],
            sell_btc_commission_satoshi: [0,0,0,0]
        })

        await newAdmin.save();
    }

    ctx.replyWithHTML(ctx.i18n.t("choose_section"), admin_keyboard());
    return ctx.scene.leave();
});

bot.use(stage.middleware());


bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}: ${err}`)
})

bot.start(async(ctx) => {
    if(ctx.chat.id < 0) return;

    const checkUser = await getUser(ctx.from.id);
    if (!checkUser) {
        await ctx.replyWithSticker("CAACAgIAAxkBAAEGR_xjYWncrFCkF0XFD477l3k6BdpsDgACVAADQbVWDGq3-McIjQH6KgQ", go_to_main_keyboard());
        await ctx.replyWithHTML(ctx.i18n.t("start"));
        const registered = await saveUser(ctx);

        const advertisement = await $advertisement.findOne({ password: ctx.startPayload });
        if (advertisement) {
            await registered.set("registration_password", ctx.startPayload);

            for (const bonus of advertisement.bonus) {
                registered.bonus.push({
                    uid: bonus.uid,
                    percent: bonus.percent,
                    limit: bonus.limit,
                    finished_date: moment(bonus.finished_date).format()
                })
            }

            await registered.save();
        }
    }

    if(ctx.startPayload) {
        var text = ctx.startPayload.split("cheque-");
        if(text.length === 2) {
            const cheque = await $cheque.findOne({ password: text[1] });
            const activator = await getUser(ctx.from.id);
            const user = await getUser(cheque.ownerId);

            if (!user.banned) {
                if (user.id === activator.id) return ctx.replyWithHTML(ctx.i18n.t("your_cheque"), cheque_keyboard());
                if (cheque && cheque.active) {
                    await activator.inc("balance", cheque.amount);
                    await cheque.set("activated_by", activator.id);
                    await cheque.set("active", false);
                    await cheque.set("finished", moment().format());
                    await cheque.set("amount_in_rub", (await btc_convert(cheque.amount)).toFixed(2));
                    await cheque.set("activator_user_balance", activator.balance);
                    for (const session of user.activeSessions) {
                        await bot.telegram.sendMessage(session, ctx.i18n.t("cheque_activated", {
                            id: activator.id,
                            amount: fromExponential(cheque.amount),
                            rub: split_number(`${cheque.amount_in_rub}`)
                        }), { parse_mode: "HTML" });
                    }

                    return ctx.replyWithHTML(ctx.i18n.t("cheque_succesfull", {
                        amount: fromExponential(cheque.amount),
                        rub: split_number(`${cheque.amount_in_rub}`)
                    }), await main_keyboard(ctx));
                }
            }
        }
    }

    ctx.replyWithHTML(ctx.i18n.t("main"), await main_keyboard(ctx))
})

bot.on('text', async (ctx, next) => {
    console.log(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}]: ${ctx.from.id} --> ${ctx.message.text}`);

    const user = await $user.findOne({ id: ctx.from.id });
    if(user) {
        await user.set("last_message_date", moment().format());
    }

    if (ctx.chat.id > 0) {
        ctx.scene.leave();
    }
    return next();
})

bot.on('callback_query', (ctx, next) => {
    console.log(`[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}]: ${ctx.from.id} --> ${ctx.update.callback_query.data}`);

    ctx.scene.leave();
    
    return next();
});

require('./modules/usersCommands');
require('./modules/adminCommands');
require('./helpers/schedules');
require('./helpers/nowpayments');

bot.hears("↩️ В главное меню", async(ctx)=> {
    ctx.replyWithHTML(ctx.i18n.t("main"), await main_keyboard(ctx));
})

bot.startWebhook('/messages', null, 8443);
bot.launch();