import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { brandedFooter } from '../utils/embeds.js';

export default {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Show all available commands.',
  async execute({ message, client }) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle('🤖 CYCLOPS — Command Center')
      .setDescription('**Automate your tournaments. Moderate with ease.**\n\nUse prefix `?` for moderation commands and `/` for slash commands.')
      .addFields(
        {
          name: '🛡️ Moderation',
          value: [
            '`?ban @user reason` — Ban a user',
            '`?kick @user reason` — Kick a user',
            '`?mute @user 10m reason` — Timeout user',
            '`?unmute @user reason` — Remove timeout',
            '`?warn @user reason` — Warn a user',
            '`?warning @user` — View warnings',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🧹 Channel Tools',
          value: [
            '`?purge 1-100` — Bulk delete',
            '`?purge @user 50` — Delete from user',
            '`?lock` / `?unlock` — Lock channel',
            '`?stick <msg>` — Stick a message',
            '`?stickinfo` — View/remove sticky',
            '`?say <msg>` — Bot says message',
          ].join('\n'),
          inline: false,
        },
        {
          name: '👤 Utility',
          value: [
            '`?afk <reason>` — Set AFK status',
            '`?ping` — Bot latency',
            '`?setnick @user name` — Change nick',
            '`?mc @user` — Total messages',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🏆 Tournaments',
          value: [
            '`?setup` — Setup tournament role',
            '`?t` — Open tournament panel',
            '`/slot-list` — Public slot list',
            '`/idpdmcaptains` — DM IDP to captains',
          ].join('\n'),
          inline: false,
        },
        {
          name: '⚙️ Slash',
          value: [
            '`/modlog` — Setup mod-log channel',
            '`/greet` — Configure greet messages',
            '`/greetdm` — DM new members',
            '`/gstart` `/gend` — Giveaways',
            '`/memes` — Random memes',
            '`/botinfo` — Bot info',
            '`/nuke` — Nuke channel',
          ].join('\n'),
          inline: false,
        },
      )
      .setFooter(brandedFooter(client))
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};
