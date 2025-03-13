import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import { EXTEND_FORECAST, TO_MAIN_MENU } from '#root/bot/conversations/main.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logger } from '#root/logger.js'
import { askAI } from '#root/neural-network/index.js'
import { Keyboard } from 'grammy'

export async function forecastConversation(conversation: Conversation<Context, Context>, ctx: Context) {
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

  const prompt = `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  ${period === special ? 'У меня вопрос: ' : 'Мне нужен '} ${periodString}
  Дай ответ в формате "${session.format}"`

  const waitMsg = await ctx.reply('Ждем ответа от звезд...', { reply_markup: removeKeyboard })

  const errorAnswer = 'Ошибка, обратитесь к администрации'

  const secondKeyboard = new Keyboard().persistent().resized().text(EXTEND_FORECAST).row().text(TO_MAIN_MENU)

  conversation.external((ctx) => {
    ctx.session.isWaiting = true
    askAI(prompt).catch(() => null).then(async (ans) => {
      if (ans?.completion_id) {
        ctx.session.lastCompletion = ans.completion_id
      }
      await ctx.api.editMessageText(waitMsg.chat.id, waitMsg.message_id, `${periodString}\n${ans?.content ?? errorAnswer}`)
        .catch((reason) => {
          logger.error(reason, 'Could not edit message')
          return ctx.reply(`${periodString}\n${ans ?? errorAnswer}`)
        })

      await ctx.reply('Вы также можете получить советы по прогнозу (детализация прогноза + что делать)', { reply_markup: secondKeyboard })
    }).finally(() => ctx.session.isWaiting = false)
  })
}
