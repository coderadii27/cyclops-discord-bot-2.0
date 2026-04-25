import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { errorEmbed } from '../utils/embeds.js';

export default {
  name: 'memes',
  data: new SlashCommandBuilder()
    .setName('memes')
    .setDescription('Get a random meme.'),
  async execute({ interaction }) {
    await interaction.deferReply();
    try {
      const subs = ['memes', 'dankmemes', 'wholesomememes', 'me_irl', 'funny'];
      const sub = subs[Math.floor(Math.random() * subs.length)];
      const res = await fetch(`https://meme-api.com/gimme/${sub}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      const embed = new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(json.title?.slice(0, 256) || 'Random Meme')
        .setURL(json.postLink)
        .setImage(json.url)
        .setFooter({ text: `r/${json.subreddit} • 👍 ${json.ups}` });
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed('Could not fetch a meme right now. Try again in a moment.')] });
    }
  },
};
