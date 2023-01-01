const { Key, Keyboard } = require("telegram-keyboard");
const { $user, $ad, $deal, $cheque, $admin, $advertisement } = require("../connection/mongoose");
const { getUser, support, split_number, btc_convert } = require("./utils");
const moment = require("moment");
const fromExponential = require('from-exponential');

function go_to_main_keyboard() {
    const keyboard = Keyboard.make([
        "↩️ В главное меню"
    ]).reply();

    return keyboard;
}

function back_keyboard(where) {
    const keyboard = Keyboard.make([
        Key.callback("🔙 Назад", where)
    ]).inline();

    return keyboard
}

/*
async function main_keyboard(ctx) {
    const user = await getUser(ctx.from.id);

    var data = [
        Key.callback("🏦 Баланс", "balance"),
        Key.callback("📕 Купить BTC", "buy"),
        Key.callback("📘 Продать BTC", "sell"),
        Key.callback("🗃️ Мой аккаунт", "profile"),
        Key.callback("🌐 Дополнительно", "more")
    ]

    const deals = await $deal.find({ 
        ownerId: user.id,

        $or: [ 
            { status: 0 }, 
            { status: 1 },
            { status: 2 }
        ]
    })

    if(deals.length !== 0) {
        data.push(Key.callback("🚀 Открытые сделки", "open_deals"))
    }

    const keyboard = Keyboard.make(data, { pattern: [1,2,2,1 ]}).inline();

    return keyboard;
}
*/

async function main_keyboard(ctx) {
    const user = await getUser(ctx.from.id);

    var data = [
        "🏦 Баланс",
        "📕 Купить BTC",
        "📘 Продать BTC",
        "🗃️ Мой аккаунт",
        "🌐 Дополнительно"
    ]

    const deals = await $deal.find({
        ownerId: user.id,

        $or: [
            { status: 0 },
            { status: 1 },
            { status: 2 }
        ]
    })

    data.push("🚀 Открытые сделки")

    /*
    if (deals.length !== 0) {
        data.push("🚀 Открытые сделки")
    }
    */
    const keyboard = Keyboard.make(data, { pattern: [1, 2, 2, 1] }).reply();

    return keyboard;
}

function more_keyboard() {
    const keyboard = Keyboard.make([
        Key.url("🛡 Тех. Поддержка", "https://t.me/BIT_Flash_admin"),
        Key.url("🗓 Наш канал", "https://t.me/Flash_ChangeNews")
        //Key.callback("🔙 Назад", "main")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function profile_keyboard(senderId, accountId) {
    const user = await $user.findOne({ id: accountId });
    var data = [];

    data.push(Key.callback("📱Активные сессии", "active_sessions"));

    if(!user.password) {
        data.push(Key.callback("🔐 Защитите аккаунт паролем!", "create_password_profile"));
    } else {
        data.push(Key.callback("📝 Изменить пароль", "change_password"))
    }

    data.push(Key.callback("🖨️ Получить отчёт", "get_my_report"));

    if(senderId === accountId) {
        data.push(Key.callback("🔄 Войти в другой аккаунт", "sign_in"))
    } else {
        data.push(Key.callback("↩️ Выйти", "sign_out"))
    }

    //data.push(Key.callback("🔙 Назад", "main"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    
    return keyboard;
}

async function balance_keyboard(ctx) {
    const user = await getUser(ctx.from.id);
    var data = [];
    data.push(Key.callback("📥 Внести", "insert"));
    data.push(Key.callback("📤 Вывести", "withdrawal"));
    data.push(Key.callback("🧾 BTC чек", "cheque"));

    if(!user.password) {
        data.push(Key.callback("🔐 Защитите аккаунт паролем!", "create_password_balance"));
    }

    //data.push(Key.callback("🔙 Назад", "main"));
    const keyboard = Keyboard.make(data, { pattern: [2,1,1,1] }).inline();

    return keyboard;
}

function insert_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("🔁 Обновить адрес", "insert"),
        Key.callback("🔙 Назад", "balance")
    ], { columns: 1 }).inline();

    return keyboard;
};

function set_password_keyboard(back) {
    const keyboard = Keyboard.make([
        Key.callback("✍️ Создать пароль", `set_password_${back}`),
        Key.callback("🔙 Назад", back)
    ], { columns: 1 }).inline();

    return keyboard;
}

function set_password_scene_generate_password(back) {
    const keyboard = Keyboard.make([
        Key.callback("Сгенерировать пароль", "generate"),
        Key.callback("🔙 Назад", back)
    ], { columns: 1 }).inline();

    return keyboard;
}

function revoke_session_keyboard(id) {
    const keyboard = Keyboard.make([
        Key.callback("📵 Сбросить сессию", `cancel_session_change_password ${id}`)
    ]).inline();

    return keyboard;
}

function change_password_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("🔄 Сменить пароль", "change_password")
    ], { columns: 1 }).inline();

    return keyboard;
}

function cancel_session_error_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("↩️ Выйти", "sign_out"),
        Key.callback("🔙 Назад", "active_sessions")
    ], { columns: 1 }).inline();

    return keyboard;
}

function cancel_session_keyboard(id) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `cancel_session_yes ${id}`),
        Key.callback("Нет", `active_sessions`)
    ]).inline();

    return keyboard;
}

function cancel_session_change_password_keyboard(id) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `cancel_session_change_password_yes ${id}`),
        Key.callback("Нет", `active_sessions`)
    ]).inline();

    return keyboard;
}

async function sessions_list_keyboard(id) {
    const user = await getUser(id);

    var data = [];
    for (const session of user.activeSessions) {
        const checking = await $user.findOne({ id: session })
        data.push(Key.callback(checking.username ? checking.username : session, `cancel_session ${session}`))
    }

    data.push(Key.callback("🔙 Назад", "profile"));
    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function sign_out_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Да", "sign_out_yes"),
        Key.callback("Нет", "profile")
    ]).inline();

    return keyboard;
}

async function get_ads_keyboard(purpose) {
    var ads;

    if(purpose === "sell") {
        ads = await $ad.find({ active: true, sell_active: true });
        ads.sort((a, b) => {
            if (a.selling_rate > b.selling_rate) {
                return -1;
            }
            if (a.selling_rate < b.selling_rate) {
                return 1;
            }
            return 0;
        });

    } else {
        ads = await $ad.find({ active: true, buy_active: true });
        ads.sort((a, b) => {
            if (a.buying_rate < b.buying_rate) {
                return -1;
            }
            if (a.buying_rate > b.buying_rate) {
                return 1;
            }
            return 0;
        });
    }


    var data = [];

    for (const ad of ads) {
        data.push(Key.callback(`${ad.method} - ${split_number(`${Number(ad[purpose + 'ing_rate']).toFixed(2)}`)}`, `check_deal ${ad.uid} ${purpose}`))
    }

    //data.push(Key.callback("🔙 Назад", "main"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();

    return keyboard;
}

async function open_deals_keyboard(user) {
    const deals = await $deal.find({ 
        ownerId: user.id,

        $or: [ 
            { status: 0 }, 
            { status: 1 },
            { status: 2 },
            { status: 5 }
        ]
    })

    var data = [];

    for (const deal of deals) {
        data.push(Key.callback(`#${deal.uid} ${deal.method === "buy" ? "Продажа" : "Покупка"} ${fromExponential(deal.amount).replace(/0*$/,"")} BTC (${deal.amount_in_rub} RUB)`, `deal_more ${deal.uid}`))
    }

    //data.push(Key.callback("🔙 Назад", "main"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function check_deal_keyboard(uid, purpose) {
    const keyboard = Keyboard.make([
        Key.callback("Начать сделку", `start_deal ${uid} ${purpose}`),
        Key.callback("🔙 Назад", purpose)
    ], { columns: 1 }).inline();

    return keyboard;
}

function deal_scene_keyboard(uid, method) {
    const keyboard = Keyboard.make([
        Key.callback("Внешний кошелек", "another"),
        Key.callback("Баланс бота", "bot"),
        Key.callback("🔙 Назад", `check_deal ${uid} ${method}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

async function deal_more_keyboard(uid) {
    const deal = await $deal.findOne({ uid: uid })
    var data = [];
    if (deal.status === 0) {
        data.push(Key.callback("Оплачено", `deal_paid_${deal.method} ${deal.uid}`));
        data.push(Key.callback("⛔ Отменить сделку", `deal_cancel ${deal.uid}`))
    }
    data.push(Key.url("🛡️ Тех. Поддержка", `https://t.me/${support}`));
    data.push(Key.callback("🔙 Назад", "open_deals"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function deal_paid_keyboard(purpose, uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `deal_ok_paid_${purpose} ${uid}`),
        Key.callback("Нет", "close_info")
    ]).inline();

    return keyboard;
}

function deal_cancel_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `deal_cancel_ok ${uid}`),
        Key.callback("Нет", "close_info")
    ]).inline();

    return keyboard;
}

function agent_support_keyboard() {
    const keyboard = Keyboard.make([
        Key.url("🛡️ Тех. Поддержка", `https://t.me/${support}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

function transfer_done_keyboard(uid, purpose) {
    const keyboard = Keyboard.make([
        Key.callback("Оплачено", `deal_paid_${purpose} ${uid}`),
        Key.callback("⛔ Отменить сделку", `deal_cancel ${uid}`),
        Key.url("🛡️ Тех. Поддержка", `https://t.me/${support}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_i_see_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Я вижу", "close_info")
    ]).inline();

    return keyboard;
}

async function cheque_keyboard(id) {
    const user = await getUser(id)
    const cheques = await $cheque.find({ ownerId: user.id, active: true });

    const keyboard = Keyboard.make([
        Key.callback("📩 Создать BTC чек", "create_cheque"),
        Key.callback(`📑 Активные чеки - ${cheques.length}`, "my_active_cheques"),
        Key.callback("🔙 Назад", "balance")
    ], { columns: 1 }).inline();

    return keyboard;
}

function create_cheque_keyboard() {
    const keyboard = Keyboard.make([
        "RUB",
        "BTC",
        Key.callback("🔙 Назад", "cheque")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function my_active_cheques_keyboard(id) {
    const user = await getUser(id);
    const cheques = await $cheque.find({ ownerId: user.id, active: true });
    var data = [];
    
    for (const cheque of cheques) {
        const rub = await btc_convert(cheque.amount);

        data.push(Key.callback(`${fromExponential(cheque.amount).replace(/0*$/, "") } BTC (${rub.toFixed(2)} RUB)`, `check_cheque ${cheque.uid}`));
        data.push(Key.callback("Удалить", `delete_cheque ${cheque.uid}`))
    }

    data.push(Key.callback("🔙 Назад", "cheque"));

    const keyboard = Keyboard.make(data, { columns: 2 }).inline();
    return keyboard;
}

function delete_cheque_request_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `delete_cheque_ok ${uid}`),
        Key.callback("Нет", "my_active_cheques")
    ]).inline();

    return keyboard;
}

function banned_keyboard() {
    const keyboard = Keyboard.make([
        Key.url("🛡️ Тех. Поддержка", `https://t.me/${support}`)
        //Key.callback("🔙 Назад", "main")
    ], { columns: 1 }).inline();

    return keyboard;
}

function withdrawal_max_keyboard(amount) {
    const keyboard = Keyboard.make([
        Key.callback(`Вывести максимум (${fromExponential(Number(amount).toFixed(8)).replace(/0*$/, "")} BTC)`, "withdrawal_max"),
        Key.callback("🔙 Назад", "back")
    ], { columns: 1 }).inline();

    return keyboard;
}

function withdrawal_scene_ask_speed_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Медленная (~1 час)", "speed 0"),
        Key.callback("Средняя (~30 минут)", "speed 1"),
        Key.callback("⚡️ Высокая (~5 минут)", "speed 2"),
        Key.callback("🔙 Назад", "back")
    ], { pattern: [2,1,1] }).inline();

    return keyboard;
}











////////////////////////////////////////////// ADMIN \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
function admin_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Баланс", "admin_balance"),
        Key.callback("Статистика", "admin_stats"),
        Key.callback("Способы оплат и лимиты", "admin_methods"),
        Key.callback("Дополнительно", "admin_more"),
        Key.callback("Скрыть", "close_info")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function admin_order_keyboard(uid) {
    const deals = await $deal.find({ ad_uid: uid });

    var data = [];
    for (const deal of deals) {
        var method_text = deal.method == "sell" ? "🔵" : "🟢";
        var date = moment(deal.created_at).format('HH:mm');
        var emoji = '';
        if (deal.status === 3) {
            emoji = "✅"
        } else if (deal.status === 4) {
            emoji = "❌"
        } else if (deal.method === "sell" && deal.status === 2) {
            emoji = "🔄"
        } else if (deal.method === "buy" && deal.status === 1) {
            emoji = "🔄"
        }

        //data.push(Key.callback(`${method_text} ${deal.amount_in_rub} RUB - ${deal.rate} - ${date} ${emoji}`, `admin_check_order ${deal.uid}`));
        data.push(`${method_text} #${deal.uid} - ${deal.amount_in_rub} - ${deal.rate} - ${date} ${emoji}`)
    }

    return data;
}

async function admin_check_order_keyboard(uid) {
    const deal = await $deal.findOne({ uid: uid });
    var keyboard;

    if (deal.method === "sell") {
        if (deal.status === 1) {
            keyboard = Keyboard.make([
                Key.callback("Подтвердить получение", `admin_order_transfer_done ${deal.uid}`),
                Key.callback("Отменить", `admin_order_cancel ${deal.uid}`),
                Key.callback("🔙 Назад", "/order")
            ], { columns: 1 }).inline();
        } else if (deal.status !== 3 && deal.status !== 4) {
            keyboard = Keyboard.make([
                Key.callback("Подтвердить", `admin_order_done ${deal.uid}`),
                Key.callback("Отменить", `admin_order_cancel ${deal.uid}`),
                Key.callback("🔙 Назад", "/order")
            ], { columns: 1 }).inline();
        }
    } else {
        if(deal.status !== 3 && deal.status !== 4) {
            keyboard = Keyboard.make([
                Key.callback("Подтвердить", `admin_order_done ${deal.uid}`),
                Key.callback("Отменить", `admin_order_cancel ${deal.uid}`),
                Key.callback("🔙 Назад", "/order")
            ], { columns: 1 }).inline();
        } else {
            keyboard = Keyboard.make([
                Key.callback("🔙 Назад", "/order")
            ], { columns: 1 }).inline();
        }
    }

    return keyboard;
}

function admin_order_done_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `admin_order_done_ok ${uid}`),
        Key.callback("Нет", `admin_check_order ${uid}`)
    ]).inline();

    return keyboard;
}


function admin_order_transfer_done_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `admin_order_transfer_done_ok ${uid}`),
        Key.callback("Нет", `admin_check_order ${uid}`)
    ]).inline();

    return keyboard;
}

function admin_order_cancel_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `admin_order_cancel_ok ${uid}`),
        Key.callback("Нет", `admin_check_order ${uid}`)
    ]).inline();

    return keyboard;
}


function admin_stats_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("По пользователям", "admin_stats_users"),
        Key.callback("По обменам", "admin_stats_exchange"),
        Key.callback("По аудитории", "admin_stats_audience"),
        Key.callback("🔙 Назад", "admin")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function admin_stats_registration_keyboard() {
    const users = await $user.find();

    var text = [];
    var data = [];

    for(const user of users) {
        var year = moment(user.registration_date).year();
        if(!text.includes(year)) {
            text.push(year);
        }
    }

    for(const elem of text) {
        data.push(Key.callback(elem, `admin_stats_registration ${elem}`))
    }

    data.push(Key.callback("🔙 Назад", "admin_stats_audience"));
    const keyboard = Keyboard.make(data, { columns: 2 }).inline();
    
    return keyboard;
}

function admin_stats_registration_byYear_keyboard(year) {
    const keyboard = Keyboard.make([
        Key.callback("Янв", `admin_stats_registration ${year} 0`),
        Key.callback("Фев", `admin_stats_registration ${year} 1`),
        Key.callback("Март", `admin_stats_registration ${year} 2`),
        Key.callback("Апр", `admin_stats_registration ${year} 3`),
        Key.callback("Май", `admin_stats_registration ${year} 4`),
        Key.callback("Июнь", `admin_stats_registration ${year} 5`),
        Key.callback("Июль", `admin_stats_registration ${year} 6`),
        Key.callback("Авг", `admin_stats_registration ${year} 7`),
        Key.callback("Сен", `admin_stats_registration ${year} 8`),
        Key.callback("Окт", `admin_stats_registration ${year} 9`),
        Key.callback("Ноя", `admin_stats_registration ${year} 10`),
        Key.callback("Дек", `admin_stats_registration ${year} 11`),
        Key.callback("🔙 Назад", `admin_stats_registration`)
    ], { columns: 4 }).inline();

    return keyboard;
}

function admin_stats_users_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Получить список всех", "get_all_users"),
        Key.callback("Поиск по id", "get_user_byId"),
        Key.callback("🔙 Назад", "admin_stats")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_stats_audience_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Статистика регистраций", "admin_stats_registration"),
        Key.callback("Настройки рекламы", "admin_advertisement"),
        Key.callback("🔙 Назад", "admin_stats")
    ], { columns: 1 }).inline();

    return keyboard;
}

function get_all_users_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("По балансу", "get_all_users_byBalance"),
        Key.callback("По сумме сделок", "get_all_users_byAmount"),
        Key.callback("По времени последней активности", "get_all_users_byOnline"),
        Key.callback("🔙 Назад", "admin_stats_users")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_get_file_all_users_keyboard(purpose) {
    const keyboard = Keyboard.make([
        Key.callback("Получить файл", `get_file_all_users ${purpose}`),
        Key.callback("🔙 Назад", "get_all_users")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_stats_exchange_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Другие даты", "admin_stats_exchange_other"),
        Key.callback("Поиск по ID заявке", "get_exchange_byId"),
        Key.callback("🔙 Назад", "admin_stats")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function admin_stats_exchange_other_keyboard() {
    const deals = await $deal.find();

    var text = [];
    var data = [];

    for(const deal of deals) {
        var year = moment(deal.created_at).year();

        if(!text.includes(year)) {
            text.push(year);
        }
    }

    for(const elem of text) {
        data.push(Key.callback(elem, `admin_stats_exchange_year ${year}`))
    }

    data.push(Key.callback("🔙 Назад", "admin_stats_exchange"));
    const keyboard = Keyboard.make(data, { columns: 2 }).inline();
    
    return keyboard;
}

async function admin_order_find_keyboard() {
    const deals = await $deal.find();

    var text = [];
    var data = [];

    for (const deal of deals) {
        var year = moment(deal.created_at).year();

        if (!text.includes(year)) {
            text.push(year);
        }
    }

    for (const elem of text) {
        data.push(Key.callback(elem, `admin_order_find_year ${year}`))
    }

    data.push(Key.callback("🔙 Назад", "/order"));
    const keyboard = Keyboard.make(data, { columns: 2 }).inline();

    return keyboard;
}

function admin_get_file_deal_byYear_keyboard(year, month, day) {
    const keyboard = Keyboard.make([
        Key.callback("Получить файл", `get_file_deals_byYear ${year} ${month} ${day}`),
        Key.callback("🔙 Назад", `admin_stats_exchange_year ${year} ${month}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_stats_exchange_byYear_keyboard(year) {
    const keyboard = Keyboard.make([
        Key.callback("Янв", `admin_stats_exchange_year ${year} 0`),
        Key.callback("Фев", `admin_stats_exchange_year ${year} 1`),
        Key.callback("Март", `admin_stats_exchange_year ${year} 2`),
        Key.callback("Апр", `admin_stats_exchange_year ${year} 3`),
        Key.callback("Май", `admin_stats_exchange_year ${year} 4`),
        Key.callback("Июнь", `admin_stats_exchange_year ${year} 5`),
        Key.callback("Июль", `admin_stats_exchange_year ${year} 6`),
        Key.callback("Авг", `admin_stats_exchange_year ${year} 7`),
        Key.callback("Сен", `admin_stats_exchange_year ${year} 8`),
        Key.callback("Окт", `admin_stats_exchange_year ${year} 9`),
        Key.callback("Ноя", `admin_stats_exchange_year ${year} 10`),
        Key.callback("Дек", `admin_stats_exchange_year ${year} 11`),
        Key.callback("🔙 Назад", "admin_stats_exchange_other")
    ], { columns: 4 }).inline();

    return keyboard;
}

function admin_order_byYear_keyboard(year) {
    const keyboard = Keyboard.make([
        Key.callback("Янв", `admin_order_find_year ${year} 0`),
        Key.callback("Фев", `admin_order_find_year ${year} 1`),
        Key.callback("Март", `admin_order_find_year ${year} 2`),
        Key.callback("Апр", `admin_order_find_year ${year} 3`),
        Key.callback("Май", `admin_order_find_year ${year} 4`),
        Key.callback("Июнь", `admin_order_find_year ${year} 5`),
        Key.callback("Июль", `admin_order_find_year ${year} 6`),
        Key.callback("Авг", `admin_order_find_year ${year} 7`),
        Key.callback("Сен", `admin_order_find_year ${year} 8`),
        Key.callback("Окт", `admin_order_find_year ${year} 9`),
        Key.callback("Ноя", `admin_order_find_year ${year} 10`),
        Key.callback("Дек", `admin_order_find_year ${year} 11`),
        Key.callback("🔙 Назад", "admin_order_find")
    ], { columns: 4 }).inline();

    return keyboard;
}

function admin_stats_exchange_year_choose_day_keyboard(year, month) {
    var data = [];

    for (var i = 1; i <= 31; i++) {
        data.push(Key.callback(i, `admin_stats_exchange_year ${year} ${month} ${i}`))
    }

    data.push(Key.callback("🔙 Назад", `admin_stats_exchange_year ${year}`));

    const keyboard = Keyboard.make(data, { columns: 5 }).inline();

    return keyboard;
}


function admin_order_year_choose_day_keyboard(year, month) {
    var data = [];

    for (var i = 1; i <= 31; i++) {
        data.push(Key.callback(i, `admin_order_find_year ${year} ${month} ${i} 0`))
    }

    data.push(Key.callback("🔙 Назад", `admin_order_find_year ${year}`));

    const keyboard = Keyboard.make(data, { columns: 5 }).inline();

    return keyboard;
}

async function admin_methods_keyboard() {
    const ads = await $ad.find({ active: true });
    var data = [];

    for(const ad of ads) {
        data.push(Key.callback(ad.method, `admin_method_check ${ad.uid}`));
    }

    data.push(Key.callback("Добавить способ", "admin_add_method"));
    data.push(Key.callback("🔙 Назад", "admin"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();

    return keyboard;
}

function admin_method_check_keyboard(ad) {
    var data = [
        Key.callback(`Реквизиты *${ad.requisites.substr(-4)}`, `admin_ad_change_requisites ${ad.uid}`),
        Key.callback(`Курс покупки ${ad.selling_rate_blockchain ? ad.selling_rate_blockchain_percent + '% ' : ' '}${ad.selling_rate}`, `admin_ad_change_selling_rate ${ad.uid}`),
        Key.callback(`Курс продажи ${ad.buying_rate_blockchain ? ad.buying_rate_blockchain_percent + '% ' : ' '}${ad.buying_rate}`, `admin_ad_change_buying_rate ${ad.uid}`),
        Key.callback(`Мин. сумма продажи - ${ad.buy_min} BTC`, `admin_ad_change_buy_min ${ad.uid}`),
        Key.callback(`Макс. сумма продажи - ${ad.buy_max === -1 ? ad.buy_balance : (ad.buy_max > ad.buy_balance ? ad.buy_balance : ad.buy_max)} BTC`, `admin_ad_change_buy_max ${ad.uid}`),
        Key.callback(`Мин. сумма покупки - ${ad.sell_min} BTC`, `admin_ad_change_sell_min ${ad.uid}`),
        Key.callback(`Макс. сумма покупки - ${ad.sell_max} BTC`, `admin_ad_change_sell_max ${ad.uid}`)
    ];

    if (ad.sell_active) {
        data.push(
            Key.callback(`Покупка вкл`, `admin_ad_sell_off ${ad.uid}`)
        )
    } else {
        data.push(
            Key.callback(`Покупка откл`, `admin_ad_sell_on ${ad.uid}`)
        )
    }

    if (ad.buy_active) {
        data.push(
            Key.callback(`Продажа вкл`, `admin_ad_buy_off ${ad.uid}`)
        )
    } else {
        data.push(
            Key.callback(`Продажа откл`, `admin_ad_buy_on ${ad.uid}`)
        )
    }

    data.push(Key.callback(`Статистика обменов`, `admin_ad_exchange_stats ${ad.uid}`));
    data.push(Key.callback(`Удалить`, `admin_ad_delete ${ad.uid}`));
    data.push(Key.callback("🔙 Назад", "admin_methods"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function admin_method_check_keyboard_limit(ad) {
    var data = [
        Key.callback(`Реквизиты *${ad.requisites.substr(-4)}`, `admin_ad_change_requisites ${ad.uid}`),
        Key.callback(`Курс покупки ${ad.selling_rate_blockchain ? ad.selling_rate_blockchain_percent + '% ' : ' '}${ad.selling_rate}`, `admin_ad_change_selling_rate ${ad.uid}`),
        Key.callback(`Курс продажи ${ad.buying_rate_blockchain ? ad.buying_rate_blockchain_percent + '% ' : ' '}${ad.buying_rate}`, `admin_ad_change_buying_rate ${ad.uid}`),
        Key.callback(`Мин. сумма продажи - ${ad.buy_min} BTC`, `admin_ad_change_buy_min ${ad.uid}`),
        Key.callback(`Макс. сумма продажи - ${ad.buy_max === -1 ? ad.buy_balance : (ad.buy_max > ad.buy_balance ? ad.buy_balance: ad.buy_max)} BTC`, `admin_ad_change_buy_max ${ad.uid}`),
        Key.callback(`Мин. сумма покупки - ${ad.sell_min} BTC`, `admin_ad_change_sell_min ${ad.uid}`),
        Key.callback(`Макс. сумма покупки - ${ad.sell_max} BTC`, `admin_ad_change_sell_max ${ad.uid}`)
    ];

    if (ad.sell_active) {
        data.push(
            Key.callback(`Покупка вкл`, `admin_ad_sell_off ${ad.uid}`)
        )
    } else {
        data.push(
            Key.callback(`Покупка откл`, `admin_ad_sell_on ${ad.uid}`)
        )
    }

    if (ad.buy_active) {
        data.push(
            Key.callback(`Продажа вкл`, `admin_ad_buy_off ${ad.uid}`)
        )
    } else {
        data.push(
            Key.callback(`Продажа откл`, `admin_ad_buy_on ${ad.uid}`)
        )
    }

    data.push(Key.callback(`Статистика обменов`, `admin_ad_exchange_stats ${ad.uid}`));
    data.push(Key.callback("Скрыть", "close_info"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function requisites_keyboard(ad) {
    var data = [];

    for(var i = 0;i<ad.requisites_archive.length;i++) {
        data.push(Key.callback(`${ad.requisites_archive[i]} (${ad.requisites === ad.requisites_archive[i] ? 'актив' : 'архив'})`, `choose_requisite ${ad.uid} ${i}`))
    }

    data.push(Key.callback("Добавить реквизиты", `add_requisite ${ad.uid}`));
    data.push(Key.callback("🔙 Назад", `admin_method_check ${ad.uid}`));
    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    
    return keyboard;
}

async function choose_requisite_keyboard(uid, i) {
    const ad = await $ad.findOne({ uid: uid });
    var data = [];

    if(ad.requisites === ad.requisites_archive[i]) {
        data.push(Key.callback("Актив", `edit_requisite_off ${uid} ${i}`))
    } else {
        data.push(Key.callback("Архив", `edit_requisite_on ${uid} ${i}`))
        data.push(Key.callback("Удалить", `delete_requisite ${uid} ${i}`))
    }
    data.push(Key.callback("🔙 Назад", `admin_ad_change_requisites ${ad.uid}`));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function rate_keyboard(purpose, uid) {
    const keyboard = Keyboard.make([
        Key.callback("Процентный", `admin_ad_change_${purpose}_percent ${uid}`),
        Key.callback("Фиксированный", `admin_ad_change_${purpose}_fixed ${uid}`),
        Key.callback("🔙 Назад", `admin_method_check ${uid}`)
    ], { columns: 2 }).inline();

    return keyboard;
}

function yes_no_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Да", "yes"),
        Key.callback("Нет", "no")
    ]).inline();

    return keyboard;
}

function max_hand_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Макс. баланс", "max"),
        Key.callback("Вручную", "hand"),
        Key.callback("🔙 Назад", `admin_method_check ${uid}`)
    ], { columns: 2 }).inline();

    return keyboard;
}

async function get_user_keyboard(id, back) {
    const user = await $user.findOne({ id: id });

    var data = [
        Key.callback("Пополнить баланс", `give_amount ${id}`),
        Key.callback("Получить финансовый отчёт", `get_finance ${id}`),
        Key.callback("Управление сессиями", `admin_user_sessions ${id}`)
    ];

    if(user.banned) {
        data.push(Key.callback("Разбанить", `admin_unblock ${id}`))
    } else {
        data.push(Key.callback("Забанить", `admin_block ${id}`))        
    }

    data.push(Key.callback("Назад", back))
    const keyboard = Keyboard.make(data, { columns: 1 }).inline();

    return keyboard;
}

async function admin_user_sessions_keyboard(id) {
    const user = await $user.findOne({ id: id });
    var data = [];
    for(const session of user.activeSessions) {
        data.push(Key.callback(session, `admin_cancel_session ${id} ${session}`))
    }

    data.push(Key.callback("🔙 Назад", `get_user_byId ${id}`));
    const keyboard = Keyboard.make(data, { columns: 1 }).inline();

    return keyboard;
}

async function admin_more_keyboard() {
    const admin = await $admin.findOne({ uid: 0 });
    const keyboard = Keyboard.make([
        Key.callback(`Мин. сумма пополнения - ${admin.min_insert} BTC`, `admin_change_min_insert`),
        Key.callback(`Мин. сумма вывода - ${admin.min_withdrawal} BTC`, `admin_change_min_withdrawal`),
        Key.callback(`Комиссия за вывод`, "admin_withdrawal_commission"),
        Key.callback("Ваучеры", "admin_vouchers"),
        Key.callback("Бонусы", "admin_bonuses"),
        Key.callback("Комиссии сети", "admin_commission_network"),
        Key.callback("Рассылка", "admin_messenger"),
        Key.callback("🔙 Назад", `admin`)
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_withdrawal_commission_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Медленная", "admin_set_withdrawal_byHand 0"),
        Key.callback("Средняя", "admin_set_withdrawal_byHand 1"),
        Key.callback("Высокая", "admin_set_withdrawal_byHand 2"),
        Key.callback("🔙 Назад", `admin_more`)
    ], { pattern: [2,1,1] }).inline();

    return keyboard;
}

function admin_get_ad_exchange_stats_keyboard(uid, year) {
    const keyboard = Keyboard.make([
        Key.callback("Получить файл", `get_file_ad_exchange_stats ${uid} ${year}`),
        Key.callback("🔙 Назад", `admin_ad_exchange_stats_year ${uid} ${year}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_balance_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Пополнить осн. баланс", "admin_add_balance"),
        Key.callback("Вывести с осн. баланса", "admin_withdraw_balance"),
        Key.callback("Настройки балансов способов оплат", "admin_settings_balance"),
        Key.callback("Уведомления", "admin_notifications_balance"),
        Key.callback("🔙 Назад", "admin")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_add_balance_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Указать сумму пополнения", "admin_add_balance_set"),
        Key.callback("Пополнить с комиссионого баланса", "admin_add_balance_commission"),
        Key.callback("Пополнить с баланса продаж", "admin_add_balance_sell"),
        Key.callback("🔙 Назад", "admin_balance")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function admin_add_balance_sell_keyboard() {
    const ads = await $ad.find({ active: true, buy_active: true });
    var data = [];

    for(const ad of ads) {
        data.push(Key.callback(`${ad.method} - ${ad.buy_balance} BTC`, `admin_add_balance_sell ${ad.uid}`))
    }

    data.push(Key.callback("🔙 Назад", "admin_add_balance"))
    const keyboard = Keyboard.make(data, { columns: 1 }).inline();

    return keyboard;
}

async function admin_settings_balance_keyboard() {
    const ads = await $ad.find({ active: true });
    var data = [];

    for(const ad of ads) {
        data.push(Key.callback(`${ad.method} - ${ad.buy_balance} BTC`, `admin_settings_balance ${ad.uid}`))
    }

    data.push(Key.callback("🔙 Назад", "admin_balance"))
    const keyboard = Keyboard.make(data, { columns: 1 }).inline();

    return keyboard;
}

function admin_settings_balance_byId_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Пополнить", `admin_settings_balance_add ${uid}`),
        Key.callback("Обнулить баланс", `admin_settings_balance_remove ${uid}`),
        Key.callback("Лимит ухода в минус", `admin_settings_balance_limit ${uid}`),
        Key.callback("🔙 Назад", "admin_settings_balance")
    ], { pattern: [2,1,1] }).inline();

    return keyboard;
}

function admin_settings_balance_remove_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `admin_settings_balance_remove_done ${uid}`),
        Key.callback("Нет", `admin_settings_balance ${uid}`),
        Key.callback("🔙 Назад", `admin_settings_balance ${uid}`)
    ], { columns: 2 }).inline();

    return keyboard;
}

function admin_lessbalance_notifications_have_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Удалить", "admin_delete_notification"),
        Key.callback("🔙 Назад", "admin_balance")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_lessbalance_notifications_no_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Добавить", "admin_add_notification"),
        Key.callback("🔙 Назад", "admin_balance")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_settings_balance_limit_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Удалить", `admin_settings_balance_limit_remove ${uid}`),
        Key.callback("Назад", `admin_settings_balance ${uid}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

async function admin_advertisement_keyboard() {
    const ads = await $advertisement.find({ active: true });

    var data = [];

    for (const ad of ads) {
        data.push(Key.callback(ad.name, `admin_check_advertisement ${ad.uid}`));
    }

    data.push(Key.callback("Добавить ресурс", "admin_add_advertisement"));
    data.push(Key.callback("🔙 Назад", "admin_stats_audience"));

    const keyboard = Keyboard.make(data, { columns: 1 }).inline();
    return keyboard;
}

function admin_check_advertisement_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Изменить дату выхода рекламы", `admin_advertisement_edit_time ${uid}`),
        Key.callback("Бонус", `admin_advertisement_bonus ${uid}`),
        Key.callback("Статистика", `admin_advertisement_stats ${uid}`),
        Key.callback("Удалить", `admin_advertisement_delete ${uid}`),
        Key.callback("🔙 Назад", "admin_advertisement")
    ], { columns: 1 }).inline();

    return keyboard;
}

async function admin_advertisement_bonus_keyboard(uid) {
    const ad = await $advertisement.findOne({ uid: uid });

    var keyboard;

    if (ad.bonus.length !== 0) {
        keyboard = Keyboard.make([
            Key.callback("Удалить бонус", `admin_advertisement_bonus_delete ${uid}`),
            Key.callback("🔙 Назад", `admin_check_advertisement ${uid}`)
        ], { columns: 1 }).inline();
    } else {
        keyboard = Keyboard.make([
            Key.callback("Добавить бонус", `admin_advertisement_bonus_add ${uid}`),
            Key.callback("🔙 Назад", `admin_check_advertisement ${uid}`)
        ], { columns: 1 }).inline();
    }

    return keyboard;
}

function admin_add_advertisement_scene_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Все верно!", "ok"),
        Key.callback("Начать заново", "cancel"),
        Key.callback("🔙 Назад", "back")
    ], { columns: 2 }).inline();

    return keyboard;
}

function admin_bonus_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("По всем пользователям", "admin_bonus_all_users"),
        Key.callback("По Bot user_id", "admin_bonus_by_userId"),
        Key.callback("По количеству сделок", "admin_bonus_by_countDeals"),
        Key.callback("По сумме сделок", "admin_bonus_by_amountDeals"),
        Key.callback("🔙 Назад", "admin_more")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_bonus_delete_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Удалить бонус", `admin_delete_bonus ${uid}`)
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_bonus_by_userId_scene_bonusYes_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Удалить бонус", "delete"),
        Key.callback("🔙 Назад", "back")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_delete_bonus_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `admin_delete_bonus_ok ${uid}`),
        Key.callback("Нет", "close_info")
    ]).inline();

    return keyboard;
}

function admin_vouchers_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("По всем пользователям", "admin_vouchers_all_users"),
        Key.callback("По Bot user_id", "admin_vouchers_by_userId"),
        Key.callback("По количеству сделок", "admin_vouchers_by_countDeals"),
        Key.callback("По сумме сделок", "admin_vouchers_by_amountDeals"),
        Key.callback("🔙 Назад", "admin_more")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_voucher_delete_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Удалить ваучер", `admin_delete_voucher ${uid}`)
    ], { columns: 1 }).inline();

    return keyboard;
}


function admin_delete_voucher_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Да", `admin_delete_voucher_ok ${uid}`),
        Key.callback("Нет", "close_info")
    ]).inline();

    return keyboard;
}

function admin_commission_network_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Комиссия за вывод", "admin_commission_withdrawal"),
        Key.callback("Комиссия при продаже", "admin_commission_sell"),
        Key.callback("🔙 Назад", "admin_more")
    ], { columns: 1 }).inline();

    return keyboard;
}

function admin_ad_exchange_24hours_keyboard(uid) {
    const keyboard = Keyboard.make([
        Key.callback("Другие даты", `admin_ad_exchange_stats_go ${uid}`),
        Key.callback("🔙 Назад", `admin_method_check ${uid}`)
    ], { columns: 1 }).inline();

    return keyboard;

}
async function admin_ad_exchange_stats_keyboard(uid) {
    const deals = await $deal.find({ ad_uid: uid });

    var text = [];
    var data = [];

    for (const deal of deals) {
        var year = moment(deal.created_at).year();

        if (!text.includes(year)) {
            text.push(year);
        }
    }

    for (const elem of text) {
        data.push(Key.callback(elem, `admin_ad_exchange_stats_year ${uid} ${year}`))
    }

    data.push(Key.callback("🔙 Назад", `admin_ad_exchange_stats ${uid}`));
    const keyboard = Keyboard.make(data, { columns: 2 }).inline();

    return keyboard;
}

function admin_ad_exchange_stats_byYear_keyboard(uid, year) {
    const keyboard = Keyboard.make([
        Key.callback("Янв", `admin_ad_exchange_stats_year ${uid} ${year} 0`),
        Key.callback("Фев", `admin_ad_exchange_stats_year ${uid} ${year} 1`),
        Key.callback("Март", `admin_ad_exchange_stats_year ${uid} ${year} 2`),
        Key.callback("Апр", `admin_ad_exchange_stats_year ${uid} ${year} 3`),
        Key.callback("Май", `admin_ad_exchange_stats_year ${uid} ${year} 4`),
        Key.callback("Июнь", `admin_ad_exchange_stats_year ${uid} ${year} 5`),
        Key.callback("Июль", `admin_ad_exchange_stats_year ${uid} ${year} 6`),
        Key.callback("Авг", `admin_ad_exchange_stats_year ${uid} ${year} 7`),
        Key.callback("Сен", `admin_ad_exchange_stats_year ${uid} ${year} 8`),
        Key.callback("Окт", `admin_ad_exchange_stats_year ${uid} ${year} 9`),
        Key.callback("Ноя", `admin_ad_exchange_stats_year ${uid} ${year} 10`),
        Key.callback("Дек", `admin_ad_exchange_stats_year ${uid} ${year} 11`),
        Key.callback("🔙 Назад", `admin_ad_exchange_stats_go ${uid}`)
    ], { columns: 4 }).inline();

    return keyboard;
}

function admin_commission_withdrawal_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("Медленная", `admin_commission_withdrawal 0`),
        Key.callback("Средняя", `admin_commission_withdrawal 1`),
        Key.callback("Высокая", `admin_commission_withdrawal 2`),
        Key.callback("🔙 Назад", "admin_commission_network")
    ], { pattern: [2,1,1] }).inline();

    return keyboard;
}

function admin_commission_sell_keyboard() {
    const keyboard = Keyboard.make([
        Key.callback("От 0 до 2000₽", `admin_commission_sell 0`),
        Key.callback("От 2000₽ до 5000₽", `admin_commission_sell 1`),
        Key.callback("От 5000₽ до 20000₽", `admin_commission_sell 2`),
        Key.callback("Более 20000₽", `admin_commission_sell 3`),
        Key.callback("🔙 Назад", "admin_commission_network")
    ], { columns: 1 }).inline();

    return keyboard;
}
module.exports = {
    go_to_main_keyboard,
    back_keyboard,
    main_keyboard,
    more_keyboard,
    balance_keyboard,
    profile_keyboard,
    insert_keyboard,
    banned_keyboard,
    set_password_keyboard,
    set_password_scene_generate_password,
    revoke_session_keyboard,
    change_password_keyboard,
    cancel_session_keyboard,
    cancel_session_change_password_keyboard,
    cancel_session_error_keyboard,
    sessions_list_keyboard,
    sign_out_keyboard,
    get_ads_keyboard,
    check_deal_keyboard,
    open_deals_keyboard,
    deal_more_keyboard,
    deal_scene_keyboard,
    cheque_keyboard,
    create_cheque_keyboard,
    my_active_cheques_keyboard,
    delete_cheque_request_keyboard,
    agent_support_keyboard,
    transfer_done_keyboard,
    withdrawal_max_keyboard,
    admin_i_see_keyboard,
    admin_keyboard,
    requisites_keyboard,
    choose_requisite_keyboard,
    deal_paid_keyboard,
    deal_cancel_keyboard,
    admin_check_order_keyboard,
    admin_stats_keyboard,
    admin_stats_users_keyboard,
    admin_stats_exchange_keyboard,
    admin_stats_audience_keyboard,
    admin_stats_registration_keyboard,
    admin_stats_registration_byYear_keyboard,
    get_all_users_keyboard,
    admin_get_file_all_users_keyboard,
    admin_stats_exchange_other_keyboard,
    admin_stats_exchange_byYear_keyboard,
    admin_get_file_deal_byYear_keyboard,
    admin_methods_keyboard,
    admin_method_check_keyboard,
    admin_method_check_keyboard_limit,
    rate_keyboard,
    yes_no_keyboard,
    max_hand_keyboard,
    get_user_keyboard,
    withdrawal_scene_ask_speed_keyboard,
    admin_order_keyboard,
    admin_order_transfer_done_keyboard,
    admin_order_done_keyboard,
    admin_order_find_keyboard,
    admin_order_byYear_keyboard,
    admin_order_year_choose_day_keyboard,
    admin_order_cancel_keyboard,
    admin_user_sessions_keyboard,
    admin_more_keyboard,
    admin_withdrawal_commission_keyboard,
    admin_get_ad_exchange_stats_keyboard,
    admin_balance_keyboard,
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
    admin_add_advertisement_scene_keyboard,
    admin_bonus_keyboard,
    admin_bonus_delete_keyboard,
    admin_bonus_by_userId_scene_bonusYes_keyboard,
    admin_delete_bonus_keyboard,
    admin_vouchers_keyboard,
    admin_voucher_delete_keyboard,
    admin_delete_voucher_keyboard,
    admin_commission_network_keyboard,
    admin_ad_exchange_stats_keyboard,
    admin_ad_exchange_stats_byYear_keyboard,
    admin_stats_exchange_year_choose_day_keyboard,
    admin_ad_exchange_24hours_keyboard,
    admin_commission_withdrawal_keyboard,
    admin_commission_sell_keyboard
}