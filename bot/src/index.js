import { Client, GatewayIntentBits, Partials, Collection, ActivityType, Events, PresenceUpdateStatus } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PREFIX } from './config.js';
import { handleMessage } from './events/messageCreate.js';
import { handleInteraction } from './events/interactionCreate.js';
import { handleGuildMemberAdd } from './events/guildMemberAdd.js';
import { startReady } from './events/ready.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DISCORD_TOKEN) {
  console.error('[FATAL] DISCORD_TOKEN env var is required.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User, Partials.GuildMember],
  presence: {
    status: PresenceUpdateStatus.DoNotDisturb,
    activities: [{ name: 'Booting CYCLOPS...', type: ActivityType.Watching }],
  },
});

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

async function loadCommands(dir, collection) {
  const abs = path.join(__dirname, dir);
  if (!fs.existsSync(abs)) return;
  const files = fs.readdirSync(abs).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(abs, file)).href);
    const cmd = mod.default;
    if (!cmd?.name) continue;
    collection.set(cmd.name.toLowerCase(), cmd);
    if (cmd.aliases) for (const a of cmd.aliases) collection.set(a.toLowerCase(), cmd);
  }
}

await loadCommands('commands', client.prefixCommands);
await loadCommands('slashCommands', client.slashCommands);

console.log(`[BOOT] Loaded ${new Set(client.prefixCommands.values()).size} prefix commands`);
console.log(`[BOOT] Loaded ${new Set(client.slashCommands.values()).size} slash commands`);

client.on(Events.ClientReady, async (c) => {
  console.log(`[READY] Logged in as ${c.user.tag}`);
  startReady(c);

  if (process.env.DISCORD_CLIENT_ID) {
    try {
      const { REST, Routes } = await import('discord.js');
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      const seen = new Set();
      const json = [];
      for (const cmd of new Set(client.slashCommands.values())) {
        if (!cmd.data) continue;
        const data = cmd.data.toJSON();
        if (seen.has(data.name)) continue;
        seen.add(data.name);
        json.push(data);
      }
      const result = await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: json });
      console.log(`[READY] Registered ${Array.isArray(result) ? result.length : 0} slash commands.`);
    } catch (e) {
      console.error('[READY] Slash registration failed:', e.message);
    }
  }
});

client.on(Events.MessageCreate, (msg) => handleMessage(msg, client).catch((e) => console.error('[messageCreate]', e)));
client.on(Events.InteractionCreate, (interaction) => handleInteraction(interaction, client).catch((e) => console.error('[interactionCreate]', e)));
client.on(Events.GuildMemberAdd, (member) => handleGuildMemberAdd(member, client).catch((e) => console.error('[guildMemberAdd]', e)));

client.on(Events.Error, (err) => console.error('[client error]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

console.log(`[BOOT] Connecting with prefix "${PREFIX}"...`);
await client.login(process.env.DISCORD_TOKEN);
