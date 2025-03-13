import type { Context } from '#root/bot/context.js'
import { MAIN_KEYBOARD, MAIN_MESSAGE, TO_MAIN_MENU } from '#root/bot/conversations/main.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('main', logHandle('command-main'), (ctx) => {
  if (checkSession(ctx)) {
    return ctx.conversation.exitAll().then(() => ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD }))
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

export { composer as mainFeature }

export const mainHearsFeature = new Composer<Context>()

mainHearsFeature.chatType('private').hears(TO_MAIN_MENU, (ctx) => {
  if (checkSession(ctx)) {
    return ctx.conversation.exitAll().then(() => ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD }))
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})
