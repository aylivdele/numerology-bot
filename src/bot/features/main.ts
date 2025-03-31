import type { Context } from '#root/bot/context.js'
import { GREETING_CONVERSATION } from '#root/bot/conversations/greeting.js'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer, InlineKeyboard } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

export const TO_MAIN_QUERY = 'main'

feature.command(TO_MAIN_QUERY, logHandle('command-main'), (ctx) => {
  if (checkSession(ctx)) {
    ctx.session.dialog = ''
    return ctx.conversation.exitAll().then(() => ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD }))
  }
  return ctx.conversation.enter(GREETING_CONVERSATION)
})

feature.callbackQuery(TO_MAIN_QUERY, logHandle('main-callback-query'), async (ctx) => {
  ctx.session.dialog = ''
  if (ctx.callbackQuery.message?.message_id) {
    await ctx.api.editMessageReplyMarkup(ctx.chat.id, ctx.callbackQuery.message.message_id, { reply_markup: new InlineKeyboard() })
  }
  if (checkSession(ctx)) {
    return await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
  }
  return ctx.conversation.enter(GREETING_CONVERSATION)
})

export { composer as mainFeature }
