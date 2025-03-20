import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { MAIN_KEYBOARD, MAIN_MESSAGE, TO_MAIN_MENU } from '#root/bot/conversations/main.js'
import { splitLongText, waitForCallbackQuery } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard, removeAndReplyWithInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { askAI } from '#root/neural-network/index.js'
import { InlineKeyboard } from 'grammy'

export async function forecastConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext, message_id?: number) {
  const week = 'forecast-week'
  const month = 'forecast-month'
  const special = 'forecast-special'

  const keyboard = new InlineKeyboard().text('На неделю', week).row().text('На месяц', month).row().text('Специальный разбор', special)

  message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Выбери, на какой период тебе нужен прогноз', keyboard, message_id))?.message_id ?? message_id

  const result = await waitForCallbackQuery(conversation, /^forecast-\w+$/, keyboard, message_id)
  const period = result.data
  message_id = result.message_id ?? message_id

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
      message_id = (await removeAndReplyWithInlineKeyboard(ctx, 'Введите конкретный запрос (например, "Какой день выбрать для сделки?")', new InlineKeyboard(), message_id))?.message_id ?? message_id
      periodString = await conversation.form.text({
        otherwise: ctx => ctx.reply('Извините, на данный момент принимаются только текстовые запросы', { reply_markup: { force_reply: true } }),
      })
  }

  const session = await conversation.external(ctx => ctx.session)

  const prompt = `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  ${period === special ? 'У меня вопрос: ' : 'Мне нужен '} ${periodString}
  Дай ответ в формате "${session.format}"`

  const errorAnswer = 'Ошибка, обратитесь к администрации'

  if (period === special) {
    message_id = (await ctx.reply('Ждем ответа от звезд...'))?.message_id ?? message_id
  }
  else {
    message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Ждем ответа от звезд...', new InlineKeyboard(), message_id))?.message_id ?? message_id
  }
  let stickerMessage = await ctx.reply('🌕')

  let answer = (await conversation.external(async () => await askAI(prompt).then(result => splitLongText(result)).catch(() => null))) ?? ['Ошибка, обратитесь к администрации']

  await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)

  for (let i = 0; i < answer.length; i++) {
    if (i === 0 && ctx.chat?.id && message_id) {
      ctx.api.editMessageText(ctx.chat!.id, message_id, answer[i])
    }
    else {
      await ctx.reply(answer[i])
    }
  }

  if (answer[0] !== errorAnswer) {
    const advice = 'advice-advice'

    const secondKeyboard = new InlineKeyboard().text('Получить совет', advice).row().text(TO_MAIN_MENU, 'advice-main-menu')

    message_id = (await ctx.reply('Вы также можете получить советы по прогнозу (детализация прогноза + что делать)', { reply_markup: secondKeyboard }))?.message_id

    const result = await waitForCallbackQuery(conversation, /^advice-\w+$/, secondKeyboard, message_id)
    const select = result.data
    message_id = result.message_id ?? message_id

    if (select === advice) {
      message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Ждем ответа от звезд...', new InlineKeyboard(), message_id))?.message_id ?? message_id
      stickerMessage = await ctx.reply('🌕')
      answer = (await conversation.external(async () => await askAI('Детализируй прогноз и дай советы "что делать".', prompt, answer.join('\n\n')).then(result => splitLongText(result)).catch(() => null))) ?? [errorAnswer]

      await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)
      for (let i = 0; i < answer.length; i++) {
        if (i === 0 && ctx.chat?.id && message_id) {
          await ctx.api.editMessageText(ctx.chat!.id, message_id, answer[i])
        }
        else {
          await ctx.reply(answer[i])
        }
      }
    }
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
