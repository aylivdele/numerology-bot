import type { Context } from '#root/bot/context.js'
import { GREETING_CONVERSATION } from '#root/bot/conversations/greeting.js'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('main', logHandle('command-main'), (ctx) => {
  if (checkSession(ctx)) {
    return ctx.conversation.exitAll().then(() => ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD }))
  }
  return ctx.conversation.enter(GREETING_CONVERSATION)
})

export { composer as mainFeature }
