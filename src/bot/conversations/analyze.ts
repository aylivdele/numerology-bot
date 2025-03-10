import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { Keyboard } from 'grammy'

export async function analyzeConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  const strongs = 'Сильные стороны и таланты'
  const path = 'Кармический путь'
  const growth = 'Лучшие периоды для роста'

  const keyboard = new Keyboard().resized().persistent().text(strongs).text(path).text(growth)

  await ctx.reply('Я могу сделать персональный разбор твоей личности и сильных сторон', { reply_markup: keyboard })

  const select = await conversation.form.select([strongs, path, growth], {
    otherwise: ctx => ctx.reply('Пожалуйста, используйте кнопки'),
  })

  const session = await conversation.external(ctx => ctx.session)

  const prompt = `Запрос: анализ личности - ${select}
  Имя пользователя: ${session.name}
  Дата рождения: ${session.birthday}
  Предпочитаемый формат прогнозов: ${session.format}
  Интересующие темы: ${session.interests.join(', ')}
  `

  await ctx.reply(`Разбор ваших сильных сторон:\n\n<Ответ нейронки на следующий промт:\n ${prompt}>`)

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
