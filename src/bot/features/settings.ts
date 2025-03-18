import type { Context } from '#root/bot/context.js'
import { CHANGE_SETTINGS_CONVERSATION_ID } from '#root/bot/conversations/main.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

export const changeSettingsFeature = new Composer<Context>()

const feature = changeSettingsFeature.chatType('private')

feature.callbackQuery(CHANGE_SETTINGS_CONVERSATION_ID, logHandle(`callback-query-${CHANGE_SETTINGS_CONVERSATION_ID}`), (ctx) => {
  if (checkSession(ctx)) {
    return ctx.conversation.enter(CHANGE_SETTINGS_CONVERSATION_ID, ctx.callbackQuery.message?.message_id)
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})
