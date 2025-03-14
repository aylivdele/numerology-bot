import type { Context } from '#root/bot/context.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.on('message', logHandle('unhandled-message'), (ctx) => {
  if (checkSession(ctx)) {
    return ctx.reply(ctx.t('unhandled-ready'), { reply_markup: removeKeyboard })
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

feature.on('callback_query', logHandle('unhandled-callback-query'), (ctx) => {
  return ctx.answerCallbackQuery()
})

export { composer as unhandledFeature }
