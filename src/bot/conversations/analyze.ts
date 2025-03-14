import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { splitLongText } from '#root/bot/helpers/conversation.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { askAI } from '#root/neural-network/index.js'
import { Keyboard } from 'grammy'

export async function analyzeConversation(conversation: Conversation<Context, Context>, ctx: Context) {
  const strongs = 'Сильные стороны и таланты'
  const path = 'Кармический путь'
  const growth = 'Лучшие периоды для роста'

  const keyboard = new Keyboard().resized().persistent().text(strongs).text(path).text(growth)

  await ctx.reply('Я могу сделать персональный разбор твоей личности и сильных сторон', { reply_markup: keyboard })

  const select = await conversation.form.select([strongs, path, growth], {
    otherwise: ctx => ctx.reply('Пожалуйста, используйте кнопки'),
  })

  const session = await conversation.external(ctx => ctx.session)

  let question = ''

  switch (select) {
    case strongs:
      question = 'Расскажи про мои сильные стороны и таланты'
      break
    case path:
      question = 'Расскажи про мой кармический путь'
      break
    case growth:
      question = 'Расскажи про мои лучшие периоды для роста'
      break
  }

  const prompt = `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  ${question}
  Дай ответ в формате "${session.format}"`

  const waitMsg = await ctx.reply('Ждем ответа от звезд...', { reply_markup: removeKeyboard })

  const answer = (await conversation.external(async () => await askAI(prompt).then(result => splitLongText(result)).catch(() => null))) ?? ['Ошибка, обратитесь к администрации']

  for (let i = 0; i < answer.length; i++) {
    if (i === 0) {
      ctx.api.editMessageText(waitMsg.chat.id, waitMsg.message_id, answer[i])
    }
    else {
      await ctx.reply(answer[i])
    }
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
