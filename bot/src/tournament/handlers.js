import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} from 'discord.js';
import { COLORS, TOURNAMENT_CHANNELS } from '../config.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { errorEmbed, successEmbed, infoEmbed, warnEmbed } from '../utils/embeds.js';
import { buildMainPanel, buildSlotManagerPanel, buildSlotListEmbed, buildSlotListComponents, tournamentSelectMenu } from './panel.js';
import { handleStickyDelete } from '../commands/stickinfo.js';
import ExcelJS from 'exceljs';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isMod(member, data) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return data.tournamentModRoleId && member.roles.cache.has(data.tournamentModRoleId);
}

export async function handleTournamentButton(interaction, client) {
  const data = getGuildData(interaction.guild.id);
  if (!isMod(interaction.member, data) && !interaction.customId.startsWith('slot:')) {
    return interaction.reply({ embeds: [errorEmbed('You need administrator or tournament moderator role.')], ephemeral: true });
  }

  const id = interaction.customId;

  if (id === 'tourney:createChannels') {
    const modal = new ModalBuilder()
      .setCustomId('tourney:createChannels:modal')
      .setTitle('Create Tournament Category')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('catName').setLabel('Category name').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. CYCLOPS BGMI Series'),
        ),
      );
    return interaction.showModal(modal);
  }

  if (id === 'tourney:createTournament') {
    const modal = new ModalBuilder()
      .setCustomId('tourney:createTournament:modal')
      .setTitle('Create New Tournament')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tName').setLabel('Tournament name').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. BGMI Daily Scrim #5'),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tSlots').setLabel('Total slots').setStyle(TextInputStyle.Short).setRequired(true).setValue('25'),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tPerTeam').setLabel('Members per team').setStyle(TextInputStyle.Short).setRequired(true).setValue('4'),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tCategoryId').setLabel('Category ID (leave blank for first)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Optional'),
        ),
      );
    return interaction.showModal(modal);
  }

  if (id === 'tourney:editSettings') {
    return interaction.reply({
      content: 'Pick a tournament to edit:',
      components: [tournamentSelectMenu('tourney:editSettings:select', data.tournaments)],
      ephemeral: true,
    });
  }

  if (id === 'tourney:toggleReg') {
    return interaction.reply({
      content: 'Pick a tournament to start/pause registration:',
      components: [tournamentSelectMenu('tourney:toggleReg:select', data.tournaments)],
      ephemeral: true,
    });
  }

  if (id === 'tourney:manageGroups') {
    return interaction.reply({
      content: 'Pick a tournament to manage groups:',
      components: [tournamentSelectMenu('tourney:manageGroups:select', data.tournaments)],
      ephemeral: true,
    });
  }

  if (id === 'tourney:addSlot') {
    return interaction.reply({
      content: 'Pick a tournament to add a slot to:',
      components: [tournamentSelectMenu('tourney:addSlot:select', data.tournaments)],
      ephemeral: true,
    });
  }

  if (id === 'tourney:slotManager') {
    return interaction.reply({
      content: 'Pick a tournament to deploy the slot-manager panel for:',
      components: [tournamentSelectMenu('tourney:slotManager:select', data.tournaments)],
      ephemeral: true,
    });
  }

  if (id === 'tourney:export') {
    return interaction.reply({
      content: '**Choose Tournament To Export**\nSelect a tournament to export its confirmed teams as Excel:',
      components: [tournamentSelectMenu('export:select', data.tournaments)],
      ephemeral: true,
    });
  }

  // SLOT MANAGER buttons (anyone)
  if (id === 'slot:cancel' || id === 'slot:my' || id === 'slot:rename' || id === 'slot:refreshList') {
    return handleSlotButton(interaction, client, data);
  }
}

async function handleSlotButton(interaction, client, data) {
  const id = interaction.customId;

  if (id === 'slot:my') {
    const mySlots = [];
    for (const t of Object.values(data.tournaments)) {
      (t.slots || []).forEach((s, i) => {
        if (s.captainId === interaction.user.id || (s.memberIds || []).includes(interaction.user.id)) {
          mySlots.push(`**${t.name}** — Slot ${i + 1} • Team **${s.teamName}**`);
        }
      });
    }
    return interaction.reply({ embeds: [infoEmbed(mySlots.length ? mySlots.join('\n') : 'You have no slots.', '📋 My Slots')], ephemeral: true });
  }

  if (id === 'slot:cancel') {
    let cancelled = 0;
    let updatedTournamentIds = [];
    for (const t of Object.values(data.tournaments)) {
      const before = (t.slots || []).length;
      t.slots = (t.slots || []).filter((s) => s.captainId !== interaction.user.id);
      if (t.slots.length !== before) {
        cancelled += before - t.slots.length;
        updatedTournamentIds.push(t.id);
      }
    }
    await saveGuildData(interaction.guild.id);
    for (const tid of updatedTournamentIds) {
      await refreshSlotListMessage(interaction.guild, data, data.tournaments[tid]).catch(() => {});
    }
    return interaction.reply({
      embeds: [cancelled > 0 ? successEmbed(`Cancelled **${cancelled}** slot(s).`, '❌ Slot Cancelled') : warnEmbed('You have no slots to cancel.')],
      ephemeral: true,
    });
  }

  if (id === 'slot:rename') {
    const modal = new ModalBuilder()
      .setCustomId('slot:rename:modal')
      .setTitle('Change Team Name')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('newName').setLabel('New team name').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50),
        ),
      );
    return interaction.showModal(modal);
  }

  if (id === 'slot:refreshList') {
    // Find tournament whose slot-list channel is this one
    const tournament = Object.values(data.tournaments).find((t) => t.slotListChannelId === interaction.channel.id);
    if (!tournament) return interaction.reply({ embeds: [errorEmbed('No tournament linked to this channel.')], ephemeral: true });
    await interaction.update({ embeds: [buildSlotListEmbed(tournament)], components: buildSlotListComponents() });
  }
}

export async function handleTournamentSelect(interaction, client) {
  const data = getGuildData(interaction.guild.id);
  const id = interaction.customId;
  const value = interaction.values[0];

  if (id === 'stickdel:select') {
    return handleStickyDelete(interaction);
  }

  if (value === 'none') {
    return interaction.reply({ embeds: [errorEmbed('Create a tournament first.')], ephemeral: true });
  }

  if (id === 'tourney:editSettings:select') {
    const t = data.tournaments[value];
    const modal = new ModalBuilder()
      .setCustomId(`tourney:editSettings:modal:${value}`)
      .setTitle(`Edit — ${t.name.slice(0, 30)}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tName').setLabel('Tournament name').setStyle(TextInputStyle.Short).setRequired(true).setValue(t.name),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tSlots').setLabel('Total slots').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(t.slotsTotal)),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('tPerTeam').setLabel('Members per team').setStyle(TextInputStyle.Short).setRequired(true).setValue(String(t.perTeam)),
        ),
      );
    return interaction.showModal(modal);
  }

  if (id === 'tourney:toggleReg:select') {
    const t = data.tournaments[value];
    t.registrationOpen = !t.registrationOpen;
    await saveGuildData(interaction.guild.id);
    const cat = data.tournamentCategories[t.categoryId];
    const regCh = cat && interaction.guild.channels.cache.get(cat.channels['register-here']);
    if (regCh) {
      regCh.send({
        embeds: [t.registrationOpen
          ? successEmbed(`**${t.name}** registration **resume.**`, '✅ Registration Resumed')
          : warnEmbed(`**${t.name}** registration **paused.**`, '⏸️ Registration Paused')],
      }).catch(() => {});
    }
    return interaction.update({
      embeds: [successEmbed(`Toggled. Registration is now **${t.registrationOpen ? 'OPEN' : 'PAUSED'}**.`)],
      components: [],
    });
  }

  if (id === 'tourney:manageGroups:select') {
    const t = data.tournaments[value];
    const groups = {};
    (t.slots || []).forEach((s, i) => {
      const groupNum = Math.floor(i / 25) + 1;
      if (!groups[groupNum]) groups[groupNum] = [];
      groups[groupNum].push(`Slot ${i + 1}: ${s.teamName}`);
    });
    const lines = Object.entries(groups).map(([g, list]) => `**Group ${g}**\n${list.join('\n')}`).join('\n\n') || '_No teams registered yet._';
    return interaction.update({ embeds: [infoEmbed(lines, `🧩 ${t.name} — Groups`)], components: [] });
  }

  if (id === 'tourney:addSlot:select') {
    const t = data.tournaments[value];
    const modal = new ModalBuilder()
      .setCustomId(`tourney:addSlot:modal:${value}`)
      .setTitle(`Add Slot — ${t.name.slice(0, 30)}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('teamName').setLabel('Team name').setStyle(TextInputStyle.Short).setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('captainId').setLabel('Captain user ID or @mention').setStyle(TextInputStyle.Short).setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('memberIds').setLabel('Other member IDs (comma separated)').setStyle(TextInputStyle.Paragraph).setRequired(false),
        ),
      );
    return interaction.showModal(modal);
  }

  if (id === 'tourney:slotManager:select') {
    const t = data.tournaments[value];
    const cat = data.tournamentCategories[t.categoryId];
    if (!cat) return interaction.reply({ embeds: [errorEmbed('Category missing.')], ephemeral: true });
    const slotMgrCh = interaction.guild.channels.cache.get(cat.slotManagerChannelId);
    if (!slotMgrCh) return interaction.reply({ embeds: [errorEmbed('Slot manager channel missing.')], ephemeral: true });
    const { embed, components } = buildSlotManagerPanel(t.name);
    const sent = await slotMgrCh.send({ embeds: [embed], components });
    return interaction.update({ embeds: [successEmbed(`Slot manager panel deployed in <#${slotMgrCh.id}> for **${t.name}**.`)], components: [] });
  }

  if (id === 'export:select') {
    const t = data.tournaments[value];
    if (!t) return interaction.reply({ embeds: [errorEmbed('Not found.')], ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const buffer = await buildExcel(interaction.guild, t);
    const file = new AttachmentBuilder(buffer, { name: `${t.name.replace(/[^a-z0-9]+/gi, '_')}_teams.xlsx` });
    return interaction.editReply({ embeds: [successEmbed(`Exported **${t.name}** confirmed teams.`, '📊 Excel Export')], files: [file] });
  }
}

export async function handleTournamentModal(interaction, client) {
  const data = getGuildData(interaction.guild.id);
  const id = interaction.customId;

  if (id === 'tourney:createChannels:modal') {
    const catName = interaction.fields.getTextInputValue('catName').trim();
    await interaction.deferReply({ ephemeral: true });
    const result = await createTournamentCategory(interaction.guild, data, catName);
    await saveGuildData(interaction.guild.id);
    return interaction.editReply({ embeds: [successEmbed(
      `📁 Category **${catName}** created with all channels.\nCategory: <#${result.categoryId}>\nHelp Desk: <#${result.helpDeskId}>\nSlot Manager: <#${result.slotManagerChannelId}>\n\nNow click **Create Tournament** in the panel.`,
      '✅ Channels Created',
    )] });
  }

  if (id === 'tourney:createTournament:modal') {
    const name = interaction.fields.getTextInputValue('tName').trim();
    const slotsTotal = parseInt(interaction.fields.getTextInputValue('tSlots'), 10) || 25;
    const perTeam = parseInt(interaction.fields.getTextInputValue('tPerTeam'), 10) || 4;
    const catIdInput = interaction.fields.getTextInputValue('tCategoryId').trim();
    const cats = Object.values(data.tournamentCategories);
    if (!cats.length) return interaction.reply({ embeds: [errorEmbed('Create channels first via the panel.')], ephemeral: true });
    const cat = catIdInput ? data.tournamentCategories[catIdInput] : cats[0];
    if (!cat) return interaction.reply({ embeds: [errorEmbed('Category not found.')], ephemeral: true });

    const tid = uid();
    data.tournaments[tid] = {
      id: tid,
      name,
      categoryId: cat.categoryId,
      slotsTotal,
      perTeam,
      registrationOpen: false,
      slots: [],
      slotListChannelId: cat.channels['slot-list'],
      slotListMessageId: null,
      idpChannelId: null,
    };
    await saveGuildData(interaction.guild.id);

    // Initialize slot-list channel for this tournament
    await refreshSlotListMessage(interaction.guild, data, data.tournaments[tid]).catch(() => {});
    // Post how-to-register info with the per-team format
    await postHowToRegisterInfo(interaction.guild, data, data.tournaments[tid]).catch(() => {});

    return interaction.reply({ embeds: [successEmbed(
      `🏆 **${name}** created!\n• Slots: ${slotsTotal}\n• Per team: ${perTeam}\n• Category: <#${cat.categoryId}>\n\nThe **how-to-register** channel has been updated with the registration format.\nUse the panel to start registration.`,
      '✅ Tournament Created',
    )], ephemeral: true });
  }

  if (id.startsWith('tourney:editSettings:modal:')) {
    const tid = id.split(':')[3];
    const t = data.tournaments[tid];
    if (!t) return interaction.reply({ embeds: [errorEmbed('Not found.')], ephemeral: true });
    t.name = interaction.fields.getTextInputValue('tName').trim();
    t.slotsTotal = parseInt(interaction.fields.getTextInputValue('tSlots'), 10) || t.slotsTotal;
    t.perTeam = parseInt(interaction.fields.getTextInputValue('tPerTeam'), 10) || t.perTeam;
    await saveGuildData(interaction.guild.id);
    await refreshSlotListMessage(interaction.guild, data, t).catch(() => {});
    await postHowToRegisterInfo(interaction.guild, data, t).catch(() => {});
    return interaction.reply({ embeds: [successEmbed(`Updated **${t.name}**.`, '⚙️ Settings Saved')], ephemeral: true });
  }

  if (id.startsWith('tourney:addSlot:modal:')) {
    const tid = id.split(':')[3];
    const t = data.tournaments[tid];
    if (!t) return interaction.reply({ embeds: [errorEmbed('Not found.')], ephemeral: true });

    const teamName = interaction.fields.getTextInputValue('teamName').trim();
    const captainId = interaction.fields.getTextInputValue('captainId').trim().replace(/[<@!>]/g, '');
    const memberIds = (interaction.fields.getTextInputValue('memberIds') || '')
      .split(/[,\s]+/).map((s) => s.replace(/[<@!>]/g, '').trim()).filter(Boolean);

    if (t.slots.length >= t.slotsTotal) {
      return interaction.reply({ embeds: [errorEmbed('Tournament is full.')], ephemeral: true });
    }
    t.slots.push({ teamName, captainId, memberIds });
    await saveGuildData(interaction.guild.id);

    if (data.idpAccessRoleId) {
      const cap = await interaction.guild.members.fetch(captainId).catch(() => null);
      if (cap) cap.roles.add(data.idpAccessRoleId).catch(() => {});
    }
    await refreshSlotListMessage(interaction.guild, data, t).catch(() => {});

    return interaction.reply({ embeds: [successEmbed(`Added Slot ${t.slots.length} → **${teamName}** (Captain <@${captainId}>) to **${t.name}**.`)], ephemeral: true });
  }

  if (id === 'slot:rename:modal') {
    const newName = interaction.fields.getTextInputValue('newName').trim();
    let renamed = 0;
    let updatedTournamentIds = [];
    for (const t of Object.values(data.tournaments)) {
      for (const s of t.slots || []) {
        if (s.captainId === interaction.user.id) {
          s.teamName = newName;
          renamed++;
          updatedTournamentIds.push(t.id);
        }
      }
    }
    await saveGuildData(interaction.guild.id);
    for (const tid of [...new Set(updatedTournamentIds)]) {
      await refreshSlotListMessage(interaction.guild, data, data.tournaments[tid]).catch(() => {});
    }
    return interaction.reply({
      embeds: [renamed > 0 ? successEmbed(`Renamed **${renamed}** team(s) to **${newName}**.`, '✏️ Renamed') : warnEmbed('You have no slots to rename.')],
      ephemeral: true,
    });
  }
}

export async function createTournamentCategory(guild, data, catName) {
  const everyone = guild.roles.everyone;
  const modRoleId = data.tournamentModRoleId;
  const idpRoleId = data.idpAccessRoleId;

  const baseOverwrites = [
    { id: everyone.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
  ];
  if (modRoleId) baseOverwrites.push({ id: modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] });

  const category = await guild.channels.create({
    name: catName,
    type: ChannelType.GuildCategory,
    permissionOverwrites: baseOverwrites,
  });

  const channels = {};
  for (const chName of TOURNAMENT_CHANNELS) {
    let overwrites = [...baseOverwrites];
    if (chName === 'help-desk') {
      // Anyone can send in help-desk
      overwrites = [
        { id: everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] },
      ];
      if (modRoleId) overwrites.push({ id: modRoleId, allow: [PermissionFlagsBits.ManageMessages] });
    } else if (chName === 'register-here') {
      // Allow sending so users can register
      overwrites = [
        { id: everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] },
      ];
      if (modRoleId) overwrites.push({ id: modRoleId, allow: [PermissionFlagsBits.ManageMessages] });
    }

    const ch = await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: overwrites,
    });
    channels[chName] = ch.id;

    if (chName === 'info') {
      await ch.send({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.PURPLE)
          .setTitle('ℹ️ Tournament Info')
          .setDescription('Find all tournament details, format, and general information here.')
          .setFooter({ text: 'CYCLOPS Tournament System' })
          .setTimestamp()],
      }).catch(() => {});
    }
  }

  // Slot manager channel — view only for everyone (so they see the panel and click)
  const slotManagerCh = await guild.channels.create({
    name: `${catName.toLowerCase().replace(/\s+/g, '-')}-slot-manager`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      { id: everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ...(modRoleId ? [{ id: modRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] }] : []),
    ],
  });

  const catData = {
    categoryId: category.id,
    name: catName,
    channels,
    helpDeskChannelId: channels['help-desk'],
    slotManagerChannelId: slotManagerCh.id,
  };
  data.tournamentCategories[category.id] = catData;

  return catData;
}

export async function refreshSlotListMessage(guild, data, tournament) {
  if (!tournament) return;
  const cat = data.tournamentCategories[tournament.categoryId];
  if (!cat) return;
  const slotListId = tournament.slotListChannelId || cat.channels['slot-list'];
  const ch = guild.channels.cache.get(slotListId);
  if (!ch) return;

  const embed = buildSlotListEmbed(tournament);
  const components = buildSlotListComponents();

  if (tournament.slotListMessageId) {
    const msg = await ch.messages.fetch(tournament.slotListMessageId).catch(() => null);
    if (msg) {
      await msg.edit({ embeds: [embed], components }).catch(() => null);
      return;
    }
  }
  const sent = await ch.send({ embeds: [embed], components }).catch(() => null);
  if (sent) {
    tournament.slotListMessageId = sent.id;
    await saveGuildData(guild.id);
  }
}

async function buildExcel(guild, tournament) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Confirmed Teams');
  ws.columns = [
    { header: 'Slot', key: 'slot', width: 8 },
    { header: 'Team Name', key: 'team', width: 30 },
    { header: 'Captain', key: 'captain', width: 30 },
    { header: 'Members', key: 'members', width: 60 },
  ];
  ws.getRow(1).font = { bold: true };

  for (let i = 0; i < (tournament.slots || []).length; i++) {
    const s = tournament.slots[i];
    let captainTag = `<@${s.captainId}>`;
    const cap = await guild.members.fetch(s.captainId).catch(() => null);
    if (cap) captainTag = cap.user.tag;

    const memberTags = [];
    for (const mid of s.memberIds || []) {
      const m = await guild.members.fetch(mid).catch(() => null);
      memberTags.push(m ? m.user.tag : `(${mid})`);
    }

    ws.addRow({
      slot: i + 1,
      team: s.teamName,
      captain: captainTag,
      members: memberTags.join(', '),
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function postHowToRegisterInfo(guild, data, tournament) {
  const cat = data.tournamentCategories[tournament.categoryId];
  if (!cat) return;
  const ch = guild.channels.cache.get(cat.channels['how-to-register']);
  if (!ch) return;

  const samplePlayers = Array.from({ length: tournament.perTeam }, (_, i) => `@Player${i + 1}`).join('\n');
  const regCh = cat.channels['register-here'];

  const embed = new EmbedBuilder()
    .setColor(COLORS.PURPLE)
    .setTitle(`📝 How to Register — ${tournament.name}`)
    .setDescription(
      `**Team Size:** ${tournament.perTeam} players per team\n` +
      `**Total Slots:** ${tournament.slotsTotal}\n\n` +
      `**Where:** <#${regCh}>\n\n` +
      `**Required Format:**\n` +
      '```\n' +
      'YourTeamName\n' +
      `${samplePlayers}\n` +
      '```\n' +
      `**Rules:**\n` +
      `• First line must be your **team name**.\n` +
      `• Mention **exactly ${tournament.perTeam}** players (including the captain).\n` +
      `• The **first mention** becomes the team **captain** and gets the IDP role.\n` +
      `• Bot reacts ✅ on success and ❌ if the format is wrong.`,
    )
    .setFooter({ text: 'CYCLOPS Tournament System' })
    .setTimestamp();

  if (tournament.howToRegisterMessageId) {
    const existing = await ch.messages.fetch(tournament.howToRegisterMessageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] }).catch(() => {});
      return;
    }
  }
  const sent = await ch.send({ embeds: [embed] }).catch(() => null);
  if (sent) {
    tournament.howToRegisterMessageId = sent.id;
    await saveGuildData(guild.id);
  }
}

export async function processRegistration(message, data) {
  // Find tournament linked to this register-here channel
  const cat = Object.values(data.tournamentCategories).find((c) => c.channels?.['register-here'] === message.channel.id);
  if (!cat) return;
  const tournament = Object.values(data.tournaments).find((t) => t.categoryId === cat.categoryId && t.registrationOpen);
  if (!tournament) return;

  const required = tournament.perTeam;
  const mentions = Array.from(message.mentions.users.keys());

  // Extract team name: any non-empty line stripped of mentions and decorative chars
  const cleanedLines = message.content
    .split('\n')
    .map((l) => l.replace(/<@!?\d+>/g, '').replace(/^[\s\-=_*•|>]+|[\s\-=_*•|>]+$/g, '').trim())
    .filter(Boolean);
  const teamName = (cleanedLines[0] || '').slice(0, 50);

  // Wrong format → cross
  if (!teamName || mentions.length !== required) {
    await message.react('❌').catch(() => {});
    return;
  }

  // Tournament full → cross
  if (tournament.slots.length >= tournament.slotsTotal) {
    await message.react('❌').catch(() => {});
    return;
  }

  const captainId = mentions[0];
  const memberIds = mentions.slice(1);

  // Duplicate captain → warn
  if (tournament.slots.some((s) => s.captainId === captainId)) {
    await message.react('⚠️').catch(() => {});
    return;
  }

  tournament.slots.push({ teamName, captainId, memberIds });
  await saveGuildData(message.guild.id);

  // Grant IDP access role to captain
  if (data.idpAccessRoleId) {
    const cap = await message.guild.members.fetch(captainId).catch(() => null);
    if (cap) cap.roles.add(data.idpAccessRoleId).catch(() => {});
  }

  // Confirmation in confirm-teams channel
  const confirmCh = message.guild.channels.cache.get(cat.channels['confirm-teams']);
  if (confirmCh) {
    confirmCh.send({
      embeds: [new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setTitle(`✅ ${tournament.name} — Slot ${tournament.slots.length} Confirmed`)
        .addFields(
          { name: 'Team', value: teamName, inline: true },
          { name: 'Captain', value: `<@${captainId}>`, inline: true },
          { name: 'Members', value: memberIds.map((m) => `<@${m}>`).join(', '), inline: false },
        )
        .setTimestamp()],
    }).catch(() => {});
  }

  await message.react('✅').catch(() => {});
  await refreshSlotListMessage(message.guild, data, tournament).catch(() => {});
}
