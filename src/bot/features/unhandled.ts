import type { Context } from '#root/bot/context.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer, InlineKeyboard } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.on('message', logHandle('unhandled-message'), (ctx) => {
  if (checkSession(ctx)) {
    return ctx.reply(ctx.t('unhandled-ready'), { reply_markup: removeKeyboard })
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

feature.on('callback_query', logHandle('unhandled-callback-query'), async (ctx) => {
  if (ctx.callbackQuery.message?.message_id) {
    await ctx.api.editMessageReplyMarkup(ctx.chat.id, ctx.callbackQuery.message.message_id, { reply_markup: new InlineKeyboard() })
  }
  if (checkSession(ctx)) {
    return await ctx.reply('Меню устарело, попробуйте команду /main').finally(() => ctx.answerCallbackQuery())
  }
  return await ctx.reply('Меню устарело, попробуйте команду /start').finally(() => ctx.answerCallbackQuery())
})

export { composer as unhandledFeature }
