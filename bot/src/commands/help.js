import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { COLORS, PREFIX } from '../config.js';
import { brandedFooter } from '../utils/embeds.js';

const SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    emoji: '🏠',
    description: 'Welcome to CYCLOPS — start here.',
  },
  {
    id: 'mod',
    label: 'Moderation',
    emoji: '🛡️',
    description: 'Ban, kick, mute, warn, and more.',
  },
  {
    id: 'channel',
    label: 'Channel Tools',
    emoji: '🧹',
    description: 'Lock, purge, sticky, nuke, say.',
  },
  {
    id: 'utility',
    label: 'Utility',
    emoji: '🔧',
    description: 'AFK, ping, nicknames, message count.',
  },
  {
    id: 'community',
    label: 'Community',
    emoji: '🎉',
    description: 'Greet, giveaways, memes, info.',
  },
  {
    id: 'tickets',
    label: 'Tickets',
    emoji: '🎫',
    description: 'Support ticket system.',
  },
  {
    id: 'tournament',
    label: 'Tournaments',
    emoji: '🏆',
    description: 'Full tournament & registration suite.',
  },
  {
    id: 'admin',
    label: 'Admin / Owner',
    emoji: '⚙️',
    description: 'Sync commands & advanced controls.',
  },
];

function divider() {
  return '━━━━━━━━━━━━━━━━━━━━━━━';
}

function fmt(rows) {
  return rows.map(([cmd, desc]) => `\`${cmd}\` — ${desc}`).join('\n');
}

function baseEmbed(client) {
  return new EmbedBuilder()
    .setColor(COLORS.PURPLE)
    .setAuthor({
      name: `${client.user.username} • Command Center`,
      iconURL: client.user.displayAvatarURL(),
    })
    .setFooter(brandedFooter(client))
    .setTimestamp();
}

export function buildHelpEmbed(section, client, guild) {
  const e = baseEmbed(client);

  if (section === 'overview') {
    return e
      .setTitle('🤖  CYCLOPS — Automate Your Tournaments')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setDescription(
        `> *An all-in-one esports management bot — moderation, tickets, giveaways, and full tournament automation.*\n\n` +
        `${divider()}\n` +
        `**📌 Prefix:** \`${PREFIX}\`  •  **Slash:** \`/\`\n` +
        `**🏷️ Use the menu below** to browse commands by category.\n` +
        `${divider()}`,
      )
      .addFields(
        {
          name: '📊 Stats',
          value:
            `> **Servers:** \`${client.guilds.cache.size}\`\n` +
            `> **Members:** \`${client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0)}\`\n` +
            `> **Ping:** \`${Math.max(0, client.ws.ping)}ms\``,
          inline: true,
        },
        {
          name: '🧰 Modules',
          value:
            '> 🛡️ Moderation\n' +
            '> 🎫 Tickets\n' +
            '> 🏆 Tournaments\n' +
            '> 🎉 Giveaways · Greet',
          inline: true,
        },
        {
          name: '🔗 Quick Start',
          value:
            `> \`${PREFIX}setup\` → setup tournament roles\n` +
            `> \`${PREFIX}t\` → open tournament panel\n` +
            `> \`/ticketsetup\` → setup tickets\n` +
            `> \`/modlog\` → bind mod-log channel`,
          inline: false,
        },
      );
  }

  if (section === 'mod') {
    return e.setTitle('🛡️  Moderation').setDescription(
      `${divider()}\n` +
      fmt([
        [`${PREFIX}ban @user [reason]`, 'Permanently ban a user'],
        [`${PREFIX}unban <userID> [reason]`, 'Unban a previously banned user'],
        [`${PREFIX}kick @user [reason]`, 'Kick a user from the server'],
        [`${PREFIX}mute @user 10m [reason]`, 'Timeout a user — `10s` `5m` `2h` `1d`'],
        [`${PREFIX}unmute @user`, 'Remove an active timeout'],
        [`${PREFIX}warn @user reason`, 'Warn a user (logged + DM)'],
        [`${PREFIX}warning @user`, 'View warning history for a user'],
      ]) +
      `\n${divider()}\n*Requires the matching mod permission per command.*`,
    );
  }

  if (section === 'channel') {
    return e.setTitle('🧹  Channel Tools').setDescription(
      `${divider()}\n` +
      fmt([
        [`${PREFIX}purge 1-100`, 'Bulk delete recent messages'],
        [`${PREFIX}purge @user 50`, 'Delete a user’s last N messages'],
        [`${PREFIX}lock`, 'Lock the current channel'],
        [`${PREFIX}unlock`, 'Unlock the current channel'],
        [`${PREFIX}stick <message>`, 'Stick a message (re-posts every 50 msgs)'],
        [`${PREFIX}stickinfo`, 'View / remove sticky messages'],
        [`${PREFIX}say <message>`, 'Make the bot say something'],
        ['/nuke', 'Clone & wipe the current channel'],
      ]) +
      `\n${divider()}`,
    );
  }

  if (section === 'utility') {
    return e.setTitle('🔧  Utility').setDescription(
      `${divider()}\n` +
      fmt([
        [`${PREFIX}afk [reason]`, 'Set AFK — auto-removes when you talk'],
        [`${PREFIX}ping`, 'Bot latency + status'],
        [`${PREFIX}setnick @user new name`, 'Change a member’s nickname'],
        [`${PREFIX}mc @user`, 'Show a user’s tracked message count'],
        ['/botinfo', 'Bot statistics & uptime'],
      ]) +
      `\n${divider()}`,
    );
  }

  if (section === 'community') {
    return e.setTitle('🎉  Community').setDescription(
      `${divider()}\n` +
      fmt([
        ['/greet new_channel:#x message:...', 'Channel welcome message'],
        ['/greet off', 'Disable channel welcome'],
        ['/greetdm set title:... description:...', 'DM welcome'],
        ['/greetdm off', 'Disable DM welcome'],
        ['/gstart duration:1h winners:1 prize:Nitro', 'Start a giveaway'],
        ['/gend giveaway_id:<msg_id>', 'End a giveaway early'],
        ['/memes', 'Random meme'],
        ['/modlog', 'Bind / create the mod-logs channel'],
      ]) +
      `\n${divider()}\n**Greet placeholders:** \`{user}\` \`{server}\` \`{count}\``,
    );
  }

  if (section === 'tickets') {
    return e.setTitle('🎫  Ticket System').setDescription(
      `${divider()}\n` +
      fmt([
        ['/ticketsetup channel:#support staff_role:@Staff category:Tickets', 'Configure & post the ticket panel'],
      ]) +
      `\n${divider()}\n` +
      `**How users use it**\n` +
      `› Click **Open Ticket** on the panel\n` +
      `› A private channel is created (only user, staff & admins)\n` +
      `› Staff click **Claim** — their name shows on the button\n` +
      `› Anyone authorized can **Close** — channel auto-deletes in 5s`,
    );
  }

  if (section === 'tournament') {
    return e.setTitle('🏆  Tournaments').setDescription(
      `${divider()}\n` +
      `**Setup**\n` +
      fmt([
        [`${PREFIX}setup`, 'Create `cyclops-turney-mod` & `idp-access` roles'],
        [`${PREFIX}t`, 'Open the full tournament panel'],
      ]) +
      `\n\n**Slash**\n` +
      fmt([
        ['/slot-list tournament:...', 'Post / refresh the public slot list'],
        ['/idpdmcaptains tournament:... room_id:... password:...', 'DM IDP details to all captains'],
      ]) +
      `\n${divider()}\n` +
      `**Panel buttons:** Create Channels · Create Tournament · Edit Settings · Start/Pause Registration · Manage Groups · Manually Add Slot · Slot Manager Channel · MS Excel File\n\n` +
      `**Registration format** (in \`register-here\`):\n` +
      '```\n' +
      'YourTeamName\n' +
      '@Player1\n' +
      '@Player2\n' +
      '@Player3\n' +
      '@Player4\n' +
      '```\n' +
      `Bot reacts ✅ on success · ❌ on wrong format · ⚠️ if duplicate.`,
    );
  }

  if (section === 'admin') {
    return e.setTitle('⚙️  Admin / Owner').setDescription(
      `${divider()}\n` +
      fmt([
        [`${PREFIX}sync`, 'Re-register slash commands to **every** server instantly (clears global duplicates)'],
      ]) +
      `\n${divider()}\n` +
      `Use \`${PREFIX}sync\` after updates — commands appear **immediately** in every server, with no duplicates.`,
    );
  }

  return e.setTitle('Unknown Section').setDescription('Pick a category from the menu below.');
}

export function buildHelpComponents(currentId = 'overview') {
  const select = new StringSelectMenuBuilder()
    .setCustomId('help:select')
    .setPlaceholder('📚 Browse commands by category…')
    .addOptions(
      SECTIONS.map((s) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(s.label)
          .setValue(s.id)
          .setDescription(s.description.slice(0, 100))
          .setEmoji(s.emoji)
          .setDefault(s.id === currentId),
      ),
    );

  return [new ActionRowBuilder().addComponents(select)];
}

export default {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Show all available commands.',
  async execute({ message, client }) {
    const embed = buildHelpEmbed('overview', client, message.guild);
    const components = buildHelpComponents('overview');
    await message.reply({ embeds: [embed], components });
  },
};
