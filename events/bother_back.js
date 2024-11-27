const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  AttachmentBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const videosFolderPath = path.join(__dirname, "..", "videos");
const botherFolderPath = path.join(__dirname, "..", "bother");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId == "bother_back") {
      const botheree =
        interaction.user == interaction.message.mentions.users.first()
          ? interaction.message.mentions.users.last()
          : interaction.message.mentions.users.first();
      console.log(`i: ${interaction.user.username}, be: ${botheree.username}`);

      if (
        interaction.user != interaction.message.mentions.users.first() &&
        interaction.user != interaction.message.mentions.users.last()
      ) {
        return interaction.reply({
          content: "You're not the one who can bother back!",
          ephemeral: true,
        });
      }

      const currentDate = new Date();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("bother_back")
          .setLabel("Bother back ⚔️")
          .setStyle(ButtonStyle.Danger),
      );

      if (currentDate.getDay() == 3) {
        const videoFilePath = path.join(videosFolderPath, "wednesday.mp4");
        const video = new AttachmentBuilder(videoFilePath);
        await interaction.reply({
          content: `${interaction.user} reminds u that it is wednesday ${botheree}`,
          files: [video],
          components: [row],
        });
        return;
      }

      const client = interaction.client;
      const botherFiles = fs.readdirSync(botherFolderPath);
      let randomIndex = -1;
      do {
        randomIndex = Math.floor(Math.random() * botherFiles.length);
      } while (client.lastIndexesOfBothers.includes(randomIndex));
      client.updateLastBotherIndex(randomIndex);
      const filePath = path.join(botherFolderPath, botherFiles[randomIndex]);
      const file = new AttachmentBuilder(filePath);

      await interaction.reply({
        content: `${interaction.user} has bothered ${botheree} back!`,
        files: [file],
        components: [row],
      });
    }
  },
};
