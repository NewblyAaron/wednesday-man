const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const token = 'OTQ5MjEyNDk3MDk1ODQzODgy.YiHFBg.7-kOxp6GTqXedbSBLo39D3NwfJg';
const clientId = '949212497095843882';
    
const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationCommands(clientId))
    .then(data => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        console.log('Successfully deleted all application commands.')
        return Promise.all(promises);
    });
