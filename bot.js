const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = 'r!';
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || 'YOUR_USER_ID_HERE';

const BLACKLISTED_CHANNELS = new Set([
  '1424420233623638097',
  '1421851418486243350',
  '1422321398751166474',
  '1422295153762107483',
  '1422302452689932409',
  '1422275724697665607',
  '1422287378353225909',
  '1422287272706965657',
  '1421050879234281565',
  '1422311794382475284',
  '1422341311444418670',
  '1422305834590929086',
]);

const config = {
  cooldowns: new Map(),
  cooldownTime: 5000,
  randomResponseChance: 0.1,
};

const messageHistory = [];
const MAX_HISTORY = 500;

const phrases = {
  jokes: [
    "You want a joke? **You.** 😐", "I used to have morals. I sold them for Wi-Fi and some steak.", "Why did Momo cross the road? Probably to avoid me.", "They told me to ‘lighten up,’ so I set the office on fire.", "Why don’t I tell knock-knock jokes? Because I prefer breaking in.", "What do you call it when I take accountability? Fiction.", "Why don’t I meditate? The voices get competitive.", "Why do people call me unhinged? Because the door broke first.", "What’s black, white, and red all over? My PR report after the last scandal.", "I told Torao to break a leg before rehearsal. He thought I meant figuratively. I didn’t.", "Touma once said I should chill. So I adjusted the thermostat to 7°C.", "Momo said I should stop talking. So I created a podcast. Stay tuned.", "They said ‘don’t take things personally.’ So I started taking people personally.",
  ],
  confessions: [
    "I once replaced Shiro's shampoo with frosting.", "I wrote a fan letter to Riku once… but I never sent it.", "I left a message for Momo… subtle enough to haunt him for days.", "Shiro’s coffee had salt instead of sugar. I wonder who replaced it....", "I once replaced Shiro’s alarm with a recording of me yelling. He loved it. 😇", "I put a toy snake in Touma's bag. He did not like that. Minami did seem to, though.", "Ever drawn on someone's face while they were sleeping? I have. Several time. On Shiro's.", "I cheat at wordle.", "I've considered making Touma take English lessons. I did want him to make a fool of himself before but not THIS badly.", "Re:vale's diss track about me was pretty good... Tch.", "I've been working out more frequently lately.", "... I miss seeing them.",
  ],
  
  fortunes: [
    "You will find something you didn’t lose… probably on fire.", "Your plans will succeed… in ways you didn’t want.", "Your secrets are safe… until I find them.", "Beware of friends bearing gifts… or just beware in general.", "Someone will make you smile today. Or scream. Or cry. Or scream and cry. Could go either way.", "Life throws curveballs… you might just catch one in the face.", "Someone is watching you. I’m just letting you know.", "Expect the unexpected… but slightly worse than expected.", "Your luck is as stable as a clown on a unicycle.", "The stars are aligned… mostly for me, but you can enjoy it too I guess.",
  ],
  apologies: [
    "Sorry...... AS IF. LOSER.", "Really? You really think I'd apologize? That's cute.", "I'm sorry... for being sexier and smarter than you.", "I think getting arrested was punishment enough.", "LMAO, you're funny.", "My bad. Just kidding. Your bad.", "Oops! ...Anyway.", "Sorry, I don’t take accountability on weekends.", "Sorry? I don’t even know that word.", "I'm sorry you thought I'd say sorry.", "Apologies are for people who care.", "HAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHA.",
  ],
};

class MarkovChain {
  constructor() {
    this.chain = {};
  }

  addMessage(text) {
    const words = text.split(' ').filter(word => word.length > 0);
    if (words.length < 2) return;

    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i];
      const nextWord = words[i + 1];

      if (!this.chain[word]) {
        this.chain[word] = [];
      }
      this.chain[word].push(nextWord);
    }
  }

  generate(minWords = 5, maxWords = 15) {
    const keys = Object.keys(this.chain);
    if (keys.length === 0) return null;

    let word = keys[Math.floor(Math.random() * keys.length)];
    const result = [word];

    const targetLength = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;

    for (let i = 0; i < targetLength; i++) {
      const nextWords = this.chain[word];
      if (!nextWords || nextWords.length === 0) break;

      word = nextWords[Math.floor(Math.random() * nextWords.length)];
      result.push(word);
    }

    return result.length >= minWords ? result.join(' ') : null;
  }
}

const markov = new MarkovChain();

function checkCooldown(userId) {
  const now = Date.now();
  const userCooldown = config.cooldowns.get(userId);

  if (userCooldown && now - userCooldown < config.cooldownTime) {
    return true;
  }

  config.cooldowns.set(userId, now);
  return false;
}

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ź/g, 'z')
      .replace(/ļ/g, 'l');
  }

  function checkKeywordTriggers(content) {
    const lowerContent = content.toLowerCase();
    const normalizedContent = normalizeText(content);

    if (lowerContent.includes('riku')) {
      return 'I love Riku 😍😍🥰😘';
    }

    if (lowerContent.includes('momo')) {
      return 'Tch, Momo..... 🙄';
    }

    if (/\bi\s+(\w+\s+)*love\s+z[oō]+l/i.test(normalizedContent)) {
      return 'Heh... ~~I love them too~~.';
    }

    if (/where'?s?\s+(is\s+)?(ryo|ryou)/i.test(lowerContent)) {
      return "I'm on house arrest, what about you?";
    }

    if (/what'?s?\s+(is\s+)?(ryo|ryou)\s+(doing|up\s+to)/i.test(lowerContent)) {
      return "I'm on house arrest, what about you?";
    }

  return null;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  client.user.setPresence({
    activities: [{ name: 'In Your Walls', type: ActivityType.Playing }],
    status: 'online',
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (BLACKLISTED_CHANNELS.has(message.channel.id)) {
    if (message.content.startsWith(PREFIX)) {
      return message.reply("Sorry, I don't work in this channel. 😌");
    }
    return;
  }

  if (!message.content.startsWith(PREFIX)) {
    markov.addMessage(message.content);

    if (messageHistory.length >= MAX_HISTORY) {
      messageHistory.shift();
    }
    messageHistory.push(message.content);

    const triggerResponse = checkKeywordTriggers(message.content);
    if (triggerResponse) {
      if (!checkCooldown(message.author.id)) {
        message.channel.send(triggerResponse);
      }
      return;
    }

    if (Math.random() < config.randomResponseChance) {
      if (!checkCooldown(message.author.id)) {
        const generated = markov.generate();
        if (generated) {
          message.channel.send(generated);
        }
      }
    }
    return;
  }

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'setfrequency') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('You need Administrator permissions to use this command.');
    }

    const frequency = parseFloat(args[0]);
    if (isNaN(frequency) || frequency < 0 || frequency > 100) {
      return message.reply('Please provide a valid frequency between 0 and 100 (as a percentage).');
    }

    config.randomResponseChance = frequency / 100;
    return message.reply(`Bot response frequency set to ${frequency}% (${config.randomResponseChance}).`);
  }

  if (command === 'joke') {
    const joke = phrases.jokes[Math.floor(Math.random() * phrases.jokes.length)];
    return message.channel.send(joke);
  }

  if (command === 'confess') {
    const confession = phrases.confessions[Math.floor(Math.random() * phrases.confessions.length)];
    return message.channel.send(confession);
  }

  if (command === 'fortune') {
    const fortune = phrases.fortunes[Math.floor(Math.random() * phrases.fortunes.length)];
    return message.channel.send(fortune);
  }

  if (command === 'apologize') {
    const apology = phrases.apologies[Math.floor(Math.random() * phrases.apologies.length)];
    return message.channel.send(apology);
  }

  if (command === 'broadcast') {
    if (message.author.id !== BOT_OWNER_ID) {
      return message.reply('Only the bot owner can use this command.');
    }

    const broadcastMessage = args.join(' ');
    if (!broadcastMessage) {
      return message.reply('Please provide a message to broadcast.');
    }

    await message.delete().catch(() => {});
    const sent = await message.channel.send(broadcastMessage);
    console.log(`Broadcast sent: ${sent.id}`);
  }

  if (command === 'editbroadcast') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('You need Administrator permissions to use this command.');
    }

    let targetMessage;
    let newContent;

    if (message.reference) {
      newContent = args.join(' ');
      if (!newContent) {
        return message.reply('Please provide new content for the message.');
      }

      try {
        targetMessage = await message.channel.messages.fetch(message.reference.messageId);
      } catch (error) {
        return message.reply('Failed to fetch the replied message.');
      }
    } else {
      const messageId = args.shift();
      newContent = args.join(' ');

      if (!messageId || !newContent) {
        return message.reply('Usage: r!editbroadcast <message_id> <new_text> OR reply to a message with r!editbroadcast <new_text>');
      }

      try {
        targetMessage = await message.channel.messages.fetch(messageId);
      } catch (error) {
        return message.reply('Failed to edit message. Make sure the message ID is correct and in this channel.');
      }
    }

    if (targetMessage.author.id !== client.user.id) {
      return message.reply('I can only edit my own messages.');
    }

    try {
      await targetMessage.edit(newContent);
      await message.delete().catch(() => {});
      console.log(`Broadcast edited: ${targetMessage.id}`);
    } catch (error) {
      return message.reply('Failed to edit the message.');
    }
  }

  if (command === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#7d35b8')
      .setTitle('Ryo Bot Commands')
      .setDescription('Command prefix: **r!**')
      .addFields(
        { 
          name: 'Fun (?) Commands', 
          value: '• `r!joke` - Get a really funny joke. 😇\n• `r!confess` - Hear a serious confession from me...\n• `r!fortune` - Get a very accurate fortune! Dont tell Minami though.\n• `r!apologize` - Receive an extremely sincere apology.',
          inline: false 
        },
        { 
          name: 'Admin Commands', 
          value: '• `r!setfrequency <0-100>` - Set bot response frequency (percentage)\n• `r!broadcast <message>` - Send a message as the bot\n• `r!editbroadcast <message_id> <text>` - Edit a bot message (or reply to message)',
          inline: false 
        }
      )
      .setFooter({ text: 'A Markov-style Ryo Tsukumo bot • Learning from your messages' })
      .setTimestamp();

    return message.channel.send({ embeds: [helpEmbed] });
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('ERROR: DISCORD_BOT_TOKEN is not set in environment variables.');
  process.exit(1);
}

client.login(token);

// Only needed for Render web service to satisfy port requirement
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000; // Render assigns this automatically
app.get('/', (req, res) => res.send('Ryo bot is alive!'));
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT} (for Render)`);
});

