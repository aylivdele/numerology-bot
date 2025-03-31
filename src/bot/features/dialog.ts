import type { Context } from '#root/bot/context.js'
import { psychoDialogHandler } from '#root/bot/handlers/dialog/psycho.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkDialog } from '#root/bot/middlewares/session.js'
import { Composer } from 'grammy'

export const dialogFeature = new Composer<Context>()

const feature = dialogFeature.chatType('private')

feature.on('message:text', logHandle('dialog-message'), (ctx, next) => {
  if (checkDialog(ctx)) {
    switch (ctx.session.dialog) {
      case 'psycho':
        return psychoDialogHandler(ctx)
    }
    ctx.session.dialog = ''
  }
  return next()
})
