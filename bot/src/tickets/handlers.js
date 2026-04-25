import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { COLORS } from '../config.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { errorEmbed, successEmbed, warnEmbed } from '../utils/embeds.js';

export function buildTicketPanel(guildName) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PURPLE)
    .setAuthor({ name: `${guildName} • Support` })
    .setTitle('🎫  Need Help? Open a Ticket')
    .setDescription(
      "Welcome to support! Click the button below to open a private ticket with our staff team.\n\n" +
      "**How it works**\n" +
      "› A private channel is created just for you\n" +
      "› Only you and staff can see it\n" +
      "› Describe your issue and we'll help ASAP\n" +
      "› Close the ticket when you're done\n\n" +
      "Please don't open a ticket without a real reason — abuse may result in action.",
    )
    .setFooter({ text: 'Powered by your friendly support team' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:open').setLabel('Open Ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary),
  );
  return { embeds: [embed], components: [row] };
}

function buildClaimRow(claimedBy = null, closed = false) {
  const claim = new ButtonBuilder()
    .setCustomId('ticket:claim')
    .setLabel(claimedBy ? `Claimed by ${claimedBy}` : 'Claim Ticket')
    .setEmoji('🙋')
    .setStyle(claimedBy ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setDisabled(!!claimedBy);
  const close = new ButtonBuilder()
    .setCustomId('ticket:close')
    .setLabel(closed ? 'Closed' : 'Close Ticket')
    .setEmoji('🔒')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(closed);
  return new ActionRowBuilder().addComponents(claim, close);
}

export async function handleTicketOpen(interaction) {
  const data = getGuildData(interaction.guild.id);
  const cfg = data.ticket;
  if (!cfg) {
    return interaction.reply({ embeds: [errorEmbed('Tickets are not configured. Ask an admin to run `/ticketsetup`.')], ephemeral: true });
  }

  // Prevent duplicate open ticket per user
  const existing = Object.values(data.tickets || {}).find(
    (t) => t.userId === interaction.user.id && t.status === 'open',
  );
  if (existing) {
    const ch = interaction.guild.channels.cache.get(existing.channelId);
    if (ch) {
      return interaction.reply({ embeds: [warnEmbed(`You already have an open ticket: <#${ch.id}>`)], ephemeral: true });
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const category = cfg.categoryId ? interaction.guild.channels.cache.get(cfg.categoryId) : null;
  const staffRole = cfg.staffRoleId;

  const ticketNum = (data.ticketCounter ?? 0) + 1;
  data.ticketCounter = ticketNum;

  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  if (staffRole) {
    overwrites.push({
      id: staffRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    });
  }

  // Always include any role with Administrator permission
  for (const role of interaction.guild.roles.cache.values()) {
    if (role.permissions.has(PermissionFlagsBits.Administrator) && !role.managed && role.id !== interaction.guild.roles.everyone.id) {
      if (!overwrites.find((o) => o.id === role.id)) {
        overwrites.push({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        });
      }
    }
  }

  const safeName = (interaction.user.username || 'user').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'user';
  const channel = await interaction.guild.channels.create({
    name: `ticket-${ticketNum}-${safeName}`,
    type: ChannelType.GuildText,
    parent: category && category.type === ChannelType.GuildCategory ? category.id : null,
    permissionOverwrites: overwrites,
    topic: `Ticket #${ticketNum} • Opened by ${interaction.user.tag} (${interaction.user.id})`,
  });

  data.tickets[channel.id] = {
    channelId: channel.id,
    userId: interaction.user.id,
    number: ticketNum,
    claimedBy: null,
    status: 'open',
    createdAt: Date.now(),
  };
  await saveGuildData(interaction.guild.id);

  const welcome = new EmbedBuilder()
    .setColor(COLORS.PURPLE)
    .setTitle(`🎫 Ticket #${ticketNum}`)
    .setDescription(
      `Hello <@${interaction.user.id}>, welcome to your private support channel.\n\n` +
      `Please describe your issue clearly. A staff member will respond shortly.\n\n` +
      `${staffRole ? `Pinged: <@&${staffRole}>` : ''}`,
    )
    .setFooter({ text: 'Use the buttons below to claim or close this ticket.' })
    .setTimestamp();

  await channel.send({
    content: `<@${interaction.user.id}>${staffRole ? ` <@&${staffRole}>` : ''}`,
    embeds: [welcome],
    components: [buildClaimRow()],
    allowedMentions: { users: [interaction.user.id], roles: staffRole ? [staffRole] : [] },
  });

  await interaction.editReply({ embeds: [successEmbed(`Your ticket has been opened: <#${channel.id}>`, '🎫 Ticket Created')] });
}

export async function handleTicketClaim(interaction) {
  const data = getGuildData(interaction.guild.id);
  const ticket = data.tickets?.[interaction.channel.id];
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
  if (ticket.claimedBy) return interaction.reply({ embeds: [warnEmbed(`Already claimed by <@${ticket.claimedBy}>.`)], ephemeral: true });

  const member = interaction.member;
  const cfg = data.ticket;
  const isStaff = (cfg?.staffRoleId && member.roles.cache.has(cfg.staffRoleId)) || member.permissions.has(PermissionFlagsBits.Administrator);
  if (!isStaff) {
    return interaction.reply({ embeds: [errorEmbed('Only **staff** or **admins** can claim tickets.')], ephemeral: true });
  }

  ticket.claimedBy = interaction.user.id;
  ticket.claimedAt = Date.now();
  await saveGuildData(interaction.guild.id);

  const role = member.permissions.has(PermissionFlagsBits.Administrator) ? 'Admin' : 'Staff';
  const label = `${member.displayName} (${role})`;

  // Update the original message with claim info
  await interaction.update({ components: [buildClaimRow(label)] }).catch(() => {});

  await interaction.channel.send({
    embeds: [successEmbed(`This ticket has been **claimed** by <@${interaction.user.id}> (**${role}**). They will assist you shortly.`, '🙋 Ticket Claimed')],
  });
}

export async function handleTicketClose(interaction) {
  const data = getGuildData(interaction.guild.id);
  const ticket = data.tickets?.[interaction.channel.id];
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });

  const member = interaction.member;
  const cfg = data.ticket;
  const isStaff = (cfg?.staffRoleId && member.roles.cache.has(cfg.staffRoleId)) || member.permissions.has(PermissionFlagsBits.Administrator);
  const isOwner = ticket.userId === interaction.user.id;
  if (!isStaff && !isOwner) {
    return interaction.reply({ embeds: [errorEmbed('Only the ticket owner, staff, or admins can close this ticket.')], ephemeral: true });
  }

  ticket.status = 'closed';
  ticket.closedBy = interaction.user.id;
  ticket.closedAt = Date.now();
  await saveGuildData(interaction.guild.id);

  await interaction.reply({ embeds: [warnEmbed(`Ticket closed by <@${interaction.user.id}>. Channel will be deleted in **5 seconds**.`, '🔒 Closing Ticket')] });

  setTimeout(() => {
    interaction.channel.delete(`Ticket #${ticket.number} closed by ${interaction.user.tag}`).catch(() => {});
    const fresh = getGuildData(interaction.guild.id);
    delete fresh.tickets[interaction.channel.id];
    saveGuildData(interaction.guild.id).catch(() => {});
  }, 5000);
}
