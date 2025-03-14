import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import { MAIN_KEYBOARD, MAIN_MESSAGE, TO_MAIN_MENU } from '#root/bot/conversations/main.js'
import { splitLongText } from '#root/bot/helpers/conversation.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
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

  const errorAnswer = 'Ошибка, обратитесь к администрации'

  let waitMsg = await ctx.reply('Ждем ответа от звезд...', { reply_markup: removeKeyboard })

  let answer = (await conversation.external(async () => await askAI(prompt).then(result => splitLongText(result)).catch(() => null))) ?? [errorAnswer]

  for (let i = 0; i < answer.length; i++) {
    if (i === 0) {
      ctx.api.editMessageText(waitMsg.chat.id, waitMsg.message_id, `${periodString}\n${answer[i]}`)
    }
    else {
      await ctx.reply(answer[i])
    }
  }

  const advice = 'Получить совет'
  const secondKeyboard = new Keyboard().persistent().resized().text(advice).row().text(TO_MAIN_MENU)

  if (answer[0] !== errorAnswer) {
    await ctx.reply('Вы также можете получить советы по прогнозу (детализация прогноза + что делать)', { reply_markup: secondKeyboard })
    const select = await conversation.form.select([advice, TO_MAIN_MENU], {
      otherwise: ctx => ctx.reply('Пожалуйста, используйте кнопки'),
    })

    if (select === advice) {
      waitMsg = await ctx.reply('Ждем ответа от звезд...', { reply_markup: removeKeyboard })

      answer = (await conversation.external(async () => await askAI('Детализируй прогноз и дай советы "что делать".', prompt, answer.join('\n\n')).then(result => splitLongText(result)).catch(() => null))) ?? [errorAnswer]

      for (let i = 0; i < answer.length; i++) {
        if (i === 0) {
          ctx.api.editMessageText(waitMsg.chat.id, waitMsg.message_id, answer[i])
        }
        else {
          await ctx.reply(answer[i])
        }
      }
    }
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
