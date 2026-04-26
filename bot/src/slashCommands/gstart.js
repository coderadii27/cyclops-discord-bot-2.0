import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../config.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { parseDuration } from '../utils/parseDuration.js';

const GVWY = '🎉';
const PRIZE = '🏆';
const DOT = '<:dot:0>'; // visual placeholder, replaced below
const BULLET = '•';

function buildGiveawayEmbed(g, entriesCount) {
  const endsAtSec = Math.floor(g.endsAt / 1000);
  const date = new Date(g.endsAt);
  const dateStr = date.toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

  return new EmbedBuilder()
    .setColor(g.ended ? COLORS.DARK : COLORS.PINK)
    .setAuthor({ name: g.ended ? `${GVWY} Giveaway Ended ${GVWY}` : `${GVWY} New Giveaway ${GVWY}` })
    .setTitle(`${PRIZE}  ${g.prize}  ${PRIZE}`)
    .setDescription(
      `${BULLET} **Winners:** ${g.winners}\n` +
      `${BULLET} **Ends:** <t:${endsAtSec}:R> (${dateStr})\n` +
      `${BULLET} **Hosted by:** <@${g.hostId}>\n\n` +
      (g.ended
        ? `**This giveaway has ended.**`
        : `${BULLET} Click the **${GVWY}** button below to participate!\n${BULLET} **Entries:** \`${entriesCount}\``),
    )
    .setFooter({ text: 'Ends at' })
    .setTimestamp(g.endsAt);
}

function buildGiveawayRow(entriesCount, ended) {
  const enter = new ButtonBuilder()
    .setCustomId('giveaway:enter')
    .setEmoji(GVWY)
    .setLabel(ended ? 'Ended' : `${entriesCount}`)
    .setStyle(ended ? ButtonStyle.Secondary : ButtonStyle.Success)
    .setDisabled(ended);
  return new ActionRowBuilder().addComponents(enter);
}

export default {
  name: 'gstart',
  data: new SlashCommandBuilder()
    .setName('gstart')
    .setDescription('Start a giveaway.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('duration').setDescription('Duration (e.g. 1h, 30m, 2d)').setRequired(true))
    .addIntegerOption((o) => o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1))
    .addStringOption((o) => o.setName('prize').setDescription('Prize name').setRequired(true)),
  async execute({ interaction, client }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Server** permission.')], ephemeral: true });
    }
    const dur = parseDuration(interaction.options.getString('duration'));
    if (!dur) return interaction.reply({ embeds: [errorEmbed('Invalid duration. Try `1h`, `30m`, `2d`.')], ephemeral: true });
    const winners = interaction.options.getInteger('winners');
    const prize = interaction.options.getString('prize');
    const endsAt = Date.now() + dur;

    const g = {
      id: 'pending',
      channelId: interaction.channel.id,
      prize,
      winners,
      endsAt,
      hostId: interaction.user.id,
      entries: [],
      ended: false,
    };

    await interaction.reply({
      embeds: [buildGiveawayEmbed(g, 0)],
      components: [buildGiveawayRow(0, false)],
    });
    const reply = await interaction.fetchReply();
    g.id = reply.id;

    const data = getGuildData(interaction.guild.id);
    data.giveaways[reply.id] = g;
    await saveGuildData(interaction.guild.id);

    scheduleGiveawayEnd(client, interaction.guild.id, reply.id, dur);
  },
};

const timers = new Map();

export function scheduleGiveawayEnd(client, guildId, msgId, ms) {
  const key = `${guildId}:${msgId}`;
  if (timers.has(key)) clearTimeout(timers.get(key));
  const t = setTimeout(() => endGiveaway(client, guildId, msgId, false).catch(() => {}), Math.max(0, ms));
  timers.set(key, t);
}

export async function endGiveaway(client, guildId, msgId, manual) {
  const data = getGuildData(guildId);
  const g = data.giveaways[msgId];
  if (!g || g.ended) return;
  g.ended = true;
  const guild = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(g.channelId);
  if (!channel) return;
  const msg = await channel.messages.fetch(msgId).catch(() => null);

  const entries = [...g.entries];
  const winners = [];
  while (winners.length < g.winners && entries.length) {
    const idx = Math.floor(Math.random() * entries.length);
    winners.push(entries.splice(idx, 1)[0]);
  }
  await saveGuildData(guildId);

  const winnerText = winners.length ? winners.map((id) => `<@${id}>`).join(', ') : '_no entries_';
  const embed = new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setAuthor({ name: '🎊 Giveaway Ended 🎊' })
    .setTitle(`🏆  ${g.prize}  🏆`)
    .setDescription(
      `**Winners:** ${winnerText}\n` +
      `**Hosted by:** <@${g.hostId}>\n` +
      `**Total Entries:** \`${g.entries.length}\`` +
      (manual ? '\n_(ended manually)_' : ''),
    )
    .setTimestamp();

  if (msg) await msg.edit({ embeds: [embed], components: [buildGiveawayRow(g.entries.length, true)] }).catch(() => {});
  if (winners.length) {
    await channel.send({ content: `🎊 Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${g.prize}**!` }).catch(() => {});
  } else {
    await channel.send({ content: `No valid entries for **${g.prize}**.` }).catch(() => {});
  }
}

export async function handleGiveawayButton(interaction) {
  if (interaction.customId !== 'giveaway:enter') return;
  const data = getGuildData(interaction.guild.id);
  const g = data.giveaways[interaction.message.id];
  if (!g) return interaction.reply({ embeds: [errorEmbed('Giveaway not found.')], ephemeral: true });
  if (g.ended) return interaction.reply({ embeds: [errorEmbed('Giveaway has ended.')], ephemeral: true });

  let response;
  if (g.entries.includes(interaction.user.id)) {
    g.entries = g.entries.filter((id) => id !== interaction.user.id);
    response = successEmbed('You have **left** the giveaway.');
  } else {
    g.entries.push(interaction.user.id);
    response = successEmbed(`✅ You have entered the **${g.prize}** giveaway!\nEnds <t:${Math.floor(g.endsAt / 1000)}:R>`);
  }
  await saveGuildData(interaction.guild.id);

  // Update the original message with new entry count
  await interaction.message.edit({
    embeds: [buildGiveawayEmbed(g, g.entries.length)],
    components: [buildGiveawayRow(g.entries.length, false)],
  }).catch(() => {});

  return interaction.reply({ embeds: [response], ephemeral: true });
}
