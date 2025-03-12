import type { Context } from '#root/bot/context.js'
import { FORECAST_CONVERSATION, FORECAST_CONVERSATION_ID } from '#root/bot/conversations/main.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.hears(FORECAST_CONVERSATION, logHandle(`hears-${FORECAST_CONVERSATION_ID}`), (ctx) => {
  if (checkSession(ctx)) {
    ctx.conversation.enter(FORECAST_CONVERSATION_ID)
    return
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

export { composer as forecastFeature }
