// Import des modules nécessaires et configuration du bot
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ChannelType, ActivityType } = require('discord.js');

// Initialisation du client Discord avec les intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Configuration avec les variables d'environnement
const CONFIG = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
    colors: {
        anarchyRed: '#FF0000',
        anarchyBlack: '#1A1A1A',
        anarchyGrey: '#333333'
    },
    emojis: {
        anarchist: 'Ⓐ',
        solidarity: '✊',
        revolution: '⚔️',
        peace: '☮️',
        vote: '📊',
        assembly: '🏛️',
        freedom: '🕊️',
        fire: '🔥',
        fist: '✊',
        star: '⭐',
        chain: '⛓️',
        broken_chain: '🔗'
    }
};

// Définition des commandes Slash
const commands = [
    new SlashCommandBuilder()
        .setName('assemblee')
        .setDescription('Crée une nouvelle assemblée populaire')
        .addStringOption(option =>
            option.setName('sujet')
                .setDescription('Sujet de l\'assemblée')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Lance un vote collectif')
        .addStringOption(option =>
            option.setName('proposition')
                .setDescription('La proposition à voter')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duree')
                .setDescription('Durée du vote en heures')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('sondage')
        .setDescription('Crée un sondage participatif')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question du sondage')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Options séparées par des virgules')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('hub')
        .setDescription('Gérer le hub de rôles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer un nouveau hub de rôles')
                .addStringOption(option =>
                    option.setName('nom')
                        .setDescription('Nom du hub de rôles')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description du hub')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Supprimer un hub de rôles existant'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Afficher tous les hubs de rôles')),
    new SlashCommandBuilder()
        .setName('role')
        .setDescription('Gérer les rôles dans un hub')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajouter un rôle au hub')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à ajouter')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('L\'emoji pour ce rôle')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description du rôle')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retirer un rôle du hub')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à retirer')
                        .setRequired(true))),
];

// Initialisation de l'API REST
const rest = new REST({ version: '10' }).setToken(CONFIG.token);

// Déploiement des commandes slash
(async () => {
    try {
        console.log('Déploiement des commandes slash...');
        await rest.put(
            Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId),
            { body: commands }
        );
        console.log('Commandes slash déployées avec succès!');
    } catch (error) {
        console.error('Erreur lors du déploiement des commandes:', error);
    }
})();

// Structure de données pour stocker les hubs de rôles
let roleHubs = new Map();

// Fonction pour obtenir l'identifiant unique de l'emoji
function getEmojiIdentifier(emoji) {
    // Si c'est un emoji personnalisé
    if (emoji.id) {
        return emoji.id;
    }
    // Si c'est un emoji Unicode
    return emoji.name;
}

// Connexion du client Discord
client.once('ready', async () => {
    try {
        console.log(`Bot connecté en tant que ${client.user.tag}`);
        
        // Définition du statut et de l'activité
        await client.user.setPresence({
            activities: [{
                name: 'la Commune de Paris',
                type: ActivityType.Watching
            }],
            status: 'online'
        });
        console.log('Statut et activité définis avec succès.');
        
        // Gestionnaire unique pour les nouveaux membres
        if (!client.welcomeHandlerSet) {
            client.on('guildMemberAdd', async member => {
                try {
                    const channel = member.guild.channels.cache.get(CONFIG.welcomeChannelId);
                    if (!channel) return;

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor(CONFIG.colors.anarchyRed)
                        .setTitle(`${CONFIG.emojis.fire} Bienvenue dans la Commune ! ${CONFIG.emojis.solidarity}`)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
                        .setDescription(`
${CONFIG.emojis.star} **Salut à toi, camarade !**

${CONFIG.emojis.anarchist} Tu viens de rejoindre un espace :
• De liberté et d'entraide mutuelle
• D'autogestion et de démocratie directe
• De lutte et de solidarité

${CONFIG.emojis.fire} *"L'ordre, c'est la servitude et la misère de presque tous au profit de quelques-uns. Le désordre sous la Commune, c'était le bien-être pour tous, c'était la liberté, c'était la justice."* - Louise Michel`)
                        .setTimestamp();

                    await channel.send({
                        content: `${CONFIG.emojis.solidarity} Bienvenue <@${member.id}> ! ${CONFIG.emojis.revolution}`,
                        embeds: [welcomeEmbed]
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'envoi du message de bienvenue:', error);
                }
            });
            client.welcomeHandlerSet = true;
        }
    } catch (error) {
        console.error('Erreur lors de la définition du statut:', error);
    }
});

// Gestion des interactions Slash Command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            case 'assemblee':
                const sujet = interaction.options.getString('sujet');
                const assembleeEmbed = new EmbedBuilder()
                    .setColor(CONFIG.colors.anarchyBlack)
                    .setTitle(`${CONFIG.emojis.assembly} Assemblée Populaire Autogérée ${CONFIG.emojis.anarchist}`)
                    .setDescription(`
${CONFIG.emojis.fire} **Sujet de Discussion:** ${sujet}

${CONFIG.emojis.solidarity} Cette assemblée est un espace de:
• Parole libre et égalitaire
• Prise de décision collective
• Construction d'alternatives

*"Nous ne voulons plus ni maîtres ni esclaves. Nous voulons que la terre appartienne à tous."* - Louise Michel`)
                    .addFields(
                        { name: '📋 Règles', value: 'Respect mutuel • Écoute active • Consensus', inline: true },
                        { name: '🎯 Objectif', value: 'Construire ensemble • Agir collectivement', inline: true }
                    )
                    .setTimestamp();
                await interaction.reply({ embeds: [assembleeEmbed] });
                break;

            case 'vote':
                const proposition = interaction.options.getString('proposition');
                const duree = parseInt(interaction.options.getString('duree')) * 3600000;
                const voteEmbed = new EmbedBuilder()
                    .setColor(CONFIG.colors.anarchyGrey)
                    .setTitle(`${CONFIG.emojis.vote} Décision Collective ${CONFIG.emojis.anarchist}`)
                    .setDescription(`
${CONFIG.emojis.fire} **Proposition:** ${proposition}
${CONFIG.emojis.revolution} **Durée:** ${duree / 3600000} heures

${CONFIG.emojis.solidarity} Participez à la prise de décision collective!
✅ Pour
❌ Contre
⚪ Abstention

*"Le pouvoir au peuple, pas aux dirigeants!"*`)
                    .addFields(
                        { name: '🎯 Objectif', value: 'Décision horizontale et transparente', inline: true },
                        { name: '📊 Processus', value: 'Vote direct et démocratique', inline: true }
                    )
                    .setTimestamp();
                const voteMessage = await interaction.reply({ embeds: [voteEmbed], fetchReply: true });
                await Promise.all([
                    voteMessage.react('✅'),
                    voteMessage.react('❌'),
                    voteMessage.react('⚪')
                ]);
                break;

            case 'sondage':
                const question = interaction.options.getString('question');
                const options = interaction.options.getString('options').split(',').map(opt => opt.trim()).filter(opt => opt !== '');
                
                if (options.length < 2 || options.length > 10) {
                    await interaction.reply({ 
                        content: '⚠️ Un sondage doit avoir entre 2 et 10 options ! La démocratie directe nécessite des choix clairs.',
                        ephemeral: true 
                    });
                    return;
                }

                const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                const optionsText = options.map((opt, idx) => `${numberEmojis[idx]} ${opt}`).join('\n');

                const sondageEmbed = new EmbedBuilder()
                    .setColor(CONFIG.colors.anarchyRed)
                    .setTitle(`${CONFIG.emojis.vote} Consultation Collective ${CONFIG.emojis.anarchist}`)
                    .setDescription(`
${CONFIG.emojis.fire} **Question Soumise au Collectif:**
➥ ${question}

${CONFIG.emojis.solidarity} **Propositions:**
${optionsText}

${CONFIG.emojis.revolution} **Comment Participer ?**
• Réagissez avec les émojis correspondants
• Une personne = Une voix
• Débat ouvert dans les commentaires

${CONFIG.emojis.anarchist} *"Nous ne voulons plus ni maîtres ni esclaves. Nous voulons que la terre appartienne à tous."* - Louise Michel`)
                    .addFields(
                        { name: '🎯 Objectif', value: 'Prise de décision horizontale', inline: true },
                        { name: '⚖️ Principe', value: 'Égalité des voix', inline: true },
                        { name: '🕒 Durée', value: 'Discussion ouverte', inline: true }
                    )
                    .setFooter({ text: 'Sondage créé par le collectif | Les résultats seront visibles en temps réel' })
                    .setTimestamp();

                const sondageMessage = await interaction.reply({ embeds: [sondageEmbed], fetchReply: true });

                // Ajouter les réactions pour chaque option
                for (const emoji of numberEmojis.slice(0, options.length)) {
                    await sondageMessage.react(emoji);
                }

                // Ajouter les réactions supplémentaires
                await Promise.all([
                    sondageMessage.react('💭'),
                    sondageMessage.react('📊'),
                    sondageMessage.react(CONFIG.emojis.solidarity)
                ]);

                // Collecter les réactions
                const collector = sondageMessage.createReactionCollector({
                    filter: (reaction, user) => !user.bot,
                    time: 24 * 60 * 60 * 1000
                });

                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name === '📊') {
                        const results = options.map((opt, idx) => {
                            const reactionCount = sondageMessage.reactions.cache
                                .get(numberEmojis[idx])?.count - 1 || 0;
                            return `${numberEmojis[idx]} ${opt}: **${reactionCount}** voix`;
                        }).join('\n');

                        const resultsEmbed = new EmbedBuilder()
                            .setColor(CONFIG.colors.anarchyGrey)
                            .setTitle(`${CONFIG.emojis.vote} Résultats Actuels du Sondage`)
                            .setDescription(`
**Question:** ${question}

${CONFIG.emojis.solidarity} **Résultats:**
${results}

${CONFIG.emojis.revolution} *Le vote continue ! Participez à la décision collective !*`)
                            .setTimestamp();

                        await interaction.followUp({ embeds: [resultsEmbed], ephemeral: true });
                    }
                });

                collector.on('end', async () => {
                    const finalResults = options.map((opt, idx) => {
                        const reactionCount = sondageMessage.reactions.cache
                            .get(numberEmojis[idx])?.count - 1 || 0;
                        return `${numberEmojis[idx]} ${opt}: **${reactionCount}** voix`;
                    }).join('\n');

                    const finalEmbed = new EmbedBuilder()
                        .setColor(CONFIG.colors.anarchyBlack)
                        .setTitle(`${CONFIG.emojis.vote} Résultats Finaux de la Consultation`)
                        .setDescription(`
**Question:** ${question}

${CONFIG.emojis.solidarity} **Résultats Finaux:**
${finalResults}

${CONFIG.emojis.revolution} *La voix du collectif s'est exprimée !*`)
                        .setTimestamp();

                    await interaction.followUp({ embeds: [finalEmbed] });
                });
                break;

            case 'hub':
                const subcommand = interaction.options.getSubcommand();

                if (subcommand === 'create') {
                    const hubName = interaction.options.getString('nom');
                    const description = interaction.options.getString('description');

                    const hubEmbed = new EmbedBuilder()
                        .setColor(CONFIG.colors.anarchyRed)
                        .setTitle(`━━━ 🏴 ${hubName} 🏴 ━━━`)
                        .setDescription(`
${description}

**┏━━━ Comment obtenir des rôles ? ━━━┓**
› Cliquez sur les réactions sous ce message
› Les rôles peuvent être ajoutés ou retirés à tout moment
› Chaque rôle représente une responsabilité ou un domaine d'action

**┏━━━ Liste des Rôles ━━━┓**`)
                        .setFooter({ 
                            text: '« L\'anarchie est l\'ordre sans le pouvoir » - Pierre-Joseph Proudhon'
                        });

                    const hubMessage = await interaction.channel.send({ embeds: [hubEmbed] });
                    roleHubs.set(hubMessage.id, { 
                        roles: new Map(), 
                        name: hubName,
                        description: description 
                    });

                    await interaction.reply({ 
                        content: `✅ Hub de rôles "${hubName}" créé avec succès!`, 
                        ephemeral: true 
                    });
                }
                else if (subcommand === 'delete') {
                    // Afficher un menu de sélection des hubs existants
                    const selectMenu = {
                        type: 3,
                        custom_id: 'delete_hub',
                        placeholder: 'Sélectionner un hub à supprimer',
                        options: Array.from(roleHubs.entries()).map(([messageId, hub]) => ({
                            label: hub.name,
                            value: messageId
                        }))
                    };

                    await interaction.reply({
                        content: 'Choisissez le hub à supprimer:',
                        components: [{ type: 1, components: [selectMenu] }],
                        ephemeral: true
                    });
                }
                else if (subcommand === 'list') {
                    const hubList = Array.from(roleHubs.values())
                        .map(hub => `• ${hub.name} (${hub.roles.size} rôles)`)
                        .join('\n');

                    await interaction.reply({
                        content: hubList || 'Aucun hub de rôles n\'existe actuellement.',
                        ephemeral: true
                    });
                }
                break;

            case 'role':
                const roleSubcommand = interaction.options.getSubcommand();

                if (roleSubcommand === 'add') {
                    const role = interaction.options.getRole('role');
                    const emoji = interaction.options.getString('emoji');
                    const description = interaction.options.getString('description');

                    // Afficher un menu de sélection des hubs
                    const selectMenu = {
                        type: 3,
                        custom_id: 'add_role',
                        placeholder: 'Sélectionner un hub',
                        options: Array.from(roleHubs.entries()).map(([messageId, hub]) => ({
                            label: hub.name,
                            value: messageId
                        }))
                    };

                    // Stocker temporairement les informations du rôle
                    interaction.client.tempRoleData = {
                        role: role,
                        emoji: emoji,
                        description: description
                    };

                    await interaction.reply({
                        content: 'Choisissez le hub où ajouter le rôle:',
                        components: [{ type: 1, components: [selectMenu] }],
                        ephemeral: true
                    });
                }
                else if (roleSubcommand === 'remove') {
                    const roleToRemove = interaction.options.getRole('role');

                    // Afficher un menu de sélection des hubs contenant ce rôle
                    const hubsWithRole = Array.from(roleHubs.entries())
                        .filter(([_, hub]) => Array.from(hub.roles.values()).some(r => r.id === roleToRemove.id))
                        .map(([messageId, hub]) => ({
                            label: hub.name,
                            value: messageId
                        }));

                    if (hubsWithRole.length === 0) {
                        await interaction.reply({
                            content: 'Ce rôle n\'est présent dans aucun hub.',
                            ephemeral: true
                        });
                        return;
                    }

                    const selectMenu = {
                        type: 3,
                        custom_id: 'remove_role',
                        placeholder: 'Sélectionner un hub',
                        options: hubsWithRole
                    };

                    interaction.client.tempRoleRemove = roleToRemove;

                    await interaction.reply({
                        content: 'Choisissez le hub d\'où retirer le rôle:',
                        components: [{ type: 1, components: [selectMenu] }],
                        ephemeral: true
                    });
                }
                break;

            default:
                await interaction.reply({ 
                    content: 'Commande non reconnue.',
                    ephemeral: true 
                });
        }
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la commande:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'Une erreur s\'est produite lors de l\'exécution de la commande.',
                ephemeral: true 
            });
        }
    }
});

// Gestionnaire des interactions avec les menus
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    const { customId, values } = interaction;
    const messageId = values[0];

    if (customId === 'delete_hub') {
        const hub = roleHubs.get(messageId);
        if (!hub) {
            await interaction.reply({
                content: 'Ce hub n\'existe plus.',
                ephemeral: true
            });
            return;
        }

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            await message.delete();
            roleHubs.delete(messageId);
            await interaction.reply({
                content: `Le hub "${hub.name}" a été supprimé.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du hub:', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la suppression du hub.',
                ephemeral: true
            });
        }
    }
    else if (customId === 'add_role') {
        const hub = roleHubs.get(messageId);
        const { role, emoji, description } = interaction.client.tempRoleData;

        if (!hub) {
            await interaction.reply({
                content: 'Ce hub n\'existe plus.',
                ephemeral: true
            });
            return;
        }

        let emojiKey;
        let emojiDisplay;
        
        const customEmojiMatch = emoji.match(/<:(.+):(\d+)>/);
        if (customEmojiMatch) {
            emojiKey = customEmojiMatch[2];
            emojiDisplay = emoji;
        } else {
            emojiKey = emoji;
            emojiDisplay = emoji;
        }

        hub.roles.set(emojiKey, {
            id: role.id,
            description: description,
            emojiDisplay: emojiDisplay,
            name: role.name
        });

        try {
            const message = await interaction.channel.messages.fetch(messageId);
            const embed = message.embeds[0];
            
            const newEmbed = new EmbedBuilder()
                .setColor(embed.color)
                .setTitle(`━━━ 🏴 ${hub.name} 🏴 ━━━`)
                .setDescription(`
${hub.description}

**┏━━━ Comment obtenir des rôles ? ━━━┓**
› Cliquez sur les réactions sous ce message
› Les rôles peuvent être ajoutés ou retirés à tout moment
› Chaque rôle représente une responsabilité ou un domaine d'action

**┏━━━ Liste des Rôles ━━━┓**`);

            // Ajouter les rôles dans l'ordre
            const sortedRoles = Array.from(hub.roles.entries()).sort((a, b) => 
                a[1].name.localeCompare(b[1].name)
            );

            // Grouper les rôles par paires pour un affichage en colonnes
            for (let i = 0; i < sortedRoles.length; i++) {
                const roleData = sortedRoles[i][1];
                newEmbed.addFields({
                    name: '\u200B',
                    value: `┣ ${roleData.emojiDisplay} **${roleData.name}**\n┗━ ${roleData.description}`
                });
            }

            if (sortedRoles.length > 0) {
                newEmbed.addFields({
                    name: '\u200B',
                    value: '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                });
            }

            newEmbed.setFooter({ 
                text: '« L\'anarchie est l\'ordre sans le pouvoir » - Pierre-Joseph Proudhon'
            });

            await message.edit({ embeds: [newEmbed] });
            await message.react(emoji);

            await interaction.reply({
                content: `✅ Le rôle ${role.name} a été ajouté au hub "${hub.name}".`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur lors de l\'ajout du rôle:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'ajout du rôle.',
                ephemeral: true
            });
        }

        delete interaction.client.tempRoleData;
    }
    else if (customId === 'remove_role') {
        const hub = roleHubs.get(messageId);
        const roleToRemove = interaction.client.tempRoleRemove;

        if (!hub) {
            await interaction.reply({
                content: 'Ce hub n\'existe plus.',
                ephemeral: true
            });
            return;
        }

        const emojiToRemove = Array.from(hub.roles.entries())
            .find(([_, role]) => role.id === roleToRemove.id)?.[0];

        if (emojiToRemove) {
            hub.roles.delete(emojiToRemove);

            try {
                const message = await interaction.channel.messages.fetch(messageId);
                const embed = message.embeds[0];
                
                const newEmbed = new EmbedBuilder()
                    .setColor(embed.color)
                    .setTitle(`━━━ 🏴 ${hub.name} 🏴 ━━━`)
                    .setDescription(`
${hub.description}

**┏━━━ Comment obtenir des rôles ? ━━━┓**
› Cliquez sur les réactions sous ce message
› Les rôles peuvent être ajoutés ou retirés à tout moment
› Chaque rôle représente une responsabilité ou un domaine d'action

**┏━━━ Liste des Rôles ━━━┓**`);

                // Ajouter les rôles dans l'ordre
                const sortedRoles = Array.from(hub.roles.entries()).sort((a, b) => 
                    a[1].name.localeCompare(b[1].name)
                );

                // Grouper les rôles par paires pour un affichage en colonnes
                for (let i = 0; i < sortedRoles.length; i++) {
                    const roleData = sortedRoles[i][1];
                    newEmbed.addFields({
                        name: '\u200B',
                        value: `┣ ${roleData.emojiDisplay} **${roleData.name}**\n┗━ ${roleData.description}`
                    });
                }

                if (sortedRoles.length > 0) {
                    newEmbed.addFields({
                        name: '\u200B',
                        value: '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                    });
                }

                newEmbed.setFooter({ 
                    text: '« L\'anarchie est l\'ordre sans le pouvoir » - Pierre-Joseph Proudhon'
                });

                await message.edit({ embeds: [newEmbed] });
                await message.reactions.cache.get(emojiToRemove)?.remove();

                await interaction.reply({
                    content: `✅ Le rôle ${roleToRemove.name} a été retiré du hub "${hub.name}".`,
                    ephemeral: true
                });
            } catch (error) {
                console.error('Erreur lors du retrait du rôle:', error);
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors du retrait du rôle.',
                    ephemeral: true
                });
            }
        }

        delete interaction.client.tempRoleRemove;
    }
});

// Gestionnaire des réactions
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    
    // Si la réaction est partielle, on la récupère complètement
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Erreur lors de la récupération de la réaction:', error);
            return;
        }
    }
    
    const emojiId = getEmojiIdentifier(reaction.emoji);
    console.log(`Réaction ajoutée - Message ID: ${reaction.message.id}, Emoji ID: ${emojiId}, Emoji Name: ${reaction.emoji.name}`);
    
    const hub = roleHubs.get(reaction.message.id);
    if (!hub) {
        console.log('Hub non trouvé pour ce message');
        return;
    }

    // Chercher le rôle par ID d'emoji ou nom d'emoji
    const roleData = hub.roles.get(emojiId) || hub.roles.get(reaction.emoji.name);
    if (!roleData) {
        console.log('Rôle non trouvé pour cet emoji:', emojiId);
        return;
    }

    try {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        
        // Vérifier les permissions du bot
        const botMember = await guild.members.fetch(client.user.id);
        if (!botMember.permissions.has('MANAGE_ROLES')) {
            console.error('Le bot n\'a pas la permission de gérer les rôles');
            return;
        }

        // Vérifier si le rôle existe toujours
        const role = await guild.roles.fetch(roleData.id);
        if (!role) {
            console.error('Le rôle n\'existe plus:', roleData.id);
            return;
        }

        // Vérifier si le bot peut attribuer ce rôle (hiérarchie)
        if (role.position >= botMember.roles.highest.position) {
            console.error('Le bot ne peut pas attribuer ce rôle (position trop haute)');
            return;
        }

        console.log(`Attribution du rôle ${role.name} à ${member.user.tag}`);
        await member.roles.add(role);
        console.log(`Rôle ${role.name} attribué avec succès à ${member.user.tag}`);
    } catch (error) {
        console.error('Erreur lors de l\'attribution du rôle:', error);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    
    // Si la réaction est partielle, on la récupère complètement
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Erreur lors de la récupération de la réaction:', error);
            return;
        }
    }
    
    const emojiId = getEmojiIdentifier(reaction.emoji);
    console.log(`Réaction retirée - Message ID: ${reaction.message.id}, Emoji ID: ${emojiId}, Emoji Name: ${reaction.emoji.name}`);
    
    const hub = roleHubs.get(reaction.message.id);
    if (!hub) {
        console.log('Hub non trouvé pour ce message');
        return;
    }

    // Chercher le rôle par ID d'emoji ou nom d'emoji
    const roleData = hub.roles.get(emojiId) || hub.roles.get(reaction.emoji.name);
    if (!roleData) {
        console.log('Rôle non trouvé pour cet emoji:', emojiId);
        return;
    }

    try {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        
        // Vérifier les permissions du bot
        const botMember = await guild.members.fetch(client.user.id);
        if (!botMember.permissions.has('MANAGE_ROLES')) {
            console.error('Le bot n\'a pas la permission de gérer les rôles');
            return;
        }

        // Vérifier si le rôle existe toujours
        const role = await guild.roles.fetch(roleData.id);
        if (!role) {
            console.error('Le rôle n\'existe plus:', roleData.id);
            return;
        }

        // Vérifier si le bot peut retirer ce rôle (hiérarchie)
        if (role.position >= botMember.roles.highest.position) {
            console.error('Le bot ne peut pas retirer ce rôle (position trop haute)');
            return;
        }

        console.log(`Retrait du rôle ${role.name} de ${member.user.tag}`);
        await member.roles.remove(role);
        console.log(`Rôle ${role.name} retiré avec succès de ${member.user.tag}`);
    } catch (error) {
        console.error('Erreur lors du retrait du rôle:', error);
    }
});

// Connexion du bot
client.login(CONFIG.token)
    .then(() => console.log('Bot connecté avec succès!'))
    .catch(error => console.error('Erreur de connexion:', error));
