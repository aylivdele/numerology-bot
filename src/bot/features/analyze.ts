import type { Context } from '#root/bot/context.js'
import { ANALYZE_CONVERSATION, ANALYZE_CONVERSATION_ID } from '#root/bot/conversations/main.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.hears(ANALYZE_CONVERSATION, logHandle(`hears-${ANALYZE_CONVERSATION_ID}`), (ctx) => {
  if (checkSession(ctx)) {
    ctx.conversation.enter(ANALYZE_CONVERSATION_ID)
    return
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

export { composer as analyzeFeature }
