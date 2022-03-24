const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token } = require('./config.json');
const guildId = '761805649604378644';

const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
    .then(data => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        console.log('Successfully deleted all application commands.')
        return Promise.all(promises);
    });
