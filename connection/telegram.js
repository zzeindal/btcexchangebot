require('dotenv').config()
const { nowpayments } = require('../helpers/utils')
const NowPaymentsApi = require('@nowpaymentsio/nowpayments-api-js');

const NPApi = new NowPaymentsApi({ apiKey: nowpayments })

const { Telegraf } = require('telegraf')
const TelegrafI18n = require('telegraf-i18n')
const LocalSession = require('telegraf-session-local')
const rateLimit = require('telegraf-ratelimit')
const sender = require('telegraf-sender')

const path = require('path')
const bot = new Telegraf(process.env.telegram_token);

const i18n = new TelegrafI18n({
    directory: path.resolve('locales'),
    defaultLanguage: 'ru',
    sessionName: 'session',
    useSession: true,
    templateData: {
        pluralize: TelegrafI18n.pluralize,
        uppercase: (value) => value.toUpperCase()
    }
});
const limitConfig = {
    window: 1000,
    limit: 2,
    onLimitExceeded: async (ctx, next) => {
        try {
            ctx.answerCbQuery(`Anti-spam`, true)
        } catch (err) { }
    }
}


bot.use((new LocalSession({ database: 'session.json' })).middleware());
bot.use(i18n.middleware());
bot.use(rateLimit(limitConfig));
bot.use(sender);

const { TelegramClient } = require("telegram");
const { StringSession, StoreSession } = require("telegram/sessions");
const input = require("input");

const apiId = Number(process.env.app_id);
const apiHash = process.env.app_hash;
const stringSession = new StringSession(process.env.string_session);

const user_client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

(async () => {
    console.log("Loading interactive example...");
    
    await user_client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    console.log(user_client.session.save());
})();

module.exports = {
    bot,
    i18n,
    NPApi,
    user_client
}