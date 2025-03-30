import type { Context, ConversationContext } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { ForceReply } from '@grammyjs/types'
import { ForecastFormat, Interests } from '#root/bot/context.js'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { updateSession, waitForCallbackQuery } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard, removeInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { logger } from '#root/logger.js'
import { InlineKeyboard } from 'grammy'

export async function changeSettingsConversation(conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext, message_id?: number) {
  const interests = 'change-interests'
  const format = 'change-format'
  const cancel = 'change-cancel'
  const keyboard = new InlineKeyboard().text('Изменить интересующие темы', interests).row().text('Выбрать формат прогнозов', format).row().text('Отмена', cancel)

  message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Что вы хотите изменить?', keyboard, message_id))?.message_id ?? message_id

  const result = await waitForCallbackQuery(conversation, /^change-\w+$/, keyboard, message_id)

  const data = result.data
  message_id = result.message_id ?? message_id

  switch (data) {
    case interests:
      message_id = (await interestsSettingsConversation(conversation, ctx, message_id)) ?? message_id
      await editOrReplyWithInlineKeyboard(ctx, 'Настройки успешно изменены', undefined, message_id)
      break
    case format:
      message_id = (await formatSettingsConversation(conversation, ctx, message_id)) ?? message_id
      await editOrReplyWithInlineKeyboard(ctx, 'Настройки успешно изменены', undefined, message_id)
      break
    case cancel:
      return await editOrReplyWithInlineKeyboard(ctx, MAIN_MESSAGE, MAIN_KEYBOARD, message_id)
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}

export async function settingsConversation(conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext, message_id?: number) {
  if (message_id) {
    await ctx.api.editMessageText(ctx.chat!.id, message_id, 'Введите ваше имя', { reply_markup: new InlineKeyboard() })
  }
  else {
    await ctx.reply('Введите ваше имя', { reply_markup: { force_reply: true } })
  }

  const name = await conversation.form.text({
    otherwise: (ctx) => {
      return removeInlineKeyboard(ctx)
        .then(() => ctx.reply('Пожалуйста, введите имя', { reply_markup: { force_reply: true } }))
    },
  })
  await updateSession(conversation, 'name', name)

  const dateKeyboard: ForceReply = { input_field_placeholder: 'дд.мм.гггг', force_reply: true }

  await ctx.reply('Введите дату рождения (дд.мм.гггг), чтобы я мог учитывать твои индивидуальные ритмы', { reply_markup: dateKeyboard })

  while (true) {
    const ctx1 = await conversation.waitForHears(/(\d{2})[./\\](\d{2})[./\\](\d{4})/, {
      otherwise: (ctx) => {
        return removeInlineKeyboard(ctx)
          .then(() => ctx.reply('Пожалуйста, введите дату рождения в формате "дд.мм.гггг"', { reply_markup: dateKeyboard }))
      },
    })

    const date = Date.parse(`${ctx1.match[2]}.${ctx1.match[1]}.${ctx1.match[3]}`)
    if (!Number.isNaN(date) && date > -2177452800000) {
      await updateSession(conversation, 'birthday', `${ctx1.match[1]}.${ctx1.match[2]}.${ctx1.match[3]}`)
      break
    }
    await ctx.reply('Пожалуйста, введите корректную дату рождения в формате "дд.мм.гггг"', { reply_markup: dateKeyboard })
  }

  message_id = await interestsSettingsConversation(conversation, ctx)

  message_id = await formatSettingsConversation(conversation, ctx, message_id)

  const toSettings = 'finish-change'
  const toForecasts = 'finish-save'

  const keyboard = new InlineKeyboard().text('Изменить данные', toSettings).row().text('Перейти к прогнозам', toForecasts)

  await ctx.api.editMessageText(ctx.chat!.id, message_id, 'Твои данные сохранены. Теперь ты можешь получать персональные прогнозы и разборы!', { reply_markup: keyboard })

  const result = await waitForCallbackQuery(conversation, /^finish-\w+$/, keyboard, message_id)
  const nextStep = result.data
  message_id = result.message_id ?? message_id

  switch (nextStep) {
    case toForecasts:
      await ctx.api.setMyCommands([{ command: 'main', description: 'Главное меню' }, { command: 'start', description: 'Стартовое меню' }], { scope: { type: 'chat', chat_id: ctx.chat!.id } })
      return await ctx.api.editMessageText(ctx.chat!.id, message_id, MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
    case toSettings:
      return await settingsConversation(conversation, ctx, message_id)
  }
}

export async function interestsSettingsConversation(conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext, message_id?: number) {
  const selectedInterests: Interests[] = (await conversation.external(ctx => ctx.session.interests)) ?? []

  let menu = conversation.menu()

  for (const entry of Object.entries(Interests).filter(([key]) => Number.isNaN(Number(key)))) {
    const value = entry[1]
    menu = menu.text(() => `${selectedInterests.includes(value) ? '✅' : ''} ${value}`, async (ctx) => {
      const index = selectedInterests.indexOf(value)
      if (index > -1) {
        selectedInterests.splice(index, 1)
      }
      else {
        selectedInterests.push(value)
      }
      logger.info(selectedInterests)
      ctx.menu.update()
    })
  }

  menu = menu.row().text({ text: 'Сохранить', payload: 'saved' })

  message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Выберите, какие темы вам наиболее интересны (можно выбрать несколько)', menu, message_id))?.message_id

  const result = await waitForCallbackQuery(conversation, /saved/g, menu, message_id, 'Пожалуйста, выберите темы из меню и нажмите "Сохранить"')
  message_id = result.message_id ?? message_id

  await updateSession(conversation, 'interests', [...selectedInterests])
  return message_id
}

export async function formatSettingsConversation(conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext, message_id?: number) {
  const keyboard: InlineKeyboard = new InlineKeyboard()

  for (const entry of Object.entries(ForecastFormat).filter(([key]) => Number.isNaN(Number(key)))) {
    keyboard.text(entry[1], `format-${entry[0]}`).row()
  }

  let menuMessage: number
  if (message_id && ctx.chat?.id) {
    await ctx.api.editMessageText(ctx.chat.id, message_id, 'Как вам удобнее воспринимать прогнозы?', { reply_markup: keyboard })
    menuMessage = message_id
  }
  else {
    menuMessage = (await ctx.reply('Как вам удобнее воспринимать прогнозы?', { reply_markup: keyboard })).message_id
  }

  const result = await waitForCallbackQuery(conversation, /^format-\w+$/, keyboard, menuMessage)
  menuMessage = result.message_id ?? menuMessage
  // @ts-expect-error da pohuy
  const format: ForecastFormat = ForecastFormat[result.data.substring('format-'.length)]

  await updateSession(conversation, 'format', format)
  return menuMessage
}
