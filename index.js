// index.js

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { downloadTikTok, getRandomTikToks } = require('./tiktok');
const { prefix } = require('./config');
const fs = require('fs');
const pino = require('pino');

// Start the bot
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || !msg.key.fromMe && msg.key.remoteJid === 'status@broadcast') return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (!text.startsWith(prefix)) return;

        const command = text.slice(1).split(' ')[0].toLowerCase();
        const args = text.split(' ').slice(1);

        try {
            if (command === 'tiktok') {
                if (args.length === 0) {
                    await sock.sendMessage(sender, { text: 'Please provide a TikTok URL.\nExample: .tiktok https://www.tiktok.com/@username/video/12345' });
                    return;
                }
                const url = args[0];
                const videoUrl = await downloadTikTok(url);

                const videoBuffer = await (await fetch(videoUrl)).arrayBuffer();
                await sock.sendMessage(sender, { video: Buffer.from(videoBuffer), mimetype: 'video/mp4' });
            }

            if (command === 'tiktokrandom') {
                const videos = await getRandomTikToks(5);
                for (const videoUrl of videos) {
                    const videoBuffer = await (await fetch(videoUrl)).arrayBuffer();
                    await sock.sendMessage(sender, { video: Buffer.from(videoBuffer), mimetype: 'video/mp4' });
                }
            }
        } catch (error) {
            console.error(error);
            await sock.sendMessage(sender, { text: '❌ Error processing your request. Try again later.' });
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot connected');
        }
    });
}

startBot();
