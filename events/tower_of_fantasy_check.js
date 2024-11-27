const { Events, AttachmentBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const photosFolderPath = path.join(__dirname, "..", "photos");

function tofCheck(string) {
  string = string.toLowerCase();
  const tower_regex = new RegExp(/(tower)/gim);
  const of_regex = new RegExp(/(of)/gim);
  const fantasy_regex = new RegExp(/(fantasy)/gim);

  return (
    tower_regex.test(string.replace(/\s*/gim, "")) &&
    of_regex.test(string.replace(/\s*/gim, "")) &&
    fantasy_regex.test(string.replace(/\s*/gim, ""))
  );
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (tofCheck(message.content) && message.author != message.client.user) {
      console.log(`${message.author.username} has said tower of fantasy lmao`);
      const tofPhotoPath = path.join(photosFolderPath, "tower_of_fantasy.jpg");
      const file = new AttachmentBuilder(tofPhotoPath);
      message.channel.send({ content: "tower of fantasy", files: [file] });
    }
  },
};
