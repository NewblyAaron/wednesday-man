const { SlashCommandBuilder, channelMention } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unset")
    .setDescription("Unsets the channel to send to when it is wednesday"),
  async execute(interaction) {
    const client = interaction.client;
    const guildId = interaction.guildId;

    const result = await client.delChannel(guildId);
    if (result == 1) {
      await interaction.reply({
        content: "Removed set channel.",
        ephemeral: true,
      });
    } else if (result == 0) {
      await interaction.reply({ content: "No set channels.", ephemeral: true });
    } else {
      await interaction.reply({ content: "Error!", ephemeral: true });
    }
  },
};
