import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js';
import { COLORS } from '../config.js';

export function buildMainPanel(guild, data) {
  const hasCategory = Object.keys(data.tournamentCategories || {}).length > 0;
  const tournamentCount = Object.keys(data.tournaments || {}).length;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PURPLE)
    .setTitle('🏆 CYCLOPS Tournament Manager')
    .setDescription(
      hasCategory
        ? `**CYCLOPS Tourney allows unlimited tournaments.**\n\nUse the buttons below to manage your tournaments.\n\n**Active tournaments:** ${tournamentCount}`
        : `Click **'Create channels'** to get started!\n\n**CYCLOPS Tourney allows unlimited tournaments.**`,
    )
    .setFooter({ text: 'CYCLOPS Tournament System' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tourney:createChannels').setLabel('Create Channels').setStyle(ButtonStyle.Primary).setEmoji('📁'),
    new ButtonBuilder().setCustomId('tourney:createTournament').setLabel('Create Tournament').setStyle(ButtonStyle.Success).setEmoji('🏆').setDisabled(!hasCategory),
    new ButtonBuilder().setCustomId('tourney:editSettings').setLabel('Edit Settings').setStyle(ButtonStyle.Secondary).setEmoji('⚙️').setDisabled(!hasCategory),
    new ButtonBuilder().setCustomId('tourney:toggleReg').setLabel('Start / Pause Reg.').setStyle(ButtonStyle.Secondary).setEmoji('🔁').setDisabled(!hasCategory),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tourney:manageGroups').setLabel('Manage Groups').setStyle(ButtonStyle.Secondary).setEmoji('🧩').setDisabled(!hasCategory),
    new ButtonBuilder().setCustomId('tourney:addSlot').setLabel('Manually Add Slot').setStyle(ButtonStyle.Secondary).setEmoji('➕').setDisabled(!hasCategory),
    new ButtonBuilder().setCustomId('tourney:slotManager').setLabel('Slot Manager Channel').setStyle(ButtonStyle.Secondary).setEmoji('🛠️').setDisabled(!hasCategory),
    new ButtonBuilder().setCustomId('tourney:export').setLabel('MS Excel File').setStyle(ButtonStyle.Secondary).setEmoji('📊').setDisabled(!hasCategory),
  );

  return { embed, components: [row1, row2] };
}

export function buildSlotManagerPanel(tournamentName) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PURPLE)
    .setTitle(`🛠️ Tournament Slot Manager — ${tournamentName}`)
    .setDescription(
      [
        '• Click **Cancel My Slot** below to cancel your slot.',
        '• Click **My Slots** to get info about all your slots.',
        '• Click **Change Team Name** if you want to update your team\'s name.',
        '',
        '_Note that slot cancel is irreversible._',
      ].join('\n'),
    )
    .setFooter({ text: 'CYCLOPS Tournament System' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('slot:cancel').setLabel('Cancel My Slot').setStyle(ButtonStyle.Danger).setEmoji('❌'),
    new ButtonBuilder().setCustomId('slot:my').setLabel('My Slots').setStyle(ButtonStyle.Primary).setEmoji('📋'),
    new ButtonBuilder().setCustomId('slot:rename').setLabel('Change Team Name').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
  );

  return { embed, components: [row] };
}

export function buildSlotListEmbed(tournament) {
  const slots = tournament.slots || [];
  const lines = slots.length
    ? slots.map((s, i) => `**Slot ${String(i + 1).padStart(2, '0')}** → Team **${s.teamName}**`).join('\n')
    : '_No slots filled yet._';

  return new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`📋 ${tournament.name} — Slot List`)
    .setDescription(lines)
    .setFooter({ text: `${slots.length} / ${tournament.slotsTotal} slots filled • Click refresh to update` })
    .setTimestamp();
}

export function buildSlotListComponents() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('slot:refreshList').setLabel('Refresh').setStyle(ButtonStyle.Primary).setEmoji('🔄'),
  )];
}

export function tournamentSelectMenu(customId, tournaments, placeholder = 'Select a tournament') {
  const options = Object.values(tournaments).slice(0, 25).map((t) => ({
    label: t.name.slice(0, 100),
    description: `${(t.slots?.length || 0)}/${t.slotsTotal} slots • registration ${t.registrationOpen ? 'OPEN' : 'PAUSED'}`,
    value: t.id,
  }));
  if (!options.length) {
    options.push({ label: 'No tournaments yet', description: 'Create one first', value: 'none' });
  }
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).addOptions(options),
  );
}
