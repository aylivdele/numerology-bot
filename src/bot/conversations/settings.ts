import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { ReplyKeyboardMarkup } from '@grammyjs/types'
import type { Context as DefaultContext } from 'grammy'
import { ForecastFormat, Interests } from '#root/bot/context.js'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { updateSession } from '#root/bot/helpers/conversation.js'
import { Keyboard } from 'grammy'

export async function changeSettingsConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  const interests = 'Изменить интересующие темы'
  const format = 'Выбрать формат прогнозов'
  const cancel = 'Отмена'
  const keyboard = new Keyboard().text(interests).text(format).row().text(cancel).persistent().resized()

  await ctx.reply('Что вы хотите изменить?', { reply_markup: keyboard })

  const select = await conversation.form.select([interests, format, cancel], {
    otherwise: ctx => ctx.reply('Пожалуйста, используйте кнопки'),
  })

  switch (select) {
    case interests:
      await interestsSettingsConversation(conversation, ctx)
      await ctx.reply('Настройки успешно изменены')
      break
    case format:
      await formatSettingsConversation(conversation, ctx)
      await ctx.reply('Настройки успешно изменены')
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}

export async function settingsConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  await ctx.reply('Введите ваше имя', { reply_markup: { remove_keyboard: true } })

  const name = await conversation.form.text({
    otherwise: ctx => ctx.reply('Пожалуйста, введите имя'),
  })
  await updateSession(conversation, 'name', name)

  await ctx.reply('Введите дату рождения (дд.мм.гггг), чтобы я мог учитывать твои индивидуальные ритмы', { reply_markup: { remove_keyboard: true } })

  while (true) {
    ctx = await conversation.wait()

    if (ctx.hasText(/(\d{2})[./\\](\d{2})[./\\](\d{4})/)) {
      const birthday = `${ctx.match[2]}.${ctx.match[1]}.${ctx.match[3]}`
      const date = Date.parse(birthday)
      if (!Number.isNaN(date) && date > -2177452800000) {
        await updateSession(conversation, 'birthday', birthday)
        break
      }
      ctx.reply('Пожалуйста, введите корректную дату рождения в формате "дд.мм.гггг"')
    }
    else {
      await ctx.reply('Пожалуйста, введите дату рождения в формате "дд.мм.гггг"')
    }
  }

  await interestsSettingsConversation(conversation, ctx)

  await formatSettingsConversation(conversation, ctx)

  const toForecasts = 'Перейти к прогнозам'
  const toSettings = 'Изменить данные'

  const keyboard: ReplyKeyboardMarkup = {
    is_persistent: true,
    resize_keyboard: true,
    keyboard: [[
      {
        text: toForecasts,
      },
      {
        text: toSettings,
      },
    ]],
  }

  await ctx.reply('Твои данные сохранены. Теперь ты можешь получать персональные прогнозы и разборы!', { reply_markup: keyboard })

  const nextStep = await conversation.form.select([toForecasts, toSettings], {
    otherwise: ctx => ctx.reply('Пожалуйста, используй кнопки'),
  })

  switch (nextStep) {
    case toForecasts:
      ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
      break
    case toSettings:
      return await settingsConversation(conversation, ctx)
      break
  }
}

export async function interestsSettingsConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  const selectedInterests: Interests[] = (await conversation.external(ctx => ctx.session.interests)) ?? []

  let menu = conversation.menu()

  for (const entry of Object.entries(Interests).filter(([key]) => Number.isNaN(Number(key)))) {
    const value = entry[1]
    menu = menu.text(() => `${selectedInterests.includes(value) ? '✅' : '❌'} ${value}`, async (ctx) => {
      const index = selectedInterests.indexOf(value)
      if (index > -1) {
        selectedInterests.splice(index)
      }
      else {
        selectedInterests.push(value)
      }
      ctx.menu.update()
    })
  }

  menu = menu.row().text({ text: 'Сохранить', payload: 'saved' })

  const menuMessage = await ctx.reply('Выберите, какие темы вам наиболее интересны (можно выбрать несколько)', { reply_markup: menu })
  await conversation.waitForCallbackQuery(/saved/g, {
    otherwise: ctx => ctx.reply('Пожалуйста, выберите темы из меню и нажмите "Сохранить"'),
  })

  ctx.api.editMessageReplyMarkup(menuMessage.chat.id, menuMessage.message_id, { reply_markup: { inline_keyboard: [] } })
  await updateSession(conversation, 'interests', [...selectedInterests])
}

export async function formatSettingsConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext) {
  const buttonsMenu: ReplyKeyboardMarkup = {
    is_persistent: true,
    resize_keyboard: true,
    keyboard: [],
  }

  const menuArray = []

  for (const entry of Object.entries(ForecastFormat).filter(([key]) => Number.isNaN(Number(key)))) {
    menuArray.push(entry[1])
  }

  buttonsMenu.keyboard.push(menuArray)

  await ctx.reply('Как вам удобнее воспринимать прогнозы?', { reply_markup: buttonsMenu })

  const format = await conversation.form.select(menuArray, {
    otherwise: ctx => ctx.reply('Пожалуйста, выберите вариант из меню'),
  })

  await updateSession(conversation, 'format', format)
}
