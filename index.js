const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 100 MB RAM dostu hafif komut listesi
const commands = [
    new SlashCommandBuilder().setName('yasakla').setDescription('Kullanıcıyı sunucudan yasaklar')
        .addUserOption(option => option.setName('kullanici').setDescription('Yasaklanacak kişi').setRequired(true)),
    new SlashCommandBuilder().setName('at').setDescription('Kullanıcıyı sunucudan atar')
        .addUserOption(option => option.setName('kullanici').setDescription('Atılacak kişi').setRequired(true)),
    new SlashCommandBuilder().setName('temizle').setDescription('Mesaj siler')
        .addIntegerOption(option => option.setName('sayi').setDescription('Silinecek mesaj sayısı').setRequired(true)),
    new SlashCommandBuilder().setName('profil').setDescription('Kullanıcı profilini gösterir')
        .addUserOption(option => option.setName('kullanici').setDescription('Kişi').setRequired(false)),
    new SlashCommandBuilder().setName('zar').setDescription('Zar atar (1-6)'),
    new SlashCommandBuilder().setName('yaz_tura').setDescription('Yazı tura atar')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot aktif: ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Komutlar yükleniyor...');
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, '1539711205696999495'),
            { body: commands },
        );
        console.log('Komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, options, user, guild } = interaction;

    if (commandName === 'yasakla') {
        const target = options.getUser('kullanici');
        await guild.members.ban(target);
        await interaction.reply(`${target.tag} sunucudan yasaklandı.`);
    } else if (commandName === 'at') {
        const target = options.getUser('kullanici');
        await guild.members.kick(target);
        await interaction.reply(`${target.tag} sunucudan atıldı.`);
    } else if (commandName === 'temizle') {
        const count = options.getInteger('sayi');
        await interaction.channel.bulkDelete(count, true);
        await interaction.reply({ content: `${count} adet mesaj silindi.`, ephemeral: true });
    } else if (commandName === 'profil') {
        const target = options.getUser('kullanici') || user;
        const embed = new EmbedBuilder().setTitle(`${target.username} Profili`).setColor('Blue');
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'zar') {
        const roll = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`Zar sonucu: **${roll}**`);
    } else if (commandName === 'yaz_tura') {
        const result = Math.random() < 0.5 ? 'Yazı' : 'Tura';
        await interaction.reply(`Sonuç: **${result}**`);
    }
});

client.login(process.env.DISCORD_TOKEN);
