const { SlashCommandBuilder, channelMention } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unset')
		.setDescription('Unsets the channel to send to when it is wednesday'),
	async execute(interaction) {
		const client = interaction.client;
		const guildId = chosenChannel.guildId;

		if (client.delChannel(guildId)) {
			await interaction.reply({ content: `Removed set channel.`, ephemeral: true });
		} else {
			await interaction.reply({ content: `Error!`, ephemeral: true });
		}
	},
};