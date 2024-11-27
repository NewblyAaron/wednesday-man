const { Events, AttachmentBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const photosFolderPath = path.join(__dirname, "..", "photos");

function nwordCheck(string) {
  string = string.toLowerCase();
  const n1 = new RegExp(/(nigga)/gim);
  const n2 = new RegExp(/(nigger)/gim);

  return (
    n1.test(string.replace(/\s*/gim, "")) ||
    n2.test(string.replace(/\s*/gim, ""))
  );
}

// TODO: nword counter lol
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (nwordCheck(message.content) && message.author != message.client.user) {
      console.log(`${message.author.username} is racist`);
      const nwordFilePath = path.join(photosFolderPath, "n.png");
      const file = new AttachmentBuilder(nwordFilePath);
      message.channel.send({ content: "what'chu just say???", files: [file] });
    }
  },
};
