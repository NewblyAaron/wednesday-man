const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isAutocomplete()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    console.log(`sending autocomplete suggestions...`);

    try {
      await command.autocomplete(interaction);
    } catch (e) {
      console.error(e);
    }
  },
};
