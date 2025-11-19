const triggerCooldowns = new Map(); // key = trigger response, value = last timestamp
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
    "You want a joke? **You.** 😐", "I used to have morals. I sold them for Wi-Fi and some steak.", "Why did Momo cross the road? Probably to avoid me.", "They told me to 'lighten up,' so I set the office on fire.", "Why don't I tell knock-knock jokes? Because I prefer breaking in.", "What do you call it when I take accountability? Fiction.", "Why don't I meditate? The voices get competitive.", "Why do people call me unhinged? Because the door broke first.", "What's black, white, and red all over? My PR report after the last scandal.", "I told Torao to break a leg before rehearsal. He thought I meant figuratively. I didn't.", "Touma once said I should chill. So I adjusted the thermostat to 7°C.", "Momo said I should stop talking. So I created a podcast. Stay tuned.", "They said 'don't take things personally.' So I started taking people personally.",
  ],
  confessions: [
    "I once replaced Shiro's shampoo with frosting.", "I wrote a fan letter to Riku once… but I never sent it.", "I left a message for Momo… subtle enough to haunt him for days.", "Shiro's coffee had salt instead of sugar. I wonder who replaced it....", "I once replaced Shiro's alarm with a recording of me yelling. He loved it. 😇", "I put a toy snake in Touma's bag. He did not like that. Minami did seem to, though.", "Ever drawn on someone's face while they were sleeping? I have. Several time. On Shiro's.", "I cheat at wordle.", "I've considered making Touma take English lessons. I did want him to make a fool of himself before but not THIS badly.", "Re:vale's diss track about me was pretty good... Tch.", "I've been working out more frequently lately.", "... I miss seeing them.",
  ],
  
  fortunes: [
    "You will find something you didn't lose… probably on fire.", "Your plans will succeed… in ways you didn't want.", "Your secrets are safe… until I find them.", "Beware of friends bearing gifts… or just beware in general.", "Someone will make you smile today. Or scream. Or cry. Or scream and cry. Could go either way.", "Life throws curveballs… you might just catch one in the face.", "Someone is watching you. I'm just letting you know.", "Expect the unexpected… but slightly worse than expected.", "Your luck is as stable as a clown on a unicycle.", "The stars are aligned… mostly for me, but you can enjoy it too I guess.",
  ],
  apologies: [
    "Sorry...... AS IF. LOSER.", "Really? You really think I'd apologize? That's cute.", "I'm sorry... for being sexier and smarter than you.", "I think getting arrested was punishment enough.", "LMAO, you're funny.", "My bad. Just kidding. Your bad.", "Oops! ...Anyway.", "Sorry, I don't take accountability on weekends.", "Sorry? I don't even know that word.", "I'm sorry you thought I'd say sorry.", "Apologies are for people who care.", "HAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHA.",
  ],
};

// NEW TRIGGERS - in priority order (first match wins)
const TRIGGERS = [
  {
    pattern: /taiyou\s+no\s+esperanza/i,
    response: "Their diss track sucked."
  },
  {
    pattern: /taiyo\s+no\s+esperanza/i,
    response: "Their diss track sucked."
  },
  {
    pattern: /太陽のEsperanza/,
    response: "Their diss track sucked."
  },
  {
    pattern: /skibidi|rizz|gyatt|what\s+the\s+sigma/i,
    response: "Skibidi toilet rizz gyatt ohio what the sigma no cap."
  },
  {
    // matches messages that contain both 'ignore' and 'ryo'/'ryou' anywhere
    pattern: /\b(?=.*\bignore\b)(?=.*\b(?:ryo|ryou)\b).*/i,
    response: "Hey, don't ignore me."
  },
  {
    // matches messages that contain both 'torao/tora' and 'stunt/stunts' anywhere
    pattern: /\b(?=.*\b(?:torao|tora)\b)(?=.*\b(?:stunts?|stunt)\b).*/i,
    response: "Torao's stunts are actually pretty cool. **Don't you dare tell him I said that.**",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms
  },
  {
    pattern: /(shiro|shirou).+heights/i,
    response: "Shiro's fear of heights is pathetic. He won't even get on a Ferris wheel with me.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms

  },
  {
    pattern: /(minami|mina).+(acting|act)/i,
    response: "Minami needs to stop doing such scary acting roles.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms

  },
  {
    pattern: /(shiro|shirou).+(ryo|ryou)/i,
    response: "Shiro keeps telling everyone he's my only friend. He's lying. Absolutely lying. Nope.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms

  },
  {
    // touma/toma and dog/puppy anywhere
    pattern: /\b(?=.*\b(?:touma|toma)\b)(?=.*\b(?:dog|puppy)\b).*/i,
    response: "Touma should've worn a dog collar like I asked.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms

  },
  {
    // torao/tora + cook conjugations anywhere
    pattern: /\b(?=.*\b(?:torao|tora)\b)(?=.*\bcook(?:s|ed|ing)?\b).*/i,
    response: "People say Touma's the worst cook in ŹOOĻ, but honestly, Torao is worse.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms
  },
  {
    // touma/toma + cook conjugations anywhere
    pattern: /\b(?=.*\b(?:touma|toma)\b)(?=.*\bcook(?:s|ed|ing)?\b).*/i,
    response: "People say Touma's the worst cook in ŹOOĻ, but honestly, Torao is worse.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms
  },
  {
    // touma/toma + meat keywords anywhere
    pattern: /\b(?=.*\b(?:touma|toma)\b)(?=.*\b(?:meat|bbq|barbeque|barbecue)\b).*/i,
    response: "Tch. Touma only ever eats meat. His diet is so unbalanced.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms
  },
  {
    pattern: /(trg|trigger).+(is\s+)?(the\s+best|is\s+cool|is\s+awesome)/i,
    response: "ŹOOĻ is better."
  },
{
  pattern: /\brevale\b/i,
  response: "Ugh. My day is Re:uined."
},
  {
    pattern: /re:vale.+(is\s+)?(the\s+best|is\s+cool|is\s+awesome)/i,
    response: "ŹOOĻ is better."
  },
  {
    pattern: /(idolish7|i7|ainana).+(is\s+)?(the\s+best|is\s+cool|is\s+awesome)/i,
    response: "ŹOOĻ is better."
  },
  {
    pattern: /ryuu|ryu|ryunosuke/i,
    response: "Ryu—… Ugh. I do NOT like that guy."
  },
{
  pattern: /\briku\b/i,
  response: "I love Riku 😍😍🥰😘"
},
{
  pattern: /\bmomo\b/i,
  response: "Tch, Momo..... 🙄"
},
{
  pattern: /\bi\s+(\w+\s+)*love\s+z[oō]+l\b/i,
  response: "Heh... ~~I love them too~~."
},
  {
    pattern: /(haruka|haru).+(child|son|kid)/i,
    response: "Haruka's my favorite kid, easily."
  },
  {
    pattern: /(haruka|haru).+(granny|grandma|grandmother)/i,
    response: "Haruka's grandmother is a lovely lady."
  },
  {
    // New: Grandma Isumi trigger (matches when both grandma/granny/grandmother and isumi appear)
    pattern: /\b(?=.*\b(?:grandma|granny|grandmother)\b)(?=.*\bisumi\b).*/i,
    response: "Haruka's grandmother is a lovely lady."
  },
  {
    pattern: /(touma|toma).+english/i,
    response: "Touma should never speak English again. He's embarrassing me.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms
  },
   {
    pattern: /(touma|toma).+engrish/i,
    response: "Touma should never speak English again. He's embarrassing me.",
    cooldown: 2 * 60 * 1000 // 2 minutes in ms
  },
  {
    pattern: /(torao|tora).+house/i,
    response: "I broke into Torao's house once."
  },
  {
    pattern: /yuki|yukito/i,
    response: "Ugh... the Y word."
  },
  {
    // Matches when both 'moonlight' and 'ichiro' appear anywhere (order-insensitive)
    pattern: /\b(?=.*\bmoonlight\b)(?=.*\bichiro\b).*/i,
    response: "You called?"
  },
  {
    pattern: /i\s+miss\s+zool/i,
    response: "~~I miss them too…~~"
  },
  {
    pattern: /re:vale/i,
    response: "Ugh. My day is Re:uined."
  },
  {
    pattern: /i\s+love\s+(shiro|shirou)/i,
    response: "What about me?"
  },
  {
    pattern: /is\s+sexy/i,
    response: "I'm sexier."
  },
  {
    pattern: /is\s+hot/i,
    response: "I'm hotter."
  },
  {
    pattern: /(is\s+)?(so\s+)?(cute|adorable)/i,
    response: "I'm cuter."
  },
  {
    pattern: /is\s+handsome/i,
    response: "I'm more handsome."
  },
  {
    // Matches I'm / im / i’m / i`m / i m hungry (apostrophe-optional and whitespace tolerant)
    pattern: /\bi['’`]?m\s*hungry\b/i,
    response: "Hi Hungry, I'm Ryo."
  },
  {
    // Matches variations of I'm/He's/She's cooking (apostrophe optional) and supports cook conjugations
    pattern: /\b(?:i['’`]?m|he['’`]?s|she['’`]?s)\b\s*cook(?:s|ed|ing)?\b/i,
    response: "I'm better at cooking."
  },
  {
    // Matches messages that mention ryo/ryou and also contain where/what/doing/up to
    pattern: /\b(?=.*\b(?:ryo|ryou)\b)(?=.*\b(?:where|what|doing|up\s*to)\b).*/i,
    response: "Not in jail, that's for sure. Haha."
  },
  {
    pattern: /ryo|ryou/i,
    response: "I'm Moonlight Ichiro."
  },
  {
    // minami/mina + eat conjugations anywhere
    pattern: /\b(?=.*\b(?:minami|mina)\b)(?=.*\b(?:eat|eats|ate|eating)\b).*/i,
    response: "Minami big back."
  }
];

class ImprovedMarkovChain {
  constructor() {
    this.chain = {};
    this.wordFrequency = {};
    this.sentenceStarters = [];
    this.commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
  }

  cleanMessage(text) {
    // Remove URLs
    text = text.replace(/https?:\/\/[^\s]+/g, '');
    // Remove Discord mentions
    text = text.replace(/<@!?[0-9]+>/g, '');
    // Remove channel mentions
    text = text.replace(/<#[0-9]+>/g, '');
    // Remove custom emojis
    text = text.replace(/<a?:[a-zA-Z0-9_]+:[0-9]+>/g, '');
    // Remove bold, italic, underline, strikethrough markdown
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/~~([^~]+)~~/g, '$1');
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    // Remove extra special characters but keep basic punctuation
    text = text.replace(/[^\w\s.,!?'-]/g, ' ');
    // Replace multiple spaces with single space
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  addMessage(text) {
    text = this.cleanMessage(text);
    if (!text || text.length < 3) return;

    const words = text.split(' ').filter(word => word.length > 0);
    if (words.length < 2) return;

    // Track sentence starters (words that start with capital or follow sentence-ending punctuation)
    for (let i = 0; i < words.length; i++) {
      if (i === 0 || (i > 0 && /[\.\!\?]\s*$/.test(words[i-1]))) {
        this.sentenceStarters.push(words[i]);
      }
    }

    // Build the chain and track word frequencies
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i].toLowerCase();
      const nextWord = words[i + 1].toLowerCase();

      if (!this.chain[word]) {
        this.chain[word] = [];
      }
      this.chain[word].push(nextWord);

      // Track word frequencies for better word selection
      this.wordFrequency[word] = (this.wordFrequency[word] || 0) + 1;
    }
  }

  generate(minWords = 6, maxWords = 20) {
    const keys = Object.keys(this.chain);
    if (keys.length === 0) return null;

    // Try to start with a sentence starter for more natural beginnings
    let word;
    if (this.sentenceStarters.length > 0 && Math.random() < 0.7) {
      const starter = this.sentenceStarters[Math.floor(Math.random() * this.sentenceStarters.length)].toLowerCase();
      word = this.chain[starter] ? starter : keys[Math.floor(Math.random() * keys.length)];
    } else {
      // Prefer more common words as starting points
      const sortedKeys = keys.sort((a, b) => (this.wordFrequency[b] || 0) - (this.wordFrequency[a] || 0));
      const topKeys = sortedKeys.slice(0, Math.min(20, sortedKeys.length));
      word = topKeys[Math.floor(Math.random() * topKeys.length)];
    }

    const result = [word];
    const targetLength = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    let consecutiveCommonWords = 0;
    let lastPunctuation = -1;

    for (let i = 0; i < targetLength - 1; i++) {
      const nextWords = this.chain[word];
      if (!nextWords || nextWords.length === 0) break;

      // Weight word selection to avoid too many common words
      let candidates = nextWords;
      if (this.commonWords.has(nextWords[0]) && consecutiveCommonWords > 2) {
        candidates = nextWords.filter(w => !this.commonWords.has(w));
        if (candidates.length === 0) candidates = nextWords;
      }

      word = candidates[Math.floor(Math.random() * candidates.length)];
      result.push(word);

      // Track consecutive common words
      if (this.commonWords.has(word)) {
        consecutiveCommonWords++;
      } else {
        consecutiveCommonWords = 0;
      }

      // Check for sentence endings
      if (/[\.!?]/.test(word)) {
        lastPunctuation = result.length - 1;
        // Sometimes end the sentence naturally
        if (Math.random() < 0.3 && result.length >= minWords) {
          break;
        }
      }

      // Force sentence ending if we're getting too long
      if (result.length >= maxWords - 2 && lastPunctuation > 0) {
        result = result.slice(0, lastPunctuation + 1);
        break;
      }
    }

    const sentence = result.join(' ');
    
    // Capitalize first letter and add punctuation if missing
    if (sentence.length > 0) {
      const capitalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      if (!/[\.!?]$/.test(capitalized) && Math.random() < 0.8) {
        return capitalized + (Math.random() < 0.6 ? '.' : Math.random() < 0.5 ? '!' : '?');
      }
      return capitalized;
    }

    return result.length >= minWords ? sentence : null;
  }
}

const markov = new ImprovedMarkovChain();

function checkCooldown(userId) {
  const now = Date.now();
  const userCooldown = config.cooldowns.get(userId);

  if (userCooldown && now - userCooldown < config.cooldownTime) {
    return true;
  }

  config.cooldowns.set(userId, now);
  return false;
}

function checkKeywordTriggers(content) {
  const cleanContent = content.toLowerCase().trim();

  for (const trigger of TRIGGERS) {
    if (trigger.pattern.test(cleanContent)) {
      // Check cooldown if it exists
      if (trigger.cooldown) {
        const lastUsed = triggerCooldowns.get(trigger.response) || 0;
        const now = Date.now();

        if (now - lastUsed < trigger.cooldown) {
          return null; // still on cooldown
        }

        // Update last used time
        triggerCooldowns.set(trigger.response, now);
      }

      return trigger.response;
    }
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
  // Ignore bot messages
  if (message.author.bot) return;

  // Handle blacklisted channels
  if (BLACKLISTED_CHANNELS.has(message.channel.id)) {
    if (message.content.startsWith(PREFIX)) {
      return message.reply("Sorry, I don't work in this channel. 😌");
    }
    return;
  }

  if (!message.content.startsWith(PREFIX)) {
    // Add cleaned message to Markov chain
    markov.addMessage(message.content);

    if (messageHistory.length >= MAX_HISTORY) {
      messageHistory.shift();
    }
    messageHistory.push(message.content);

    // Check for keyword triggers
    const triggerResponse = checkKeywordTriggers(message.content);
    if (triggerResponse) {
      if (!checkCooldown(message.author.id)) {
        message.channel.send(triggerResponse);
      }
      return;
    }

    // Random Markov responses
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

  // Handle commands
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
    // Check if user is bot owner OR server owner
    const isBotOwner = message.author.id === BOT_OWNER_ID;
    const isServerOwner = message.author.id === message.guild.ownerId;
    
    if (!isBotOwner && !isServerOwner && !message.member.permissions.has('Administrator')) {
      return message.reply('Only the bot owner or server owner can use this command.');
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
