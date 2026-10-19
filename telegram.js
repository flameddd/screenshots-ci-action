import { Bot } from 'node-telegram-bot-api';
import { fromPath } from 'node-telegram-bot-api/node';

const OPTIONS = { disable_notification: true };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function telegram({ teleChatId, teltBotToken, files, path }) {
  try {
    if (!files.length) {
      return;
    }

    const bot = new Bot(teltBotToken);
    const chatId = teleChatId;
    const fileSets = Array.from(
      { length: Math.ceil(files.length / 10) },
      (_, index) => files.slice(index * 10, index * 10 + 10)
    );

    for (const fileSet of fileSets) {
      if (fileSet.length === 1) {
        const fileName = fileSet[0];
        await bot.api.sendPhoto({
          chat_id: chatId,
          photo: await fromPath(`${path}${fileName}`),
          disable_notification: OPTIONS.disable_notification,
          caption: fileName,
        });
      } else {
        await bot.api.sendMediaGroup({
          chat_id: chatId,
          media: await Promise.all(
            fileSet.map(async (fileName) => ({
              type: 'photo',
              caption: fileName,
              media: await fromPath(`${path}${fileName}`),
            }))
          ),
          disable_notification: OPTIONS.disable_notification,
        });
      }

      // https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
      // When sending messages inside a particular chat, avoid sending more than one message per second.
      // We may allow short bursts that go over this limit, but eventually you'll
      // begin receiving 429 errors.
      await sleep(2000);
    }
    return;
  } catch (error) {
    console.error(error);
  }
}

export default telegram;
