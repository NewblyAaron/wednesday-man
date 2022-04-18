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
        var user;
        do {
            if (!(interaction.options.getUser('user') == null)) {
                user = interaction.options.getUser('user');
                break;
            }
            user = interaction.guild.members.cache.random().user;
        } while (user.bot == true)
        const randomvids = [
            './videos/car_scare.mp4', './videos/deltarune.mp4', './videos/deploy_freddy.mp4', 
            './videos/table_scare.mp4', './videos/segs.mp4', './videos/tumingin.mp4', './videos/nike.mp4', 
			'./videos/deadbydaylight.mp4', './videos/sinkomomentos.mp4', './videos/platinum.mp4', 
			'./videos/horsecat.mp4', './videos/plane.mp4', './videos/turbo.mp4', './videos/dora.mp4'
        ];
        const video = randomvids[Math.floor(Math.random() * randomvids.length)];
        const file = new MessageAttachment(video);
        await interaction.reply({content: `${user}`, files: [file]});
	},
};