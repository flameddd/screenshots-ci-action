const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const OPTIONS = { disable_notification: true };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function telegram({ teleChatId, teltBotToken, files, path }) {
  try {
    const bot = new TelegramBot(teltBotToken);
    let res = [];
    if (files.length === 1) {
      res = await bot.sendPhoto(
        teleChatId,
        fs.createReadStream(`${path}${files[0]}`),
        OPTIONS,
        { filename: files[0] }
      );
    }

    if (files.length < 11) {
      res = await bot.sendMediaGroup(
        teleChatId,
        files.map((fileName) => ({
          type: 'photo',
          caption: fileName,
          media: fs.createReadStream(`${path}${fileName}`),
        })),
        OPTIONS
      );
    }

    if (files.length > 10) {
      const fileSets = [];
      while (files.length !== 0) {
        fileSets.push(files.splice(0, 10));
      }
      for (const fileSet of fileSets) {
        const resTemp = await bot.sendMediaGroup(
          teleChatId,
          fileSet.map((fileName) => ({
            type: 'photo',
            caption: fileName,
            media: fs.createReadStream(`${path}${fileName}`),
          })),
          OPTIONS
        );
        res.push(resTemp);

        // https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
        // When sending messages inside a particular chat, avoid sending more than one message per second.
        // We may allow short bursts that go over this limit, but eventually you'll
        // begin receiving 429 errors.
        await sleep(2000);
      }
    }
    console.log(res);
    return;
  } catch (error) {
    console.error(error);
  }
}

module.exports = telegram;
