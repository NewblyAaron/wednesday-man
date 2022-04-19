const fs = require('node:fs');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bother')
		.setDescription('Mentions a random person with a random video.')
        .addUserOption(user => 
            user.setName('user')
                .setDescription('If added, mentions that user instead')
                .setRequired(false)
        ),
	async execute(interaction) {
        const client = interaction.client;
        var user;
        do {
            if (!(interaction.options.getUser('user') == null)) {
                user = interaction.options.getUser('user');
                break;
            }
            user = interaction.guild.members.cache.random().user;
        } while (user.bot == true)

        const media = fs.readdirSync('./bother');
        var randomIndex = -1;
        do {
            randomIndex = Math.floor(Math.random() * media.length);
        } while (client.lastThreeBothers.includes(randomIndex))
        client.updateLastThreeBothers(randomIndex);

        const video = media[randomIndex];
        const file = new MessageAttachment(video);
        await interaction.reply({content: `${user}`, files: [file]});
	},
};