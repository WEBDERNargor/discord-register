require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { Modal, TextInputComponent, showModal } = require('discord-modals'); // Importing classes from discord-modals

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
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // ใช้ Server ID ที่คุณได้จากขั้นตอนข้างต้น
const CHANNEL_ID = process.env.CHANNEL_ID; // เจาะจง Channel ID ที่ต้องการ
const ROLE_ID = process.env.ROLE_ID; // เจาะจง Role ID ที่ต้องการมอบให้ผู้ใช้
const ADMIN_LOG_CHANNEL_ID = process.env.ADMIN_LOG_CHANNEL_ID; // เจาะจง Channel ID ที่ใช้สำหรับ log

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const commands = [{
    name: 'register',
    description: 'Open registration form'
}];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, channelId } = interaction;

    // ตรวจสอบว่า interaction มาจาก channel ที่ถูกต้อง
    if (channelId !== CHANNEL_ID) {
        return interaction.reply({ content: 'You can only use this command in the specified channel.', ephemeral: true });
    }

    if (commandName === 'register') {
        const modal = new Modal() // We create a Modal
            .setCustomId('registration-modal')
            .setTitle('Registration Form')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('first-name')
                    .setLabel('First Name')
                    .setStyle('SHORT')
                    .setPlaceholder('Enter your first name')
                    .setRequired(true),
                new TextInputComponent()
                    .setCustomId('last-name')
                    .setLabel('Last Name')
                    .setStyle('SHORT')
                    .setPlaceholder('Enter your last name')
                    .setRequired(true),
                new TextInputComponent()
                    .setCustomId('favorite-song')
                    .setLabel('Favorite Song')
                    .setStyle('SHORT')
                    .setPlaceholder('Enter your favorite song')
                    .setRequired(true)
            );

        showModal(modal, {
            client: client,
            interaction: interaction // Pass the Interaction to show the modal with that interaction data
        });
    }
});

client.on('modalSubmit', async (modal) => {
    if (modal.customId === 'registration-modal') {
        const firstName = modal.getTextInputValue('first-name');
        const lastName = modal.getTextInputValue('last-name');
        const favoriteSong = modal.getTextInputValue('favorite-song');

        await modal.deferReply({ ephemeral: true });

        await modal.followUp({
            content: `Thank you for registering!\nName: ${firstName}\nLast Name: ${lastName}\nFavorite Song: ${favoriteSong}`,
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
            logChannel.send(`New registration:\nName: ${firstName}\nLast Name: ${lastName}\nFavorite Song: ${favoriteSong}\nUser: <@${modal.user.id}>`);
        }
    }
});

client.login(TOKEN);
