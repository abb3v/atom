const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

// developed by peretas technologies
// discord.gg/peretas

require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const allowedIds = ['1006031596694011924', '689283450171162624'];

client.once('ready', async () => {
    console.log('Bot is online.');
    await client.user.setActivity('>help', { type: 'PLAYING' });
});


client.on('messageCreate', message => {
    if (message.content === '>test all') {
        message.channel.send('`[DEBUG]` - You are allowed to run this command.');
    }

    if (allowedIds.includes(message.author.id) && message.content === '>test allowed') {
        message.channel.send('`[DEBUG]` - You are allowed to run this command.');
    } else if (!allowedIds.includes(message.author.id) && message.content === '>test allowed') {
        message.channel.send('`[DEBUG]` - You are not allowed to run this command.`');
    }
});


client.on('messageCreate', async message => {
    if (message.content === '>listchannels') {
        const channels = message.guild.channels.cache
            .map(channel => {
                let type = '';
                if (channel.type === ChannelType.GuildCategory) {
                    type = 'Category';
                } else if (channel.type === ChannelType.GuildVoice) {
                    type = 'Voice Channel';
                } else if (channel.type === ChannelType.GuildText) {
                    type = 'Text Channel';
                }
                return `**${type}** -- ${channel.name} -- ID: ${channel.id}`;
            }).join('\n');

        const splitChannels = channels.match(/[\s\S]{1,1950}/g) || [];
        for (const part of splitChannels) {
            await message.channel.send(`Channels:\n${part}`);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('>create')) {
        const args = message.content.split(' ');
        const channelName = args[1];
        const amount = parseInt(args[2]);

        if (!channelName || isNaN(amount)) {
            return message.channel.send('Invalid command usage. Correct usage: >create [channelname] [amount]');
        }

        const createPromises = [];
        for (let i = 0; i < amount; i++) {
            createPromises.push(message.guild.channels.create({
                name: `${channelName}`,
                type: ChannelType.GuildText
            }));
        }

        await Promise.all(createPromises);
        message.channel.send(`Created ${amount} channels named ${channelName}`);
    }
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('>delete')) {
        const args = message.content.split(' ');
        const identifier = args[1];

        if (!identifier) {
            return message.channel.send('Invalid command usage. Correct usage: >delete [channelid OR channelname]');
        }

        const channels = message.guild.channels.cache.filter(channel => 
            channel.id === identifier || channel.name === identifier
        );

        if (channels.size === 0) {
            return message.channel.send('No channels found with the given identifier.');
        }

        if (channels.size > 1 && isNaN(identifier)) {
            message.channel.send('Multiple channels found with that name. Would you like to delete all channels with this name? y/n')
                .then(() => {
                    const filter = response => {
                        return response.author.id === message.author.id && ['y', 'n'].includes(response.content.toLowerCase());
                    };

                    message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                        .then(collected => {
                            const response = collected.first().content.toLowerCase();
                            if (response === 'y') {
                                channels.forEach(channel => channel.delete());
                                message.channel.send(`Deleted all channels named ${identifier}`);
                            } else {
                                message.channel.send('Operation cancelled.');
                            }
                        })
                        .catch(() => {
                            message.channel.send('No response received. Operation cancelled.');
                        });
                });
        } else {
            channels.forEach(channel => channel.delete());
            message.channel.send(`Deleted channel(s) with identifier ${identifier}`);
        }
    }
});

client.on('messageCreate', async message => {
    if (message.content === '>permtest') {
        const member = message.guild.members.cache.get(message.author.id);
        const permissions = member.permissions.toArray();
        const allPermissions = Object.keys(require('discord.js').PermissionsBitField.Flags);

        const permissionTest = allPermissions.map(perm => {
            return `**${perm.replace(/_/g, ' ')}:** \`${permissions.includes(perm) ? 'True' : 'False'}\``;
        }).join('\n');

        const response = `
## Permission Test
${permissionTest}
        `;
        message.channel.send(response);
    }
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('>sendmessage')) {
        const args = message.content.split(' ');
        const messageContent = args[1].replace(/_/g, ' ');
        const amount = parseInt(args[2]);
        const targetChannel = args[3] || message.channel.id;

        if (!messageContent || isNaN(amount)) {
            return message.channel.send('Invalid command usage. Correct usage: >sendmessage [Message content, using _ as spaces] [Amount of times to send] [Which channel to send it in (Channel ID or ALL, if not specified then this channel)]');
        }

        if (targetChannel.toLowerCase() === 'all') {
            message.guild.channels.cache.forEach(channel => {
                if (channel.type === ChannelType.GuildText) {
                    for (let i = 0; i < amount; i++) {
                        channel.send(messageContent);
                    }
                }
            });
        } else {
            const channel = message.guild.channels.cache.get(targetChannel);
            if (!channel || channel.type !== ChannelType.GuildText) {
                return message.channel.send('Invalid channel specified.');
            }
            for (let i = 0; i < amount; i++) {
                channel.send(messageContent);
            }
        }

        message.channel.send(`Sent message "${messageContent}" ${amount} times to ${targetChannel === 'all' ? 'all channels' : `channel ${targetChannel}`}`);
    }
});

client.on('messageCreate', async message => {
    if (message.content.startsWith('>deleteall')) {
        const args = message.content.split(' ');
        const newChannelName = args[1];

        if (!newChannelName) {
            return message.channel.send('Invalid command usage. Correct usage: >deleteall [new channel name]');
        }

        message.channel.send(`Deleted all channels and created a new channel named ${newChannelName}`);

        const deletePromises = message.guild.channels.cache.map(channel => channel.delete());
        await Promise.all(deletePromises);

        await message.guild.channels.create({
            name: newChannelName,
            type: ChannelType.GuildText
        });
    }
});

client.on('messageCreate', message => {
    if (message.content === '>help') {
        const helpMessage = `
        ## Help
        - >create [channelname] [amount] - Creates a specified number of text channels with the given name.
        - >delete [channelid OR channelname] - Deletes the specified channel by ID or name.
        - >deleteall [new channel name] - Deletes all channels and creates a new channel with the specified name.
        - >sendmessage [Message content, using _ as spaces] [Amount of times to send] [Which channel to send it in (Channel ID or ALL, if not specified then this channel)] - Sends a specified message a specified number of times to a specified channel or all channels.
        - >listchannels - Lists all channels in the server.
        - >test allowed - Tests if the user is allowed to run a command. (In the allowlist)
        - >test all - Tests if the user is allowed to run a command. (No checks)
        - >help - Displays this message.
        - >permtest - Tests all permissions that the Discord bot has.
        -# Running Atom Manager as ${client.user.username} - <@${client.user.id}>
        
        Developed by Peretas Technologies. For more information, visit: github.com/peretashacking/atom
        `;
        message.channel.send(helpMessage);
    }
});


client.login(process.env.DISCORD_TOKEN);
