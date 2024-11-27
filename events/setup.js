const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    await client.setupDb();
    await client.setupWednesdayCron();

    console.log(`Bot ready! Logged in as ${client.user.tag}`);
  },
};
