require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, ButtonBuilder, ActionRowBuilder, ButtonStyle, TextInputStyle } = require('discord.js'); // Importing TextInputStyle from discord.js
const { Modal, TextInputComponent, showModal } = require('discord-modals'); // Importing classes from discord-modals

const mysql = require('mysql2');



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ]
});
const discordModals = require('discord-modals'); // Initializing discord-modals
discordModals(client); // Pass the client to the discord-modals

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID; // ใช้ Server ID ที่คุณได้จากขั้นตอนข้างต้น
const CHANNEL_ID = process.env.CHANNEL_ID; // เจาะจง Channel ID ที่ต้องการ
const ROLE_ID = process.env.ROLE_ID; // เจาะจง Role ID ที่ต้องการมอบให้ผู้ใช้
const ADMIN_LOG_CHANNEL_ID = process.env.ADMIN_LOG_CHANNEL_ID; // เจาะจง Channel ID ที่ใช้สำหรับ log
const mysql=JSON.parse(process.env.MYSQL);

const connection = mysql.createConnection(mysql);
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    sendRegisterButton();
});

const sendRegisterButton = () => {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.error("Channel not found");

    const button = new ButtonBuilder()
        .setCustomId('register-button')
        .setLabel('ลงทะเบียน')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    channel.send({
        content: 'คลิกปุ่มล่างนี้เพื่อลงทะเบียน',
        components: [row]
    });
};

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'register-button') {
            const modal = new Modal() // We create a Modal
                .setCustomId('registration-modal')
                .setTitle('ลงทะเบียนไวริส')
                .addComponents(
                    new TextInputComponent()
                        .setCustomId('first-name')
                        .setLabel('ชื่อจริง')
                        .setStyle(TextInputStyle.Short) // Corrected to use TextInputStyle from discord.js
                        .setPlaceholder('Enter your first name')
                        .setRequired(true),
                    new TextInputComponent()
                        .setCustomId('last-name')
                        .setLabel('นามสกุล')
                        .setStyle(TextInputStyle.Short) // Corrected to use TextInputStyle from discord.js
                        .setPlaceholder('Enter your last name')
                        .setRequired(true),
                        new TextInputComponent()
                        .setCustomId('favorite-song')
                        .setLabel('เพลงที่ชอบ')
                        .setStyle(TextInputStyle.Short) // Corrected to use TextInputStyle from discord.js
                        .setPlaceholder('Enter your favorite song')
                        .setRequired(true),
                    new TextInputComponent()
                        .setCustomId('detail-input')
                        .setLabel('เหตุผลที่เข้ามา')
                        .setStyle(TextInputStyle.Paragraph) // Corrected to use TextInputStyle from discord.js
                        .setPlaceholder('Enter your Reason coming')
                        .setRequired(true)
                );

            showModal(modal, {
                client: client,
                interaction: interaction // Pass the Interaction to show the modal with that interaction data
            });
        }
    }
});

client.on('modalSubmit', async (modal) => {
    if (modal.customId === 'registration-modal') {
        const firstName = modal.getTextInputValue('first-name');
        const lastName = modal.getTextInputValue('last-name');
        const favoriteSong = modal.getTextInputValue('favorite-song');
        const reason=modal.getTextInputValue('detail-input');

        await modal.deferReply({ ephemeral: true });

        await modal.followUp({
            content: `Thank you for registering!\nName: ${firstName}\nLast Name: ${lastName}\nFavorite Song: ${favoriteSong}\nReason coming: ${reason}`,
            ephemeral: true
        });
        // เพิ่ม role ให้กับผู้ใช้
        const guild = client.guilds.cache.get(GUILD_ID);
        const member = guild.members.cache.get(modal.user.id);
        const role = guild.roles.cache.get(ROLE_ID);

        if (member && role) {
            await member.roles.add(role);
            await modal.followUp({ content: `You have been given the role!`, ephemeral: true });
        } else {
            await modal.followUp({ content: `There was an error assigning the role.`, ephemeral: true });
        }

        // ส่ง log การลงทะเบียนไปยังช่องแชทสำหรับแอดมิน
        const logChannel = guild.channels.cache.get(ADMIN_LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send(`New registration:\nName: ${firstName}\nLast Name: ${lastName}\nFavorite Song: ${favoriteSong}\nReason coming: ${reason}\nUser: <@${modal.user.id}>`);
            connection.query(
                'INSERT INTO member (fname,lname,song,reason)VALUES(?,?,?,?);',
                [firstName, lastName,favoriteSong,reason],
                function (err, results) {
                
                }
              );
            console.log("register success full");
        }
    }
});

client.login(TOKEN);
