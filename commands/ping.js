const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    const number = Math.floor(Math.random() * 100) + 1;
    console.log(number);
    if (number == 1) {
      console.log(`${interaction.user} is a lucky man`);
      await interaction.reply({
        content: `eyo ${interaction.user} you found a lucky easter egg`,
      });
      return;
    }

    await interaction.reply({ content: "Pong!", ephemeral: true });
  },
};
