const { API, TagTypes, } = require('nhentai-api');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const nhentai_api = new API();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sauce')
		.setDescription('Generates a random nhentai link and sends it to you.')
        .addNumberOption(option =>
            option.setName('code')
                .setDescription('If added, tries to fetch the nhentai link instead.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('is_seen_by_others')
                .setDescription('If set to true, sends the link publicly instead.')
                .setRequired(false)),
	async execute(interaction) {
        console.log(`${interaction.user.tag} wanted some sauce lol`);

        const isPublic = interaction.options.getBoolean('is_seen_by_others');
        var ephemeral_value = true;
        if (!(isPublic == null)) {
            ephemeral_value = !isPublic;
        }

        const sauceCode = interaction.options.getNumber('code');
        var embed, sauceUrl;
        if (!(sauceCode == null)) {
            await nhentai_api.getBook(sauceCode)
                .then(book => {
                    sauceUrl = `https://nhentai.net/g/${book.id}`;
                    embed = new MessageEmbed()
                        .setTitle(book.title.pretty)
                        .setURL(sauceUrl)
                        .setDescription(`${book.id} | Pages: ${(book.pages.length + 1)}`)
                        .setThumbnail(nhentai_api.getImageURL(book.cover))
                        .addFields(
                            { name: 'English Name', 
                            value: ((book.title.english === "") ? "N/A" : book.title.english) },
                            { name: 'Japanese Name', 
                            value: ((book.title.japanese === "") ? "N/A" : book.title.japanese) },
                            { name: 'Tags', value: book.tags.toString() }
                        );
                })
                .catch(console.log);

            await interaction.reply({ embeds: [embed], ephemeral: ephemeral_value });
            return;
        }
        await nhentai_api.getRandomBook()
            .then(book => {
                sauceUrl = `https://nhentai.net/g/${book.id}`;
                embed = new MessageEmbed()
                    .setTitle(book.title.pretty)
                    .setURL(sauceUrl)
                    .setDescription(`${book.id} | Pages: ${(book.pages.length + 1)}`)
                    .setThumbnail(nhentai_api.getImageURL(book.cover))
                    .addFields(
                        { name: 'English Name', 
                        value: ((book.title.english === "") ? "N/A" : book.title.english) },
                        { name: 'Japanese Name', 
                        value: ((book.title.japanese === "") ? "N/A" : book.title.japanese) },
                        { name: 'Tags', value: book.tags.toString() }
                    );
            });

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel('Read in browser')
                        .setStyle('LINK')
                        .setURL(sauceUrl),
                );

		await interaction.reply({ embeds: [embed], components: [row], ephemeral: ephemeral_value });
	},
};