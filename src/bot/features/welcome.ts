import type { Context } from '#root/bot/context.js'
import { GREETING_CONVERSATION } from '#root/bot/conversations/greeting.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.command('start', logHandle('command-start'), (ctx) => {
  ctx.session.dialog = ''
  return ctx.conversation.enter(GREETING_CONVERSATION)
})

export { composer as welcomeFeature }
