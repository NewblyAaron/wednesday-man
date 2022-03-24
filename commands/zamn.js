const Cron = require('croner');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('zamn')
		.setDescription('ZAMN'),
	async execute(interaction) {
        const video = new MessageAttachment('./zamn.mp4');
        await interaction.reply({ content: "ZAMN",  files: [video] });
	},
};