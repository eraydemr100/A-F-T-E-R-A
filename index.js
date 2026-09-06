const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const levels = {};
const saymaKanallari = {};

const commands = [
    new SlashCommandBuilder().setName('yasaklamak').setDescription('Kullanıcıyı sunucudan yasaklar')
        .addUserOption(option => option.setName('kullanici').setDescription('Yasaklanacak kişi').setRequired(true)),
    new SlashCommandBuilder().setName('de').setDescription('Kullanıcıyı sunucudan atar')
        .addUserOption(option => option.setName('kullanici').setDescription('Atılacak kişi').setRequired(true)),
    new SlashCommandBuilder().setName('sustur').setDescription('Kullanıcıya zamanaşımı uygular')
        .addUserOption(option => option.setName('kullanici').setDescription('Susturulacak kişi').setRequired(true))
        .addIntegerOption(option => option.setName('dakika').setDescription('Süre (dakika)').setRequired(true)),
    new SlashCommandBuilder().setName('uyar').setDescription('Kullanıcıyı uyarır')
        .addUserOption(option => option.setName('kullanici').setDescription('Uyarılacak kişi').setRequired(true))
        .addStringOption(option => option.setName('sebep').setDescription('Uyarı sebebi').setRequired(true)),
    new SlashCommandBuilder().setName('temizle').setDescription('Belirtilen miktarda mesaj siler')
        .addIntegerOption(option => option.setName('say').setDescription('Silinecek mesaj sayısı').setRequired(true)),
    new SlashCommandBuilder().setName('kanalkitle').setDescription('Kanalı mesaj gönderimine kapatır'),
    new SlashCommandBuilder().setName('kanalac').setDescription('Kanalı açar'),
    new SlashCommandBuilder().setName('profil').setDescription('Kullanıcı profilini gösterir')
        .addUserOption(option => option.setName('kullanici').setDescription('Bakılacak kişi').setRequired(false)),
    new SlashCommandBuilder().setName('avatar').setDescription('Kullanıcının avatarını gösterir')
        .addUserOption(option => option.setName('kullanici').setDescription('Avatarı tutan kişi').setRequired(false)),
    new SlashCommandBuilder().setName('sunucu_bilgi').setDescription('Sunucunun alındığı gösterilir'),
    new SlashCommandBuilder().setName('seviye').setDescription('Seviyenizi gösterir'),
    new SlashCommandBuilder().setName('siralama').setDescription('Sunucu seviye sıralamasını gösterir'),
    new SlashCommandBuilder().setName('yaz_tura').setDescription('Yazı tura atar'),
    new SlashCommandBuilder().setName('zar').setDescription('Zar atar (1-6)'),
    new SlashCommandBuilder().setName('en_iyi_8').setDescription('Sihirli 8 top dağıtı yanıtlar')
        .addStringOption(option => option.setName('soru').setDescription('Sorunuz').setRequired(true)),
    new SlashCommandBuilder().setName('anket').setDescription('Anket sorusu')
        .addStringOption(option => option.setName('soru').setDescription('Anket sorusu').setRequired(true)),
    new SlashCommandBuilder().setName('itiraf').setDescription('Gizli itiraf ediyorsunuz')
        .addStringOption(option => option.setName('mesaj').setDescription('İtirafınız').setRequired(true)),
    new SlashCommandBuilder().setName('guclendirici').setDescription('Booster özel rollerini gösterir'),
    new SlashCommandBuilder().setName('guclendirici_kisi').setDescription('Sunucuya boost basanları listeler'),
    new SlashCommandBuilder().setName('boosterbilgi').setDescription('Boost takvim hakkında bilgi verir'),
    new SlashCommandBuilder().setName('bilet_olustur').setDescription('Destek katılımınız yer aldı!')
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

    if (commandName === 'yasaklamak') {
        const target = options.getUser('kullanici');
        await guild.members.ban(target);
        await interaction.reply(`${target.tag} sunucudan yasaklandı.`);
    } else if (commandName === 'de') {
        const target = options.getUser('kullanici');
        await guild.members.kick(target);
        await interaction.reply(`${target.tag} sunucudan atıldı.`);
    } else if (commandName === 'sustur') {
        const target = options.getUser('kullanici');
        const minutes = options.getInteger('dakika');
        await guild.members.cache.get(target.id)?.timeout(minutes * 60 * 1000);
        await interaction.reply(`${target.tag} ${minutes} dakika susturuldu.`);
    } else if (commandName === 'uyar') {
        const target = options.getUser('kullanici');
        const reason = options.getString('sebep');
        await interaction.reply(`${target}, uyarıldın! Sebep: **${reason}**`);
    } else if (commandName === 'temizle') {
        const count = options.getInteger('say');
        await interaction.channel.bulkDelete(count, true);
        await interaction.reply({ content: `${count} adet mesaj silindi.`, ephemeral: true });
    } else if (commandName === 'kanalkitle') {
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        await interaction.reply('Kanal kilitlendi.');
    } else if (commandName === 'kanalac') {
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
        await interaction.reply('Kanal açıldı.');
    } else if (commandName === 'profil') {
        const target = options.getUser('kullanici') || user;
        const embed = new EmbedBuilder().setTitle(`${target.username} Profili`);
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'avatar') {
        const target = options.getUser('kullanici') || user;
        const embed = new EmbedBuilder().setTitle(`${target.username} Avatarı`).setImage(target.displayAvatarURL({ dynamic: true, size: 404 }));
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'sunucu_bilgi') {
        const embed = new EmbedBuilder().setTitle(`${guild.name} Bilgileri`).setDescription(`Üye Sayısı: ${guild.memberCount}`);
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'seviye') {
        const targetUser = options.getUser('kullanici') || user;
        const data = levels[targetUser.id] || { deneyimPuani: 0, seviye: 1 };
        await interaction.reply(`Sayfa: **${data.seviye}** | XP: **${data.deneyimPuani}/${data.seviye * 100}**`);
    } else if (commandName === 'siralama') {
        await interaction.reply('Sıralama yakında aktif olacak!');
    } else if (commandName === 'yaz_tura') {
        const result = Math.random() < 0.5 ? 'Yazı' : 'Tura';
        await interaction.reply(`Sonuç: **${result}**`);
    } else if (commandName === 'zar') {
        const roll = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`Zar sonucu: **${roll}**`);
    } else if (commandName === 'en_iyi_8') {
        const answers = ['Kesinlikle.', 'Buna güvenin.', 'Kesinlikle hayır.', 'İşaretler evet diyor.'];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        await interaction.reply(`Cevap: **${answer}**`);
    } else if (commandName === 'anket') {
        const question = options.getString('soru');
        const embed = new EmbedBuilder().setTitle('ANKET').setDescription(question).setColor('Yellow');
        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        await msg.react('👍'); await msg.react('👎');
    } else if (commandName === 'itiraf') {
        const messageText = options.getString('mesaj');
        const embed = new EmbedBuilder().setTitle('Anonim İtiraf').setDescription(messageText).setColor('Purple');
        await interaction.reply({ content: 'İtiraf gönderildi', ephemeral: true });
    } else if (commandName === 'guclendirici') {
        await interaction.reply('Booster özel roller hakkında bilgi!');
    } else if (commandName === 'guclendirici_kisi') {
        await interaction.reply('Boost basanlar listeleniyor!');
    } else if (commandName === 'boosterbilgi') {
        await interaction.reply('Boost takvim hakkında bilgi verir');
    } else if (commandName === 'bilet_olustur') {
        await interaction.reply({ content: 'Destek katılımınız yer aldı!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
