import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { MAIN_KEYBOARD, MAIN_MESSAGE, TO_MAIN_MENU } from '#root/bot/conversations/main.js'
import { Keyboard } from 'grammy'

export async function forecastConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  const week = 'На неделю'
  const month = 'На месяц'
  const special = 'Специальный разбор'

  const keyboard = new Keyboard().resized().persistent().text(week).text(month).text(special)

  await ctx.reply('Выбери, на какой период тебе нужен прогноз', { reply_markup: keyboard })

  const period = await conversation.form.select([week, month, special], {
    otherwise: ctx => ctx.reply('Пожалуйста, используйте кнопки'),
  })

  const formatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' }

  const currentDate = new Date(await conversation.now())
  const currentDateString = currentDate.toLocaleDateString('ru-RU', formatOptions)

  let nextDate
  let nextDateString
  let periodString
  switch (period) {
    case week:
      nextDate = new Date(currentDate)
      nextDate.setDate(currentDate.getDate() + 7)
      nextDateString = nextDate.toLocaleDateString('ru-RU', formatOptions)
      periodString = `Прогноз на неделю: ${currentDateString} - ${nextDateString}`
      break
    case month:
      nextDate = new Date(currentDate)
      nextDate.setMonth(currentDate.getMonth() + 1)
      nextDateString = nextDate.toLocaleDateString('ru-RU', formatOptions)
      periodString = `Прогноз на месяц: ${currentDateString} - ${nextDateString}`
      break
    case special:
      await ctx.reply('Введите конкретный запрос (например, "Какой день выбрать для сделки?")', { reply_markup: { remove_keyboard: true } })
      periodString = await conversation.form.text({
        otherwise: ctx => ctx.reply('Извините, на данный момент принимаются только текстовые запросы'),
      })
  }

  const session = await conversation.external(ctx => ctx.session)

  const prompt = `Запрос: ${periodString}
  Имя пользователя: ${session.name}
  Дата рождения: ${session.birthday}
  Предпочитаемый формат прогнозов: ${session.format}
  Интересующие темы: ${session.interests.join(', ')}
  `

  await ctx.reply(`${periodString}\n\n<Ответ нейронки на следующий промт:\n ${prompt}>`)

  const advice = 'Получить совет'
  const secondKeyboard = new Keyboard().persistent().resized().text(advice).row().text(TO_MAIN_MENU)

  await ctx.reply('Вы также можете получить советы по прогнозу (детализация прогноза + что делать)', { reply_markup: secondKeyboard })
  const select = await conversation.form.select([advice, TO_MAIN_MENU], {
    otherwise: ctx => ctx.reply('Пожалуйста, используйте кнопки'),
  })

  if (select === advice) {
    await ctx.reply('<Ответ нейронки на запрос с детализацией запроса>')
  }
  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
