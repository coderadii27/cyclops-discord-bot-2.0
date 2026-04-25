import { PermissionFlagsBits } from 'discord.js';

export function isMod(member) {
  if (!member) return false;
  return (
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

export function canBan(member) {
  return member?.permissions.has(PermissionFlagsBits.BanMembers);
}

export function canKick(member) {
  return member?.permissions.has(PermissionFlagsBits.KickMembers);
}

export function canMute(member) {
  return member?.permissions.has(PermissionFlagsBits.ModerateMembers);
}

export function canManageMessages(member) {
  return member?.permissions.has(PermissionFlagsBits.ManageMessages);
}

export function canManageChannels(member) {
  return member?.permissions.has(PermissionFlagsBits.ManageChannels);
}

export function canManageNicknames(member) {
  return member?.permissions.has(PermissionFlagsBits.ManageNicknames);
}

export function isAdmin(member) {
  return member?.permissions.has(PermissionFlagsBits.Administrator);
}
