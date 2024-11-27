const Cron = require("croner");
const { AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    }),
  );
}

module.exports = {
  data: new SlashCommandBuilder().setName("zamn").setDescription("ZAMN"),
  async execute(interaction) {
    const zamnVideoPath = path.join(__dirname, "..", "videos", "zamn.mp4");
    const video = new AttachmentBuilder(zamnVideoPath);
    await interaction.reply({ content: "ZAMN", files: [video] });
  },
};
