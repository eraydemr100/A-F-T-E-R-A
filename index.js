const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const levels = {};
const countingChannels = {};

const commands = [
    new SlashCommandBuilder().setName('ban').setDescription('Kullanıcıyı sunucudan yasaklar')
        .addUserOption(opt => opt.name('kullanici').setDescription('Yasaklanacak kişi').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),
    new SlashCommandBuilder().setName('at').setDescription('Kullanıcıyı sunucudan atar')
        .addUserOption(opt => opt.name('kullanici').setDescription('Atılacak kişi').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),
    new SlashCommandBuilder().setName('sustur').setDescription('Kullanıcıya zamanaşımı uygular')
        .addUserOption(opt => opt.name('kullanici').setDescription('Susturulacak kişi').setRequired(true))
        .addIntegerOption(opt => opt.name('sure').setDescription('Süre (dakika)').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
    new SlashCommandBuilder().setName('uyar').setDescription('Kullanıcıyı uyarır')
        .addUserOption(opt => opt.name('kullanici').setDescription('Uyarılacak kişi').setRequired(true))
        .addStringOption(opt => opt.name('sebep').setDescription('Uyarı sebebi').setRequired(true)),
    new SlashCommandBuilder().setName('temizle').setDescription('Belirtilen miktarda mesaj siler')
        .addIntegerOption(opt => opt.name('sayi').setDescription('Silinecek mesaj sayısı').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    new SlashCommandBuilder().setName('kanalkilitle').setDescription('Kanalı mesaj gönderimine kapatır')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
    new SlashCommandBuilder().setName('kanalac').setDescription('Kanalın kilidini açar')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
    new SlashCommandBuilder().setName('profil').setDescription('Kullanıcı profilini gösterir')
        .addUserOption(opt => opt.name('kullanici').setDescription('Bakılacak kişi').setRequired(false)),
    new SlashCommandBuilder().setName('avatar').setDescription('Kullanıcının avatarını gösterir')
        .addUserOption(opt => opt.name('kullanici').setDescription('Avatarı alınacak kişi').setRequired(false)),
    new SlashCommandBuilder().setName('sunucu_bilgi').setDescription('Sunucu bilgilerini gösterir'),
    new SlashCommandBuilder().setName('seviye').setDescription('Seviyenizi ve XP durumunuzu gösterir'),
    new SlashCommandBuilder().setName('siralama').setDescription('Sunucu seviye sıralamasını gösterir'),
    new SlashCommandBuilder().setName('yazi_tura').setDescription('Yazı tura atar'),
    new SlashCommandBuilder().setName('zar').setDescription('Zar atar (1-6)'),
    new SlashCommandBuilder().setName('top8').setDescription('Sihirli 8-ball sorularınızı yanıtlar')
        .addStringOption(opt => opt.name('soru').setDescription('Sorunuz').setRequired(true)),
    new SlashCommandBuilder().setName('anket').setDescription('Anket oluşturur')
        .addStringOption(opt => opt.name('soru').setDescription('Anket sorusu').setRequired(true)),
    new SlashCommandBuilder().setName('itiraf').setDescription('Gizli itiraf gönderir')
        .addStringOption(opt => opt.name('mesaj').setDescription('İtirafınız').setRequired(true)),
    new SlashCommandBuilder().setName('booster').setDescription('Booster özel rollerini gösterir'),
    new SlashCommandBuilder().setName('boosterlar').setDescription('Sunucuya boost basanları listeler'),
    new SlashCommandBuilder().setName('boosterbilgi').setDescription('Boost avantajları hakkında bilgi verir'),
    new SlashCommandBuilder().setName('bilet_olustur').setDescription('Destek bilet sistemi oluşturur')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot aktif: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, '1539711205696999495'),
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

    if (commandName === 'ban') {
        const target = options.getUser('kullanici');
        await guild.members.ban(target);
        await interaction.reply(`${target.tag} sunucudan yasaklandı.`);
    } else if (commandName === 'at') {
        const target = options.getUser('kullanici');
        await guild.members.kick(target);
        await interaction.reply(`${target.tag} sunucudan atıldı.`);
    } else if (commandName === 'sustur') {
        const target = options.getUser('kullanici');
        const mins = options.getInteger('sure');
        await guild.members.cache.get(target.id)?.timeout(mins * 60 * 1000);
        await interaction.reply(`${target.tag} ${mins} dakika susturuldu.`);
    } else if (commandName === 'uyar') {
        const target = options.getUser('kullanici');
        const reason = options.getString('sebep');
        await interaction.reply(`${target}, uyarıldın! Sebep: **${reason}**`);
    } else if (commandName === 'temizle') {
        const count = options.getInteger('sayi');
        await interaction.channel.bulkDelete(count, true);
        await interaction.reply({ content: `${count} adet mesaj silindi.`, ephemeral: true });
    } else if (commandName === 'kanalkilitle') {
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        await interaction.reply('🔒 Kanal kilitlendi.');
    } else if (commandName === 'kanalac') {
        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
        await interaction.reply('🔓 Kanal açıldı.');
    } else if (commandName === 'profil') {
        const target = options.getUser('kullanici') || user;
        const embed = new EmbedBuilder().setTitle(`${target.username} Profili`).setThumbnail(target.displayAvatarURL()).setColor('Blue');
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'avatar') {
        const target = options.getUser('kullanici') || user;
        const embed = new EmbedBuilder().setTitle(`${target.username} Avatarı`).setImage(target.displayAvatarURL({ size: 1024 })).setColor('Blue');
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'sunucu_bilgi') {
        const embed = new EmbedBuilder().setTitle(`${guild.name} Bilgileri`).setDescription(`Üye Sayısı: ${guild.memberCount}`).setColor('Green');
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'seviye') {
        const data = levels[user.id] || { xp: 0, level: 1 };
        await interaction.reply(`📊 Seviyen: **${data.level}** | XP: **${data.xp} / ${data.level * 100}**`);
    } else if (commandName === 'siralama') {
        await interaction.reply('🏆 Sıralama yakında aktif olacak!');
    } else if (commandName === 'yazi_tura') {
        const sonuc = Math.random() < 0.5 ? 'Tura' : 'Yazı';
        await interaction.reply(`🪙 Sonuç: **${sonuc}**`);
    } else if (commandName === 'zar') {
        const zar = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`🎲 Zar sonucu: **${zar}**`);
    } else if (commandName === 'top8') {
        const cevaplar = ['Kesinlikle.', 'Buna güvenebilirsin.', 'Kesinlikle hayır.', 'İşaretler evet diyor.'];
        await interaction.reply(`🔮 Cevap: **${cevaplar[Math.floor(Math.random() * cevaplar.length)]}**`);
    } else if (commandName === 'anket') {
        const soru = options.getString('soru');
        const embed = new EmbedBuilder().setTitle('📊 ANKET').setDescription(soru).setColor('Yellow');
        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        msg.react('👍'); msg.react('👎');
    } else if (commandName === 'itiraf') {
        const mesaj = options.getString('mesaj');
        const embed = new EmbedBuilder().setTitle('🤫 Anonim İtiraf').setDescription(mesaj).setColor('Purple');
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: 'İtiraf gönderildi!', ephemeral: true });
    } else if (commandName === 'booster') {
        await interaction.reply('💎 Booster özel rolleri hakkında bilgi!');
    } else if (commandName === 'boosterlar') {
        await interaction.reply('🚀 Boost basanlar listeleniyor!');
    } else if (commandName === 'boosterbilgi') {
        await interaction.reply('ℹ️ Boost avantajları bilgisi.');
    } else if (commandName === 'bilet_olustur') {
        await interaction.reply({ content: '🎟️ Destek biletiniz oluşturuldu!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);

