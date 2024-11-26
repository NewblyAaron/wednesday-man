const { API, TagTypes, } = require("nhentai-api");
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const nhentai_api = new API();
const wait = require("node:timers/promises").setTimeout;

async function fetchPage(interaction, sauceCode, pageNum, ephemeral_value) {
  nhentai_api
    .getBook(sauceCode)
    .then(async (book) => {
      var row;
      if (pageNum == 0) {
        row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId("previous_btn")
            .setLabel("Previous Page ⏮️")
            .setStyle("PRIMARY")
            .setDisabled(true),
          new MessageButton()
            .setCustomId("next_btn")
            .setLabel("Next Page ⏭️")
            .setStyle("PRIMARY"),
          new MessageButton()
            .setCustomId("stop_btn")
            .setLabel("Stop reading 🛑")
            .setStyle("DANGER")
        );
      } else if (pageNum + 1 == book.pages.length) {
        row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId("previous_btn")
            .setLabel("Previous Page ⏮️")
            .setStyle("PRIMARY"),
          new MessageButton()
            .setCustomId("next_btn")
            .setLabel("Next Page ⏭️")
            .setStyle("PRIMARY")
            .setDisabled(true),
          new MessageButton()
            .setCustomId("stop_btn")
            .setLabel("Stop reading 🛑")
            .setStyle("DANGER")
        );
      } else {
        row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId("previous_btn")
            .setLabel("Previous Page ⏮️")
            .setStyle("PRIMARY"),
          new MessageButton()
            .setCustomId("next_btn")
            .setLabel("Next Page ⏭️")
            .setStyle("PRIMARY"),
          new MessageButton()
            .setCustomId("stop_btn")
            .setLabel("Stop reading 🛑")
            .setStyle("DANGER")
        );
      }

      const url = nhentai_api.getImageURL(book.pages[pageNum]);
      const embed = new MessageEmbed()
        .setTitle(`Reading **${book.title.pretty}**`)
        .setFooter({ text: `Page: ${pageNum + 1}/${book.pages.length} | ${sauceCode}`})
        .setImage(url);

      await interaction.editReply({
        components: [row],
        embeds: [embed],
        ephemeral: ephemeral_value,
      });
    })
    .catch(async (err) => {
      console.log(err);

      await interaction.editReply({
        content: `Error has occurred.`,
        components: [],
        files: [],
        ephemeral: ephemeral_value,
      });

      if (!ephemeral_value) {
        await wait(5000);
        await interaction.deleteReply();
      }
    });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("readsauce")
    .setDescription("Lets you read given sauce. Use buttons to interact.")
    .addNumberOption((option) =>
      option
        .setName("code")
        .setDescription("ID of the book to read.")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("is_seen_by_others")
        .setDescription("If set to true, you can read with the boys.")
        .setRequired(false)
    ),
  async execute(interaction) {
    const client = interaction.client
    if (client.hasReadingSauce) {
      await interaction.reply({
        content: `Someone is reading! Please try again later.`,
        ephemeral: true,
      });
      return;
    }

    const sauceCode = interaction.options.getNumber("code");
    var pageNum = 0,
      pageMax = (await nhentai_api.getBook(sauceCode)).pages.length;

    const isPublic = interaction.options.getBoolean("is_seen_by_others");
    var ephemeral_value = true;
    if (!(isPublic == null)) {
      ephemeral_value = !isPublic;
    }

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("start_btn")
        .setLabel("Start ▶️")
        .setStyle("PRIMARY")
    );

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: "BUTTON",
      idle: 60000,
    });
    client.hasReadingSauce = true

    collector.on("collect", async (i) => {
      if (!(interaction.user.id === i.user.id))
        return i.reply({
          content: `Only ${interaction.user} can interact with the buttons!`,
          ephemeral: true,
        });

      if (pageNum < 0 || pageNum > pageMax) return;

      try {
        if (i.customId == "start_btn") {
          await i.deferUpdate();
          await wait(1000);
          fetchPage(i, sauceCode, pageNum, ephemeral_value);
        } else if (i.customId === "previous_btn") {
          await i.deferUpdate();
          await wait(1000);
          fetchPage(i, sauceCode, --pageNum, ephemeral_value);
        } else if (i.customId === "next_btn") {
          await i.deferUpdate();
          await wait(1000);
          fetchPage(i, sauceCode, ++pageNum, ephemeral_value);
        } else if (i.customId === "stop_btn") {
          collector.stop();
        }
      } catch (e) {
        console.log(e);
        await interaction.editReply({
          content: `Error has occurred.`,
          components: [],
          files: [],
          ephemeral: ephemeral_value,
        });

        if (!ephemeral_value) {
          await wait(5000);
          await interaction.deleteReply();
        }
      }
    });

    collector.on("end", async (collected) => {
      await interaction.editReply({
        content: `No activity detected after a minute or stopped.`,
        components: [],
        files: [],
        ephemeral: true,
      });

      if (!ephemeral_value) {
        await wait(5000);
        await interaction.deleteReply();
      }

      client.hasReadingSauce = false
    });

    await interaction.reply({
      content: `Controller: ${interaction.user}\nReading ${sauceCode}\n**WARNING:** Only run one \`/runsauce\` command at a time! Feel free to use the **Stop reading** button to read another book.\nLastly, if no interactions have happened in a minute, it will automatically stop.`,
      components: [row],
      ephemeral: ephemeral_value,
    });
  },
};
