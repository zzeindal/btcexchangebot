const { BaseScene } = require('telegraf');
const { back_keyboard, admin_keyboard } = require('../helpers/keyboards');
const Queue = require('bull');
const { $user } = require('../connection/mongoose');
const { Key, Keyboard } = require("telegram-keyboard");
const { bot } = require('../connection/telegram');
const messengerQueue = new Queue('messenger');
const cancel_keyboard = Keyboard.make([
    Key.callback("Отменить рассылку", "admin_messenger_cancel")
]).inline();


bot.action("admin_messenger_cancel", async (ctx) => {
    await messengerQueue.obliterate({ force: true });
    return ctx.answerCbQuery("Готово!", true);
});

messengerQueue.process(async function (job, done) {

    const users = await $user.find();

    var count = 0;

    for (var i = 0; i < users.length; i++) {
        try {
            await bot.telegram.sendPhoto(users[i].id, job.data.photo, { caption: job.data.text, parse_mode: 'HTML', reply_markup: job.data.reply_markup })
            count++;
        } catch (err) {
            try {
                await bot.telegram.sendVideo(users[i].id, job.data.video, { caption: job.data.text, parse_mode: 'HTML', reply_markup: job.data.reply_markup })
                count++;
            } catch (err) {
                try {
                    await bot.telegram.sendAnimation(users[i].id, job.data.gif, { caption: job.data.text, parse_mode: 'HTML', reply_markup: job.data.reply_markup })
                    count++;
                } catch (err) {
                    try {
                        await bot.telegram.sendMessage(users[i].id, job.data.text, { parse_mode: 'HTML', reply_markup: job.data.reply_markup })
                        count++;
                    } catch (err) {
                        try {
                            await bot.telegram.sendMessage(users[i].id, job.data.text, { parse_mode: 'HTML' })
                            count++;
                        } catch (err) {
                            continue;
                        }
                    }
                }
            }
        }

        await bot.telegram.editMessageText(job.data.chat_id, job.data.message_id, job.data.message_id, `<b>Задача отправлена․</b>\n\n${count}/${users.length}`, {
            parse_mode: "HTML",
            reply_markup: cancel_keyboard.reply_markup
        });
    }

    await bot.telegram.sendMessage(job.data.chat_id, `Рассылка закончена.\n\nДоставлено: ${count}\nНе доставлено: ${users.length - count}`)

    done();
});

const admin_messenger_scene = new BaseScene('admin_messenger_scene');
admin_messenger_scene.enter((ctx) => {
    ctx.session.photo = '';
    ctx.session.video = '';
    ctx.session.gif = '';
    ctx.session.keyboard = '';
    ctx.session.arrayName = [];
    ctx.session.arrayLinks = [];

    ctx.replyWithMarkdown(`Укажите текст рассылки․`, back_keyboard("admin_more"));
})

admin_messenger_scene.on('text', async (ctx) => {
    ctx.session.text = ctx.message.text;
    return ctx.scene.enter("admin_messenger_scene_2")
});

const admin_messenger_scene_2 = new BaseScene('admin_messenger_scene_2');
admin_messenger_scene_2.enter((ctx) => {
    const keyboard = Keyboard.make(['Отсутствует', Key.callback("back")], { columns: 1 }).inline();
    ctx.replyWithMarkdown(`Отправьте мне какое-то вложение․ Если его нет, нажмите на кнопку ниже։`, keyboard);
})

admin_messenger_scene_2.action('back', async (ctx) => {
    return ctx.scene.enter("admin_messenger_scene")
});

admin_messenger_scene_2.action('Отсутствует', async (ctx) => {
    ctx.session.file = false;
    return ctx.scene.enter("admin_messenger_scene_3")
});

admin_messenger_scene_2.on('photo', async (ctx) => {
    ctx.session.photo = ctx.update.message.photo[0].file_id;
    return ctx.scene.enter("admin_messenger_scene_3")
});

admin_messenger_scene_2.on('video', async (ctx) => {
    ctx.session.video = ctx.update.message.video.file_id;
    return ctx.scene.enter("admin_messenger_scene_3")
});

admin_messenger_scene_2.on('animation', async (ctx) => {
    ctx.session.gif = ctx.update.message.animation.file_id
    return ctx.scene.enter("admin_messenger_scene_3")
});

const admin_messenger_scene_3 = new BaseScene('admin_messenger_scene_3');
admin_messenger_scene_3.enter((ctx) => {
    const keyboard = Keyboard.make(['Отсутствует']).inline();
    ctx.session.arrayName = [];
    ctx.session.arrayLinks = [];
    ctx.replyWithMarkdown(`Отправьте кнопку в таком формате։ \n\nИмяКнопки-ссылка`, keyboard);
})

admin_messenger_scene_3.action('Отсутствует', async (ctx) => {
    var array = [];
    array.push(Key.callback('Запустить рассылку', 'startMessenger'))
    array.push(Key.callback('Отменить', 'admin_more'))
    const keyboard = Keyboard.make(array, { columns: 1 }).inline();

    var chat_id = ctx.chat.id;
    ctx.session.chat_id = chat_id;
    try {
        await bot.telegram.sendPhoto(chat_id, ctx.session.photo, { caption: ctx.session.text, parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
    } catch (err) {
        try {
            await bot.telegram.sendVideo(chat_id, ctx.session.video, { caption: ctx.session.text, parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
        } catch (err) {
            try {
                await bot.telegram.sendAnimation(chat_id, ctx.session.gif, { caption: ctx.session.text, parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
            } catch (err) {
                try {
                    await bot.telegram.sendMessage(chat_id, ctx.session.text, { parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
                } catch (err) {
                    try {
                        await bot.telegram.sendMessage(chat_id, ctx.session.text, { parse_mode: 'HTML' })
                    } catch (err) {
                        return ctx.replyWithMarkdown(`Проверьте *HTML* текст․`)
                    }
                }
            }
        }
    }
});

admin_messenger_scene_3.hears(/(.+)-(.+)$/i, async (ctx) => {
    ctx.session.arrayName.push(ctx.match[1]);
    ctx.session.arrayLinks.push(ctx.match[2]);
    const keyboard = Keyboard.make([Key.callback('Хватит', 'finish')]).inline();
    return ctx.replyWithMarkdown(`Вы можете добавить ещё кнопки ։D`, keyboard);
});

admin_messenger_scene_3.action('finish', async (ctx) => {
    var array = [];
    for (var i = ctx.session.arrayName.length - 1; i >= 0; i--) {
        array.push(Key.url(ctx.session.arrayName[i], ctx.session.arrayLinks[i]));
    }
    var chat_id = ctx.chat.id;
    ctx.session.chat_id = chat_id;

    ctx.session.keyboard = Keyboard.make(array, { columns: 1 }).inline();
    array.push(Key.callback('Запустить рассылку', 'startMessenger'))
    array.push(Key.callback('Отменить', 'admin_more'))
    const keyboard = Keyboard.make(array, { columns: 1 }).inline();
    try {
        await bot.telegram.sendPhoto(chat_id, ctx.session.photo, { caption: ctx.session.text, parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
    } catch (err) {
        try {
            await bot.telegram.sendVideo(chat_id, ctx.session.video, { caption: ctx.session.text, parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
        } catch (err) {
            try {
                await bot.telegram.sendAnimation(chat_id, ctx.session.gif, { caption: ctx.session.text, parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
            } catch (err) {
                try {
                    await bot.telegram.sendMessage(chat_id, ctx.session.text, { parse_mode: 'HTML', reply_markup: keyboard.reply_markup })
                } catch (err) {
                    await bot.telegram.sendMessage(chat_id, ctx.session.text, { parse_mode: 'HTML' })
                }
            }
        }
    }
});

admin_messenger_scene_3.action('startMessenger', async (ctx) => {
    const users = await $user.find();

    const result = await bot.telegram.sendMessage(ctx.session.chat_id, `<b>Задача отправлена․</b>\n\n0/${users.length}`, {
        parse_mode: "HTML",
        reply_markup: cancel_keyboard.reply_markup
    })

    if (ctx.session.keyboard && ctx.session.keyboard.reply_markup) {
        messengerQueue.add({ message_id: result.message_id, chat_id: ctx.session.chat_id, owner: ctx.from.id, text: ctx.session.text, photo: ctx.session.photo, video: ctx.session.video, gif: ctx.session.gif, reply_markup: ctx.session.keyboard.reply_markup })
    } else {
        messengerQueue.add({ message_id: result.message_id, chat_id: ctx.session.chat_id, owner: ctx.from.id, text: ctx.session.text, photo: ctx.session.photo, video: ctx.session.video, gif: ctx.session.gif })
    }

    ctx.session.photo = '';
    ctx.session.video = '';
    ctx.session.gif = '';
    ctx.session.keyboard = '';
    ctx.session.arrayName = [];
    ctx.session.arrayLinks = [];
    return ctx.scene.leave();
});


module.exports = {
    admin_messenger_scene,
    admin_messenger_scene_2,
    admin_messenger_scene_3
}