const { BaseScene } = require("telegraf");
const { $ad, $admin, $user } = require("../connection/mongoose");
const { user_client, bot } = require("../connection/telegram");
const { back_keyboard, yes_no_keyboard } = require("../helpers/keyboards");
const { saveAd, create_channel, botUsername, admin_chat, support } = require("../helpers/utils");
const { Api } = require("telegram");

const admin_add_method_scene = new BaseScene('admin_add_method_scene');
admin_add_method_scene.enter(async(ctx) => {
    await ctx.editMessageText(ctx.i18n.t("admin_add_method_scene"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_methods").reply_markup
    });
});

admin_add_method_scene.on('text', async(ctx) => {
    ctx.session.name = ctx.message.text;
    ctx.replyWithHTML(ctx.i18n.t("admin_add_method_scene_request"), yes_no_keyboard());
});

admin_add_method_scene.action('no', (ctx) => {
    return ctx.scene.enter("admin_add_method_scene")
});

admin_add_method_scene.action('yes', async(ctx) => {
    const count = await saveAd(ctx.session.name);
    const ad = await $ad.findOne({ uid: count });
    
    const result = await user_client.invoke(
        new Api.channels.CreateChannel({
          title: ctx.session.name,
          about: "BTC exchange",
          megagroup: true
        })
    );
    
    await ad.set("adminChat", `-100${result.chats[0].id}`);

    await user_client.invoke(
        new Api.channels.InviteToChannel({
            channel: `-100${result.chats[0].id}`,
            users: [botUsername, support]
        })
    );

    await user_client.invoke(
        new Api.channels.EditAdmin({
            channel: `-100${result.chats[0].id}`,
            userId: botUsername,
            adminRights: new Api.ChatAdminRights({
                changeInfo: true,
                postMessages: true,
                editMessages: true,
                deleteMessages: true,
                banUsers: true,
                inviteUsers: true,
                pinMessages: true,
                addAdmins: true,
                anonymous: true,
                manageCall: true,
                other: true,
            }),
            rank: "я тут батя",
        })
    );

    await user_client.invoke(
        new Api.channels.EditAdmin({
            channel: `-100${result.chats[0].id}`,
            userId: support,
            adminRights: new Api.ChatAdminRights({
                changeInfo: true,
                postMessages: true,
                editMessages: true,
                deleteMessages: true,
                banUsers: true,
                inviteUsers: true,
                pinMessages: true,
                addAdmins: true,
                anonymous: false,
                manageCall: true,
                other: true,
            }),
            rank: "Owner",
        })
    );

    await user_client.invoke(
        new Api.channels.LeaveChannel({
            channel: `-100${result.chats[0].id}`,
        })
    );

    const chatLink = await bot.telegram.exportChatInviteLink(ad.adminChat);
    await bot.telegram.sendMessage(admin_chat, `Ссылка на приглашению в группу ${ad.method}: ${chatLink}`);
    await ad.set("chat_link", chatLink);

    await ctx.editMessageText(ctx.i18n.t("admin_add_method_scene_done"), {
        parse_mode: "HTML",
        reply_markup: back_keyboard("admin_methods").reply_markup
    });

    return ctx.scene.leave();
});

module.exports = {
    admin_add_method_scene
}