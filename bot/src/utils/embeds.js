import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';

export function successEmbed(description, title) {
  const e = new EmbedBuilder().setColor(COLORS.GREEN).setDescription(description).setTimestamp();
  if (title) e.setTitle(title);
  return e;
}

export function errorEmbed(description, title) {
  const e = new EmbedBuilder().setColor(COLORS.RED).setDescription(description).setTimestamp();
  if (title) e.setTitle(title);
  return e;
}

export function warnEmbed(description, title) {
  const e = new EmbedBuilder().setColor(COLORS.YELLOW).setDescription(description).setTimestamp();
  if (title) e.setTitle(title);
  return e;
}

export function infoEmbed(description, title) {
  const e = new EmbedBuilder().setColor(COLORS.BLUE).setDescription(description).setTimestamp();
  if (title) e.setTitle(title);
  return e;
}

export function brandedFooter(client) {
  return { text: `CYCLOPS • Made with 💗 by Aditya`, iconURL: client.user?.displayAvatarURL() };
}
