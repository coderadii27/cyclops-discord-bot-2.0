import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('[register] DISCORD_TOKEN and DISCORD_CLIENT_ID are required.');
  process.exit(1);
}

const dir = path.join(__dirname, 'slashCommands');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

const seen = new Set();
const commands = [];
for (const file of files) {
  const mod = await import(pathToFileURL(path.join(dir, file)).href);
  const cmd = mod.default;
  if (!cmd?.data) continue;
  const json = cmd.data.toJSON();
  if (seen.has(json.name)) {
    console.warn(`[register] Skipping duplicate slash command: ${json.name}`);
    continue;
  }
  seen.add(json.name);
  commands.push(json);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);
console.log(`[register] Registering ${commands.length} slash commands globally...`);
const result = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
console.log(`[register] Registered ${Array.isArray(result) ? result.length : 0} commands.`);
process.exit(0);
