const fs = require("node:fs");
const path = require("node:path");
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("@discordjs/builders");
const { ButtonStyle, AttachmentBuilder } = require("discord.js");

const photosFolderPath = path.join(__dirname, "..", "photos");
const videosFolderPath = path.join(__dirname, "..", "videos");
const botherFolderPath = path.join(__dirname, "..", "bother");

function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    }),
  );
}

function getBotherFileChoices() {
  const botherFiles = fs.readdirSync(botherFolderPath);
  const fileChoices = [];

  for (const file of botherFiles) {
    fileChoices.push(file);
  }

  return fileChoices;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bother")
    .setDescription("Mentions a random person with a random video.")
    .addUserOption((user) =>
      user
        .setName("user")
        .setDescription("If added, mentions that user instead")
        .setRequired(false),
    )
    .addStringOption((vidName) =>
      vidName
        .setName("filename")
        .setDescription("If added, gets the file by file name.")
        .setAutocomplete(true)
        .setRequired(false),
    )
    .addBooleanOption((inDMs) =>
      inDMs
        .setName("in_direct_messages")
        .setDescription("If set to true, the bot sends a DM of the bother.")
        .setRequired(false),
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = getBotherFileChoices();
    const filtered = choices.filter((choice) =>
      choice.toLowerCase().startsWith(focusedValue.toLowerCase()),
    );
    filtered.length = Math.min(filtered.length, 25);

    console.log(`suggestions: ${filtered}`);

    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice })),
    );
  },
  async execute(interaction) {
    const date = new Date();
    const currentDate = convertTZ(date, "Asia/Manila");
    const client = interaction.client;

    const botherBackButton = new ButtonBuilder()
      .setCustomId("bother_back")
      .setLabel("Bother back ⚔️")
      .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(botherBackButton);

    let user;
    do {
      if (interaction.options.getUser("user") != null) {
        user = interaction.options.getUser("user");
        break;
      }
      await interaction.guild.members.fetch();
      user = interaction.guild.members.cache.random().user;
    } while (user.bot == true || user == interaction.user);

    const sendToDms = interaction.options.getBoolean("in_direct_messages");

    if (user == client.user) {
      const botheredFilePath = path.join(photosFolderPath, "bothered.webp");
      const photo = new AttachmentBuilder(botheredFilePath);
      if (sendToDms) {
        await interaction.reply({
          content: `${interaction.user}, y u bother me`,
          files: [photo],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `${interaction.user}, y u bother me`,
          files: [photo],
        });
      }
      return;
    }

    const fileName = interaction.options.getString("filename");
    if (fileName != null) {
      try {
        const filePath = path.join(botherFolderPath, fileName);
        const file = new AttachmentBuilder(filePath);
        if (sendToDms) {
          await user.send({
            content: `${interaction.user} sent me to bother you`,
            files: [file],
          });
          await interaction.reply({
            content: `we have bothered ${user}`,
            files: [file],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `${interaction.user} has bothered ${user}!\n\nfilename: \`${fileName}\``,
            files: [file],
            components: [row],
          });
        }
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: "File does not exist.",
          ephemeral: true,
        });
      }

      return;
    }

    if (currentDate.getDay() == 3) {
      const videoFilePath = path.join(videosFolderPath, "wednesday.mp4");
      const video = new AttachmentBuilder(videoFilePath);
      if (sendToDms) {
        await user.send({
          content: `${interaction.user} reminds you that it is wednesday`,
          files: [video],
        });
        await interaction.reply({
          content: `we have told ${user} it's wednesday`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `${interaction.user} reminds u that it is wednesday ${user}`,
          files: [video],
          components: [row],
        });
      }
      return;
    }

    const botherFiles = fs.readdirSync(botherFolderPath);

    let randomIndex = -1;
    do {
      randomIndex = Math.floor(Math.random() * botherFiles.length);
    } while (client.lastIndexesOfBothers.includes(randomIndex));
    client.updateLastBotherIndex(randomIndex);

    const filePath = path.join(botherFolderPath, botherFiles[randomIndex]);
    const file = new AttachmentBuilder(filePath);
    if (sendToDms) {
      await user.send({
        content: `${interaction.user} sent me to bother you`,
        files: [file],
      });
      await interaction.reply({
        content: `we have bothered ${user}`,
        files: [file],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `${interaction.user} has bothered ${user}!\n\nfilename: \`${botherFiles[randomIndex]}\``,
        files: [file],
        components: [row],
      });
    }
  },
};
