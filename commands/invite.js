const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription(
      "Want this bot? Execute this command and it'll give you a link to invite it!",
    ),
  async execute(interaction) {
    const button = new ButtonBuilder()
      .setLabel("Invite Bot")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/api/oauth2/authorize?client_id=949212497095843882&permissions=412384357440&scope=bot%20applications.commands",
      );
    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: "Click the button to invite the bot to your server!",
      components: [row],
      ephemeral: true,
    });
  },
};
