const Cron = require('croner');
const { MessageAttachment } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wednesday')
		.setDescription('Checks if it\'s Wednesday.')
        .addBooleanOption(option =>
            option.setName('always_wednesday')
                .setDescription('Replies like it is a Wednesday, regardless of the current day of the week.')
                .setRequired(false)),
	async execute(interaction) {
        const date = new Date();
        const currentDate = convertTZ(date, "Asia/Manila");
        const client = interaction.client;
        const cronJob = client.cronJob;
        const nextDate = cronJob.next();
        console.log(`Current date and time: ${date.toUTCString()}\nConverted date to timezone: ${currentDate.toUTCString()}\nNext date and time to run Wednesday: ${nextDate}`);

        if (currentDate.getDay() == 3 || interaction.options.getBoolean('always_wednesday')) {
            const video = new MessageAttachment('./videos/wednesday.mp4');
            await interaction.reply({ content: "it is wednesday my dudes",  files: [video] });
        } else {
            await interaction.reply({ content: 'it\'s not a wednesday', ephemeral: true });
        }
	},
};