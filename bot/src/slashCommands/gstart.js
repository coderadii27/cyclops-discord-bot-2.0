import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../config.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { parseDuration, formatDuration } from '../utils/parseDuration.js';

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
    if (!dur) return interaction.reply({ embeds: [errorEmbed('Invalid duration.')], ephemeral: true });
    const winners = interaction.options.getInteger('winners');
    const prize = interaction.options.getString('prize');
    const endsAt = Date.now() + dur;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PINK)
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n**Hosted by:** ${interaction.user}\n\nClick the button below to enter!`)
      .setFooter({ text: 'CYCLOPS Giveaways' })
      .setTimestamp(endsAt);

    const button = new ButtonBuilder().setCustomId('giveaway:enter').setLabel('Enter Giveaway').setStyle(ButtonStyle.Success).setEmoji('🎉');

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
    const reply = await interaction.fetchReply();

    const data = getGuildData(interaction.guild.id);
    data.giveaways[reply.id] = {
      id: reply.id,
      channelId: interaction.channel.id,
      prize,
      winners,
      endsAt,
      hostId: interaction.user.id,
      entries: [],
      ended: false,
    };
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
    .setColor(COLORS.PINK)
    .setTitle('🎉 GIVEAWAY ENDED 🎉')
    .setDescription(`**Prize:** ${g.prize}\n**Winners:** ${winnerText}\n**Hosted by:** <@${g.hostId}>${manual ? '\n_(ended manually)_' : ''}`)
    .setTimestamp();

  if (msg) await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
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
  if (g.entries.includes(interaction.user.id)) {
    g.entries = g.entries.filter((id) => id !== interaction.user.id);
    await saveGuildData(interaction.guild.id);
    return interaction.reply({ embeds: [successEmbed('You have left the giveaway.')], ephemeral: true });
  }
  g.entries.push(interaction.user.id);
  await saveGuildData(interaction.guild.id);
  return interaction.reply({ embeds: [successEmbed(`✅ You have entered the **${g.prize}** giveaway!\nEnds <t:${Math.floor(g.endsAt / 1000)}:R>`)], ephemeral: true });
}
