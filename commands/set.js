const { SlashCommandBuilder, channelMention } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set")
    .setDescription("Sets the channel to send to when it is wednesday")
    .addChannelOption((channelMention) =>
      channelMention
        .setName("channel")
        .setDescription("The channel to send to when it is wednesday")
        .setRequired(true),
    ),
  async execute(interaction) {
    const client = interaction.client;
    const chosenChannel = interaction.options.getChannel("channel");
    const channelId = chosenChannel.id;
    const guildId = chosenChannel.guildId;

    if (await client.setChannel(guildId, channelId)) {
      await interaction.reply({
        content: `Set the channel to ${chosenChannel}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({ content: "Error!", ephemeral: true });
    }
  },
};
