// Requirements
require("dotenv").config();

const fs = require("node:fs");
const Cron = require("croner");
const pg = require("pg");
const {
  Client, Collection, Intents,
  MessageAttachment, MessageActionRow, MessageButton, MessageEmbed
} = require("discord.js");

const clientId = process.env.BOT_CLIENT_ID;
const token = process.env.BOT_TOKEN;

// Client Instance
const client = new Client({ intents: [new Intents(gi)] });

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
              console.log("An error has occured in creating the settings table!");
              console.log(err);
              return;
            }
          }
        );
		dbClient.query(
          "CREATE TABLE public.nword_counter ( user_id text NOT NULL, count int NOT NULL, CONSTRAINT nword_counter_pk PRIMARY KEY (user_id));",
          (err, res) => {
            if (err) {
              console.log("An error has occured in creating the nword counter table!");
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

			try {
				console.log(`Sending wednesday to ${guild.name} @ ${channel.name}`);
				const video = new MessageAttachment("./videos/wednesday.mp4");
				channel.send({
					content: "it is wednesday my dudes",
					files: [video],
				});
			} catch (err) {
				console.log(`error sending to ${guild.name}`);
				console.log(err);
			}
          
        });
      });
    }
  );
  console.log(itIsWednesday.next());
  client.cronJob = itIsWednesday;
  /* 10:49pm cron
  const evening10_49 = Cron("00 49 22 * * *", { timezone: "Asia/Manila" }, () => {
	  console.log("it is now evening, 10:49pm");

      dbClient.query("SELECT * FROM settings", (err, res) => {
        if (err) {
          console.log(err);
          return;
        }

        const rows = res.rows;

        rows.forEach((row) => {
			const guild = client.guilds.cache.get(row.guild_id);
			const channel = guild.channels.cache.get(row.channel_id);
			
			try {
				console.log(`good evening, it's 10:49pm to ${guild.name} @ ${channel.name}`);
				const video = new MessageAttachment("./videos/10_49pm.mp4");
				channel.send({
					content: "what's up guys, uhh, good evening and shit. it's like 10:49pm",
					files: [video],
				});
			} catch (err) {
				console.log(`error sending to ${guild.name}`);
				console.log(err);
			}
        });
      });
  });
  */
  // for bother command
  client.lastIndexesOfBothers = new Array(50).fill(-1);
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId == "bother_back") {
	  var botheree = (interaction.user == interaction.message.mentions.users.first()) ? interaction.message.mentions.users.last() : interaction.message.mentions.users.first();
	  console.log(`i: ${interaction.user.username}, be: ${botheree.username}`);
	  
	  if (interaction.user != interaction.message.mentions.users.first() && interaction.user != interaction.message.mentions.users.last()) {
		  return interaction.reply({ content: `You're not the one who can bother back!`, ephemeral: true });
	  }
	  
	  const currentDate = new Date();
	  if (currentDate.getDay() == 3) {
          const video = new MessageAttachment('./videos/wednesday.mp4');
          await interaction.reply({ content: `${interaction.user} reminds u that it is wednesday ${botheree}`, files: [video], components: [row] });
          return;
      }
	  
	  const media = fs.readdirSync('./bother');
      var randomIndex = -1;
      do {
          randomIndex = Math.floor(Math.random() * media.length);
      } while (client.lastIndexesOfBothers.includes(randomIndex))
      client.updateLastBotherIndex(randomIndex);
      const video = `./bother/${media[randomIndex]}`;
	  
      const file = new MessageAttachment(video);
	  const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('bother_back')
                    .setLabel('Bother back ⚔️')
                    .setStyle('DANGER'),
            );
	  
      await interaction.reply({ content: `${interaction.user} has bothered ${botheree} back!`, files: [file], components: [row] });
  }
});

client.on("messageCreate", async (message) => {
	// tower of fantasy
	
	function tofCheck(string) {
		const tower_regex = new RegExp(/(tower)/gmi);
		const of_regex = new RegExp(/(of)/gmi);
		const fantasy_regex = new RegExp(/(fantasy)/gmi);
		
		return (tower_regex.test(string.replace(/\s*/gmi, "")) && of_regex.test(string.replace(/\s*/gmi, "")) && fantasy_regex.test(string.replace(/\s*/gmi, ""))) ? true : false
	}

	if (tofCheck(message.content) && message.author != client.user) {
		console.log(`${message.author.username} has said tower of fantasy lmao`);
		const file = new MessageAttachment('./photos/tower_of_fantasy.jpg');
		message.channel.send({ content: `tower of fantasy`, files: [file] });
	}
});

client.on("messageCreate", async (message) => {
	// nigg counter
	
	function nwordCheck(string) {
		const n1 = new RegExp(/(nigga)/gmi);
		const n2 = new RegExp(/(nigger)/gmi);
		
		return (n1.test(string.replace(/\s*/gmi, "")) || n2.test(string.replace(/\s*/gmi, ""))) ? true : false
	}

	if (nwordCheck(message.content) && message.author != client.user) {
		console.log(`${message.author.username} is racist`);
		const file = new MessageAttachment('./photos/n.png');
		message.channel.send({ content: `what'chu just say???`, files: [file] });
	}
});

// client.on("messageCreate", async (message) => {
// 	// carlosgoddy counter
	
// 	function imCheck(string) {
// 		const command = new RegExp(/(\$im)/gmi);
// 		const carlos = new RegExp(/(carlos)/gmi);

// 		return (command.test(string.replace(/\s*/gmi, "")) && carlos.test(string.replace(/\s*/gmi, ""))) ? true : false;
// 	}
	
// 	function imCheckGoddy(string) {
// 		const command = new RegExp(/(\$im)/gmi);
// 		const godwin = new RegExp(/(godwin)/gmi);

// 		return (command.test(string.replace(/\s*/gmi, "")) && godwin.test(string.replace(/\s*/gmi, ""))) ? true : false;
// 	}

// 	if (imCheck(message.content) && message.author != client.user) {
// 		const imEmbed = new MessageEmbed()
// 			.setColor(0xFF9C2C)
// 			.setTitle("Carlos Miguel Barrios")
// 			.setDescription("Carlos Miguel Barrios :male_sign:\n*Animanigga roulette* · **69**:tokyo_tower:\nClaim Rank: #5\nLike Rank: #371221\nI AM THE NI- (+28)")
// 			.setImage("https://cdn.discordapp.com/attachments/935186731047739415/1021450149773447168/tower_of_fantasy.jpg")
// 			.setFooter({ text: "1 / 1" });
// 		message.channel.send({ embeds: [imEmbed] });
// 	} else if (imCheckGoddy(message.content) && message.author != client.user) {
// 		const imEmbed = new MessageEmbed()
// 			.setColor(0xFF9C2C)
// 			.setTitle("Godwin Manzanilla")
// 			.setDescription("Godwin Manzanilla :male_sign:\n*Animanigga roulette* · **69**:dark_sunglasses:\nClaim Rank: #9\nLike Rank: #13789\n:sunglasses: (+8)")
// 			.setImage("https://cdn.discordapp.com/attachments/761805649604378647/1021452687595806840/godd8.png")
// 			.setFooter({ text: "1 / 1" });
// 		message.channel.send({ embeds: [imEmbed] });
// 	}
// });

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
