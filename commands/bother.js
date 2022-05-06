const fs = require('node:fs');
const path = require('node:path');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bother')
        .setDescription('Mentions a random person with a random video.')
        .addUserOption(user =>
            user.setName('user')
                .setDescription('If added, mentions that user instead')
                .setRequired(false)
        )
        .addStringOption(vidName =>
            vidName.setName('video_filename')
                .setDescription("If added, gets the video given by the filename.")
                .setRequired(false)
        )
        .addBooleanOption(inDMs =>
            inDMs.setName('in_direct_messages')
                .setDescription("If set to true, the bot sends a DM of the bother.")
                .setRequired(false)
        ),
    async execute(interaction) {
        const date = new Date();
        const currentDate = convertTZ(date, "Asia/Manila");
        const client = interaction.client;

        var user;
        do {
            if (!(interaction.options.getUser('user') == null)) {
                user = interaction.options.getUser('user');
                break;
            }
            user = interaction.guild.members.cache.random().user;
        } while (user.bot == true)

        const sendToDms = interaction.options.getBoolean('in_direct_messages');

        if (user == client.user) {
            const photo = new MessageAttachment('./photos/bothered.webp');
            if (sendToDms) {
                await interaction.reply({ content: `${interaction.user}, y u bother me`, files: [photo], ephemeral: true });
            } else {
                await interaction.reply({ content: `${interaction.user}, y u bother me`, files: [photo] });
            }
            return;
        }

        const vidFilename = interaction.options.getString('video_filename');
        if (!(vidFilename == null)) {
            try {
                const video = `./bother/${vidFilename}`;
                const file = new MessageAttachment(video);
                if (sendToDms) {
                    await user.send({ content: `${user}`, files: [file] });
                    await interaction.reply({ content: `we have bothered ${user}`, files: [file], ephemeral: true });
                } else {
                    await interaction.reply({ content: `${user}`, files: [file] });
                }
            } catch (err) {
                console.log(err);
                await interaction.reply({ content: `Video does not exist.`, ephemeral: true });
            }

            return;
        }

        if (currentDate.getDay() == 3) {
            const video = new MessageAttachment('./videos/wednesday.mp4');
            if (sendToDms) {
                await user.send({ content: `it is wednesday ${user}`, files: [video] });
                await interaction.reply({ content: `we have told ${user} it's wednesday`, files: [file], ephemeral: true });
            } else {
                await interaction.reply({ content: `it is wednesday ${user}`, files: [video] });
            }
            return;
        }

        const media = fs.readdirSync('./bother');
        var randomIndex = -1;
        do {
            randomIndex = Math.floor(Math.random() * media.length);
        } while (client.lastIndexesOfBothers.includes(randomIndex))
        client.updateLastBotherIndex(randomIndex);

        const video = `./bother/${media[randomIndex]}`;
        const file = new MessageAttachment(video);
        if (sendToDms) {
            await user.send({ content: `${user}`, files: [file] });
            await interaction.reply({ content: `we have bothered ${user}`, files: [file], ephemeral: true });
        } else {
            await interaction.reply({ content: `${user}`, files: [file] });
        }
    },
};