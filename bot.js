
const { Discord, Merchant, DiscordUser } = require("../../db");

// discord stuff
const { Client, MessageEmbed, Intents, MessageActionRow, MessageButton } = require('discord.js');
const dotenv = require("dotenv")
var bot;
const setupDiscord = () => {
    // Create a new client instance
    bot = new Client({ intents: [Intents.FLAGS.GUILDS] });
    const button = require('discord.js-buttons')(bot);
    // When the client is ready, run this code (only once)
    bot.once('ready', () => {
        console.log(`Logged in as ${bot.user.tag}.`);
    });

    // Login to Discord with your client's token
    // console.log(process.env.DISCORD_TOKEN)
    bot.login("<>BOT Token<>");


    bot.on('message', async message => {
        // Check for command
        if (message.content.startsWith("!")) {
            let args = message.content.split('!');
            let command = args[1].toLowerCase();
            switch (command) {
                /* Unless you know what you're doing, don't change this command. */
                case 'verify':
                    console.log("verify")
                    verifyUser(message);
                    break;
                case 'setup':
                    console.log("setup")
                    setupMerchantWagsi(message);

                    break;
            }
        }
    });



    const setupMerchantWagsi = (message) => {
        // now vatsa will fetch all roles and ask which plans merchant wants to associate with plan ( role <=> planId)
        if (!message.member.hasPermission('ADMINISTRATOR')) {

            message.author.send("Uh Uh Uh! You don't have permission to do that!")
        }
        else {
            let disBut = new button.MessageButton()
                .setStyle('url') //default: blurple
                .setLabel('Setup') //default: NO_LABEL_PROVIDED
                .setID('click_to_function') //note: if you use the style "url" you must provide url using .setURL('https://example.com')
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=934368664025727046&redirect_uri=https%3A%2F%2Fmerchant.wagsi.co%2Fdashboard%2Fdiscord&response_type=code&scope=identify%20guilds`) //note: if you use other style you must provide id using .setID('myid')

            message.author.send(`Setup Your WAGSI Bot for subscriptions`, disBut)
        }



    }

    const verifyUser = async (message) => {
        // take guild id and find uuid to pass to the user waha se oh yeah sab ho jayhega
        let guildId = message.guild.id;
        console.log("guildId", guildId)
        let discordData = await Discord.findOne({ guildId: guildId });
        // fetch name from wallet id 
        let merchantAddress = discordData.wallet_id;
        // console.log("merchantAddress", merchantAddress)

        let merchant = await Merchant.findOne({ wallet_id: merchantAddress });
        // console.log("merchant", merchant)
        // message.author.send(` `)
        let disBut = new button.MessageButton()
            .setStyle('url') //default: blurple
            .setLabel('Verify Me!') //default: NO_LABEL_PROVIDED
            .setID('click_to_function') //note: if you use the style "url" you must provide url using .setURL('https://example.com')
            .setURL(`https://app.wagsi.co/discord-relay/${guildId}/${merchantAddress}`)

        message.author.send(`Verify Your Subscription for ${merchant.name} by clicking on Button`, disBut)

    }



};

//TODO: check if bot exists or not inside guild

const addRole = async (userId, roleId, guildId, planId, address) => {

    const guild = bot.guilds.cache.get(guildId);
    const role = guild.roles.cache.get(roleId);
    const roleName = role.name;
    console.log("role", roleName)
    const member = await guild.members.fetch(userId);
    member.roles.add(role);
    console.log("updating discord user....")
    try {
        // let user = await Merchant.create(data);
        data = {
            "userId": userId,
            "roleId": roleId,
            "guildId": guildId,
            "planId": planId,
            "address": address
        }
        let user = await DiscordUser.findOneAndUpdate({ userId: userId }, data, {
            new: true,
            upsert: true // Make this update into an upsert
        })

        if(user){
            return roleName;
        }

    } catch (err) {
        console.log(" BOT : addRole :" + err)
    }


}

const removeRole = async (userId, roleId, guildId) => {
    const guild = bot.guilds.cache.get(guildId);
    console.log("guild", guild)
    if (guild != undefined) {
        const role = guild.roles.cache.get(roleId);
        const member = await guild.members.fetch(userId);
        member.roles.remove(role);
        // removing user from db 
        DiscordUser.findOneAndDelete({ userId: userId, guildId: guildId }).then(async (user) => {
            console.log("discord user removed", userId, "from guild", guildId);

        })
    }

}
// exports.setupDiscord = setupDiscord;

module.exports = { setupDiscord, addRole, removeRole };