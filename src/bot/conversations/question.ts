import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'

export async function questionConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  await ctx.reply(`Сформулируйте свой вопрос. Например:
    "Когда лучше начинать новый проект?"
    "Стоит ли менять работу в этом месяце?"`, { reply_markup: { remove_keyboard: true } })

  const select = await conversation.form.text({
    otherwise: ctx => ctx.reply('Извините, на данный момент принимаются только текстовые запросы'),
  })

  const session = await conversation.external(ctx => ctx.session)

  const prompt = `Запрос: ${select}
  Имя пользователя: ${session.name}
  Дата рождения: ${session.birthday}
  Предпочитаемый формат прогнозов: ${session.format}
  Интересующие темы: ${session.interests.join(', ')}
  `

  await ctx.reply(`Разбор ваших сильных сторон:\n\n<Ответ нейронки на следующий промт:\n ${prompt}>`)

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
