import { errorEmbed } from '../utils/embeds.js';
import { handleTournamentButton, handleTournamentSelect, handleTournamentModal } from '../tournament/handlers.js';
import { handleTicketOpen, handleTicketClaim, handleTicketClose } from '../tickets/handlers.js';

export async function handleInteraction(interaction, client) {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) {
        await interaction.reply({ embeds: [errorEmbed('Unknown command.')], ephemeral: true });
        return;
      }
      await cmd.execute({ interaction, client });
      return;
    }

    if (interaction.isAutocomplete()) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (cmd?.autocomplete) await cmd.autocomplete({ interaction, client });
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('tourney:') || interaction.customId.startsWith('slot:')) {
        await handleTournamentButton(interaction, client);
        return;
      }
      if (interaction.customId.startsWith('giveaway:')) {
        const { handleGiveawayButton } = await import('../slashCommands/gstart.js');
        await handleGiveawayButton(interaction, client);
        return;
      }
      if (interaction.customId === 'ticket:open') {
        await handleTicketOpen(interaction);
        return;
      }
      if (interaction.customId === 'ticket:claim') {
        await handleTicketClaim(interaction);
        return;
      }
      if (interaction.customId === 'ticket:close') {
        await handleTicketClose(interaction);
        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('tourney:') || interaction.customId.startsWith('slot:') || interaction.customId.startsWith('export:') || interaction.customId.startsWith('stickdel:')) {
        await handleTournamentSelect(interaction, client);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('tourney:') || interaction.customId.startsWith('slot:')) {
        await handleTournamentModal(interaction, client);
        return;
      }
    }
  } catch (e) {
    console.error('[interaction]', e);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ embeds: [errorEmbed(`Something went wrong: \`${e.message ?? 'unknown'}\``)], ephemeral: true }).catch(() => {});
    }
  }
}
