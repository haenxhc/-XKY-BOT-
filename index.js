const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } = require("@adiwajshing/baileys");
const P = require('pino');
const config = require('./config');

const commands = require('./commands'); // fichier qui exporte toutes tes commandes

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    version,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close') {
      if((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot();
      } else {
        console.log('Déconnecté, reconnecte manuellement.');
      }
} else if(connection === 'open') {
      console.log('Connecté au serveur WhatsApp');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return;
    const msg = messages[0];
    if(!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    let body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if(!body.startsWith(config.PREFIX)) return;

    const args = body.slice(config.PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command = commands.find(c => c.name === cmdName);
    if(command) {
      try {
        await command.execute(sock, msg, args);
      } catch (e) {
        console.error(e);
        await sock.sendMessage(sender, { text: 'Erreur lors de l’exécution de la commande.' });
      }
    }
  });
}
startBot();
*commands/index.js* (exemple de loader de commandes) :  
const fs = require('fs');
const path = require('path');

let commands = [];

const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for(const file of commandFiles) {
  const command = require(path.join(__dirname, file));
  commands.push(command);
}

module.exports = commands;
