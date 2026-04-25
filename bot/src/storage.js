import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const cache = new Map();
const writeLocks = new Map();

function defaultGuildData() {
  return {
    modLogChannelId: null,
    warnings: {},
    afk: {},
    sticky: {},
    messageCounts: {},
    greet: null,
    greetDm: null,
    giveaways: {},
    tournaments: {},
    tournamentCategories: {},
    tournamentModRoleId: null,
    idpAccessRoleId: null,
    helpDeskChannelId: null,
    slotManagerChannelId: null,
    slotListChannelId: null,
    idpChannelId: null,
    ticket: null,
    tickets: {},
  };
}

function fileFor(guildId) {
  return path.join(DATA_DIR, `${guildId}.json`);
}

export function getGuildData(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);
  const file = fileFor(guildId);
  let data;
  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      data = defaultGuildData();
    }
    const def = defaultGuildData();
    for (const k of Object.keys(def)) {
      if (!(k in data)) data[k] = def[k];
    }
  } else {
    data = defaultGuildData();
  }
  cache.set(guildId, data);
  return data;
}

export async function saveGuildData(guildId) {
  const data = cache.get(guildId);
  if (!data) return;
  const file = fileFor(guildId);
  const prev = writeLocks.get(guildId) ?? Promise.resolve();
  const next = prev.then(() => fs.promises.writeFile(file, JSON.stringify(data, null, 2)));
  writeLocks.set(guildId, next.catch(() => {}));
  await next;
}

export function updateGuild(guildId, updater) {
  const data = getGuildData(guildId);
  updater(data);
  return saveGuildData(guildId);
}
