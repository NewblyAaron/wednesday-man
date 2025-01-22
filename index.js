// Run a web server for Koyeb
const express = require("express");
const app = express();
const port = 8000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});

// discord.js dependencies
require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const Cron = require("croner");
const pg = require("pg");
const {
  Client,
  Collection,
  GatewayIntentBits,
  AttachmentBuilder,
} = require("discord.js");

// postgresql database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL + "?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

// discord.js bot
const token = process.env.BOT_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// track if someone is using /readsauce
client.hasReadingSauce = false;

// for bother command:
// do not repeat the same video from the past 100 videos
client.lastIndexesOfBothers = new Array(100).fill(-1);
client.updateLastBotherIndex = function (newIndex) {
  client.lastIndexesOfBothers.push(newIndex);
  client.lastIndexesOfBothers.shift();

  console.log(client.lastIndexesOfBothers);
};

// function for setting and deleting channel to send wednesday
client.setChannel = async function (guildId, channelId) {
  const query = {
    text: "INSERT INTO public.settings (guild_id, channel_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET guild_id = excluded.guild_id, channel_id = excluded.channel_id;",
    values: [guildId, channelId],
  };

  try {
    const dbClient = await pool.connect();
    await dbClient.query(query);
    console.log(`Successfully set ${guildId}'s channel to ${channelId}`);
    dbClient.release(true);
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
  };

  try {
    const dbClient = await pool.connect();
    const res = await dbClient.query(query);

    if (res.rowCount == 0) {
      console.log(`${guildId} doesn't exist in table!`);
      return 0;
    }

    console.log(`Successfully deleted ${guildId} row`);
    dbClient.release(true);
    return 1;
  } catch (err) {
    console.log(err);
    return -1;
  }
};

// setup db
client.setupDb = async function () {
  try {
    const dbClient = await pool.connect();

    // setup settings
    const settingsResponse = await dbClient.query(
      "SELECT EXISTS ( SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings' );"
    );

    if (settingsResponse.rows[0].exists === false) {
      console.log("Settings table not found. Creating one!");
      await dbClient.query(
        "CREATE TABLE public.settings ( guild_id text NOT NULL, channel_id text NOT NULL, CONSTRAINT settings_pk PRIMARY KEY (guild_id));"
      );
    }

    // setup nword counter
    const nwordCounterResponse = await dbClient.query(
      "SELECT EXISTS ( SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'nword_counter' );"
    );

    if (nwordCounterResponse.rows[0].exists === false) {
      console.log("N-word counter table not found. Creating one!");
      await dbClient.query(
        "CREATE TABLE public.nword_counter ( user_id text NOT NULL, count int NOT NULL, CONSTRAINT nword_counter_pk PRIMARY KEY (user_id));"
      );
    }

    dbClient.release();
    console.log("Database setup done!")
  } catch (err) {
    console.log("Error occured during database setup!");
    console.log(err);
  }
};

// setup wednesday cron job
client.setupWednesdayCron = async function () {
  const itIsWednesday = Cron(
    "00 00 00 * * 3",
    { timezone: "Asia/Manila" },
    async () => {
      console.log("it is now wednesday");
      try {
        const dbClient = await pool.connect();
        const res = await dbClient.query("SELECT * FROM setttings");

        await client.guilds.fetch();
        await Promise.all(res.rows.map(async (row) => {
          const guild = client.guilds.cache.get(row.guild_id);
          await guild.channels.fetch();

          const channel = guild.channels.cache.get(row.channel_id);
          const wednesdayVideoPath = path.join(
            __dirname,
            "videos",
            "wednesday.mp4"
          );
          const video = new AttachmentBuilder(wednesdayVideoPath);

          console.log(`Sending wednesday to ${guild.name} @ ${channel.name}`);
          await channel.send({
            content: "it is wednesday my dudes",
            files: [video],
          });
        }));

        console.log("sent all wednesday messages!");
        dbClient.release();
      } catch (err) {
        console.log("error sending wednesday message");
        console.log(err);
      }
    },
  );
  client.cronJob = itIsWednesday;

  console.log(`Next Wednesday: ${itIsWednesday.next()}`);
};

// setup slash commands
client.commands = new Collection();

const commandFolderPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandFolderPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  console.log(`loading command ${file}`);
  const filePath = path.join(commandFolderPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

// setup events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  console.log(`loading event ${file}`);
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Login to Discord
client.login(token);
