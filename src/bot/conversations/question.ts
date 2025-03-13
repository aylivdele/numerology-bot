import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { splitLongText } from '#root/bot/helpers/conversation.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { askAI } from '#root/neural-network/index.js'

export async function questionConversation(conversation: Conversation<Context, Context>, ctx: Context) {
  await ctx.reply(`Сформулируйте свой вопрос. Например:
    "Когда лучше начинать новый проект?"
    "Стоит ли менять работу в этом месяце?"`, { reply_markup: { remove_keyboard: true } })

  const select = await conversation.form.text({
    otherwise: ctx => ctx.reply('Извините, на данный момент принимаются только текстовые запросы'),
  })

  const session = await conversation.external(ctx => ctx.session)

  const prompt = `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  У меня вопрос: ${select}.
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
