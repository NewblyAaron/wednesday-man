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
  DiscordAPIError,
} = require("discord.js");
const clientId = process.env.BOT_CLIENT_ID;
const token = process.env.BOT_TOKEN;

// Client Instance
const client = new Client({ intents: [new Intents(32767)] });
const dbClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

dbClient.connect();

// functions for getting and setting channels
client.getChannel = function (guildId) {
  dbClient.query(
    `SELECT channel_id FROM public.settings WHERE guild_id = '${guildId}'`,
    (err, res) => {
      if (err) {
        console.log(
          "An error has occured in getting the channel ID of a guild!"
        );
        console.log(err);
        return null;
      }

      const channelId = res.rows[0].channel_id;
      console.log(`Successfully got ${guildId}'s channel: ${channelId}`);

      return channelId;
    }
  );
};

client.setChannel = function (guildId, channelId) {
  // "INSERT OR REPLACE INTO settings (guild_id, channel_id) VALUES (@guild_id, @channel_id);"
  const sqlCommand = `INSERT INTO public.settings (guild_id, channel_id) VALUES ('${guildId}', '${channelId}') ON CONFLICT (guild_id) DO UPDATE SET guild_id = excluded.guild_id, channel_id = excluded.channel_id;`;
  dbClient.query(sqlCommand, (err, res) => {
    if (err) {
      console.log("An error has occured in setting the channel ID of a guild!");
      console.log(err);
      return false;
    }

    console.log(`Successfully set ${guildId}'s channel to ${channelId}`);
  });

  return true;
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

  // wednesday checker
  const itIsWednesday = Cron(
    "00 00 00 * * 3",
    { timezone: "Asia/Manila" },
    () => {
      console.log("it is now wednesday");
      client.guilds.cache.map((guild) => {
        try {
          const guildChannel = client.getChannel(guild.id);
          if (guildChannel == null)
            return console.log(`${guild.id} has no saved channel to send to!`);
          const channel = guild.channels.cache.get(guildChannel.channel_id);
          const video = new MessageAttachment("./videos/wednesday.mp4");
          channel.send({
            content: "it is wednesday my dudes",
            files: [video],
          });
        } catch (error) {
          console.log(`Error in ${guild.name} (${guild.id}):`);
          console.log(error);
        }
      });
    }
  );
  console.log(itIsWednesday.next());
  client.cronJob = itIsWednesday;

  // for bother command
  client.lastThreeBothers = [-1, -2, -3];
  client.updateLastThreeBothers = function (newIndex) {
    lastThree = client.lastThreeBothers;

    lastThree.push(newIndex);
    lastThree.shift();

    console.log(lastThree);

    client.lastThreeBothers = lastThree;
  };

  const itIsNotWednesdayAnymore = Cron(
    "00 00 00 * * 4",
    { timezone: "Asia/Manila" },
    () => {
      console.log("it is not wednesday anymore");
      client.guilds.cache.map((guild) => {
        try {
          const guildChannel = client.getChannel(guild.id);
          if (guildChannel == null)
            return console.log(`${guild.id} has no saved channel to send to!`);
          const channel = guild.channels.cache.get(guildChannel.channel_id);
          const photo = new MessageAttachment("./photos/n.png");
          channel.send({
            content: "it is not wednesday anymore my dudes",
            files: [photo],
          });
        } catch (error) {
          console.log(`Error in ${guild.name} (${guild.id}):`);
          console.log(error);
        }
      });
    }
  );
  console.log(itIsNotWednesdayAnymore.next());
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
