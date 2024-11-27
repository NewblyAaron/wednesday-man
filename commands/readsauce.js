const { API } = require("nhentai-api");
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} = require("@discordjs/builders");
const { ComponentType, ButtonStyle } = require("discord.js");

const nhentai_api = new API();
const wait = require("node:timers/promises").setTimeout;

async function fetchPage(interaction, sauceCode, pageNum, ephemeral_value) {
  nhentai_api
    .getBook(sauceCode)
    .then(async (book) => {
      const prevBtn = new ButtonBuilder()
        .setCustomId("previous_btn")
        .setLabel("Previous Page ⏮️")
        .setStyle(ButtonStyle.Primary);
      const nextBtn = new ButtonBuilder()
        .setCustomId("next_btn")
        .setLabel("Next Page ⏭️")
        .setStyle(ButtonStyle.Primary);
      const stopBtn = new ButtonBuilder()
        .setCustomId("stop_btn")
        .setLabel("Stop reading 🛑")
        .setStyle(ButtonStyle.Danger);

      if (pageNum == 0) {
        prevBtn.setDisabled(true);
      } else if (pageNum + 1 == book.pages.length) {
        nextBtn.setDisabled(true);
      }

      const row = new ActionRowBuilder().addComponents(
        prevBtn,
        nextBtn,
        stopBtn,
      );

      const url = nhentai_api.getImageURL(book.pages[pageNum]);
      const embed = new EmbedBuilder()
        .setTitle(`Reading **${book.title.pretty}**`)
        .setFooter({
          text: `Page: ${pageNum + 1}/${book.pages.length} | ${sauceCode}`,
        })
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
        content: "Error has occurred.",
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
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName("is_seen_by_others")
        .setDescription("If set to true, you can read with the boys.")
        .setRequired(false),
    ),
  async execute(interaction) {
    const client = interaction.client;
    if (client.hasReadingSauce) {
      await interaction.reply({
        content: "Someone is reading! Please try again later.",
        ephemeral: true,
      });
      return;
    }

    const sauceCode = interaction.options.getNumber("code");
    const isPublic = interaction.options.getBoolean("is_seen_by_others");

    try {
      var pageNum = 0,
        pageMax = (await nhentai_api.getBook(sauceCode)).pages.length;
    } catch (e) {
      console.log(e);
      await interaction.reply({
        content: "There was an error communicating with the API.",
        ephemeral: true,
      });
      return;
    }

    let ephemeral_value = true;
    if (!(isPublic == null)) {
      ephemeral_value = !isPublic;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_btn")
        .setLabel("Start ▶️")
        .setStyle(ButtonStyle.Primary),
    );

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });
    client.hasReadingSauce = true;

    collector.on("collect", async (i) => {
      if (!(interaction.user.id === i.user.id)) {
        return i.reply({
          content: `Only ${interaction.user} can interact with the buttons!`,
          ephemeral: true,
        });
      }

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
          content: "Error has occurred.",
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

    collector.on("end", async (_) => {
      await interaction.editReply({
        content: "No activity detected after a minute or it has been stopped.",
        components: [],
        files: [],
        ephemeral: true,
      });

      client.hasReadingSauce = false;

      if (!ephemeral_value) {
        await wait(5000);
        await interaction.deleteReply();
      }
    });

    await interaction.reply({
      content: `Controller: ${interaction.user}\nReading ${sauceCode}\n**WARNING:** Only run one \`/runsauce\` command at a time! Feel free to use the **Stop reading** button to read another book.\nLastly, if no interactions have happened in a minute, it will automatically stop.`,
      components: [row],
      ephemeral: ephemeral_value,
    });
  },
};
