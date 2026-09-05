const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder 
} = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// ------------------- SLASH KOMUT TANIMLARI -------------------
const commands = [
    new SlashCommandBuilder()
        .setName('oneri')
        .setDescription('Sunucu için bir öneride bulunabilirsiniz')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Önerinizi yazın').setRequired(true)),

    new SlashCommandBuilder()
        .setName('sunucu-rehberi')
        .setDescription('Sunucu kuralları ve bilgilerini gösterir'),

    new SlashCommandBuilder()
        .setName('sunucu-bilgi')
        .setDescription('Sunucu istatistiklerini gösterir'),

    new SlashCommandBuilder()
        .setName('kilit')
        .setDescription('Kanalı mesaj gönderimine kapatır')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('kilit-ac')
        .setDescription('Kanalın kilidini açar')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Kullanıcıyı sunucudan yasaklar')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak üye').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Yasaklama sebebi'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('ban-ac')
        .setDescription('Kullanıcının yasaklamasını kaldırır')
        .addStringOption(opt => opt.setName('id').setDescription('Kullanıcı ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Kullanıcıyı geçici olarak susturur')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Susturulacak üye').setRequired(true))
        .addIntegerOption(opt => opt.setName('suresi').setDescription('Dakika cinsinden süre').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Kullanıcının susturmasını kaldırır')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Susturması kaldırılacak üye').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('hava-durumu')
        .setDescription('Bir şehrin hava durumunu gösterir')
        .addStringOption(opt => opt.setName('sehir').setDescription('Şehir adı').setRequired(true))
];

// ------------------- BOT HAZIR OLDUĞUNDA -------------------
client.once('ready', async () => {
    console.log(`🤖 Bot Aktif: ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Slash komutları yükleniyor...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error('Komut yükleme hatası:', error);
    }
});

// ------------------- KOMUT ÇALIŞTIRMA -------------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, channel } = interaction;

    if (commandName === 'oneri') {
        const mesaj = options.getString('mesaj');
        const embed = new EmbedBuilder()
            .setTitle('💡 Yeni Öneri')
            .setDescription(mesaj)
            .setFooter({ text: `Öneren: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setColor(0xFEE75C);

        await interaction.reply({ content: '✅ Öneriniz alındı!', ephemeral: true });
        await channel.send({ embeds: [embed] });
    }

    if (commandName === 'sunucu-rehberi') {
        const embed = new EmbedBuilder()
            .setTitle(`📖 ${guild.name} Rehberi & Kuralları`)
            .addFields(
                { name: '1. Saygı ve Hoşgörü', value: 'Küfür, hakaret ve ayrımcılık yasaktır.' },
                { name: '2. Reklam Yasaktır', value: 'DM veya kanallardan reklam yapmak yasaktır.' },
                { name: '3. Doğru Kanal Kullanımı', value: 'Lütfen sohbeti ilgili kanallarda sürdürün.' }
            )
            .setColor(0x5865F2);

        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'sunucu-bilgi') {
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} Sunucu İstatistikleri`)
            .addFields(
                { name: '👥 Toplam Üye', value: `${guild.memberCount}`, inline: true },
                { name: '👑 Sunucu Sahibi', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Oluşturulma', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setColor(0x57F287);

        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'kilit') {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: '🔒 Bu kanal mesaj gönderimine kapatıldı.' });
    }

    if (commandName === 'kilit-ac') {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ content: '🔓 Kanal tekrar erişime açıldı.' });
    }

    if (commandName === 'ban') {
        const target = options.getUser('kullanici');
        const reason = options.getString('sebep') || 'Sebep belirtilmedi.';
        await guild.members.ban(target, { reason });
        await interaction.reply({ content: `🔨 **${target.tag}** sunucudan yasaklandı. Sebep: ${reason}` });
    }

    if (commandName === 'ban-ac') {
        const userId = options.getString('id');
        try {
            await guild.members.unban(userId);
            await interaction.reply({ content: `✅ <@${userId}> ID'li kullanıcının yasağı kaldırıldı.` });
        } catch {
            await interaction.reply({ content: '❌ Kullanıcı bulunamadı veya yasaklı değil.', ephemeral: true });
        }
    }

    if (commandName === 'mute') {
        const member = options.getMember('kullanici');
        const minutes = options.getInteger('suresi');
        
        if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
        
        await member.timeout(minutes * 60 * 1000, 'Moderasyon komutu');
        await interaction.reply({ content: `🔇 **${member.user.tag}**, ${minutes} dakika boyunca susturuldu.` });
    }

    if (commandName === 'unmute') {
        const member = options.getMember('kullanici');
        if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

        await member.timeout(null);
        await interaction.reply({ content: `🔊 **${member.user.tag}** kullanıcısının susturması kaldırıldı.` });
    }

    if (commandName === 'hava-durumu') {
        const sehir = options.getString('sehir');
        try {
            const res = await axios.get(`https://wttr.in/${encodeURIComponent(sehir)}?format=j1`);
            const current = res.data.current_condition[0];

            const embed = new EmbedBuilder()
                .setTitle(`🌤️ ${sehir.toUpperCase()} Hava Durumu`)
                .addFields(
                    { name: 'Sıcaklık', value: `${current.temp_C}°C`, inline: true },
                    { name: 'Hissedilen', value: `${current.FeelsLikeC}°C`, inline: true },
                    { name: 'Nem', value: `%${current.humidity}`, inline: true }
                )
                .setColor(0x3498DB);

            await interaction.reply({ embeds: [embed] });
        } catch {
            await interaction.reply({ content: '❌ Şehir bilgisi alınamadı.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

