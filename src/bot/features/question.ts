import type { Context } from '#root/bot/context.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { QUESTION_CONVERSATION_ID } from '#root/bot/helpers/main.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.callbackQuery(QUESTION_CONVERSATION_ID, logHandle(`callback-query-${QUESTION_CONVERSATION_ID}`), (ctx) => {
  if (checkSession(ctx)) {
    return ctx.conversation.enter(QUESTION_CONVERSATION_ID, ctx.callbackQuery.message?.message_id)
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

export { composer as questionFeature }
