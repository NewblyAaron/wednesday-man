// Requirements
require("dotenv").config();

const fs = require("node:fs");
const Cron = require("croner");
const pg = require("pg");
const {
  Client,
  Collection,
  Intents,
  MessageAttachment,
} = require("discord.js");
const clientId = process.env.BOT_CLIENT_ID;
const token = process.env.BOT_TOKEN;

// Client Instance
const client = new Client({ intents: [new Intents(32767)] });
const dbClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

dbClient.connect();

// function for setting and deleting channel
client.setChannel = async function (guildId, channelId) {
  const query = {
    text: "INSERT INTO public.settings (guild_id, channel_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET guild_id = excluded.guild_id, channel_id = excluded.channel_id;",
    values: [guildId, channelId],
  }
  
  try {
    await dbClient.query(query);
    console.log(`Successfully set ${guildId}'s channel to ${channelId}`);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

client.delChannel = async function (guildId) {
  const query = {
    text: "DELETE FROM settings WHERE guild_id=$1",
    values: [guildId],
  }
  
  try {
    const res = await dbClient.query(query);

    if (res.rowCount == 0) {
      console.log(`${guildId} doesn't exist in table!`);
      return 0;
    }

    console.log(`Successfully deleted ${guildId} row`);
    return 1;
  } catch (err) {
    console.log(err);
    return -1;
  }
};

client.once("ready", () => {
  console.log(`Bot running as ${client.user.tag}`);

  // setup db
  dbClient.query(
    "SELECT EXISTS ( SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings' );",
    (err, res) => {
      if (err) {
        console.log("An error has occured in setting up the database!");
        console.log(err);
        return;
      }

      if (res.rows[0].exists === false) {
        console.log("Table not found. Creating one!");
        dbClient.query(
          "CREATE TABLE public.settings ( guild_id text NOT NULL, channel_id text NOT NULL, CONSTRAINT settings_pk PRIMARY KEY (guild_id));",
          (err, res) => {
            if (err) {
              console.log("An error has occured in creating the table!");
              console.log(err);
              return;
            }
          }
        );
      } else {
        console.log("Settings table exists!");
      }
    }
  );
  console.log("Database setup done!");
});

client.on("ready", async () => {
  // wednesday checker
  const itIsWednesday = Cron(
    "00 00 00 * * 3",
    { timezone: "Asia/Manila" },
    () => {
      console.log("it is now wednesday");

      dbClient.query("SELECT * FROM settings", (err, res) => {
        if (err) {
          console.log(err);
          return;
        }

        const rows = res.rows;

        rows.forEach((row) => {
          const guild = client.guilds.cache.get(row.guild_id);
          const channel = guild.channels.cache.get(row.channel_id);

          console.log(`Sending wednesday to ${guild.name} @ ${channel.name}`);
          const video = new MessageAttachment("./videos/wednesday.mp4");
          channel.send({
            content: "it is wednesday my dudes",
            files: [video],
          });
        });
      });
    }
  );
  console.log(itIsWednesday.next());
  client.cronJob = itIsWednesday;

  // for bother command
  client.lastIndexesOfBothers = new Array(30).fill(-1);
  client.updateLastBotherIndex = function (newIndex) {
    last = client.lastIndexesOfBothers;

    last.push(newIndex);
    last.shift();

    console.log(last);

    client.lastIndexesOfBothers = last;
  };
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Login to Discord
client.login(token);
