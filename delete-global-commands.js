require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const token = process.env.BOT_TOKEN;
const clientId = process.env.BOT_CLIENT;

const commands = [];
const commandFolderPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandFolderPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandFolderPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(
      `Started deleting ${commands.length} application (/) commands.`,
    );

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] },
    );

    console.log(
      `Successfully deleted application (/) commands.`,
    );
  } catch (e) {
    console.error(e);
  }
})();
