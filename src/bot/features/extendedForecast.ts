import type { Context } from '#root/bot/context.js'
import { EXTEND_FORECAST, FORECAST_CONVERSATION_ID, MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { removeKeyboard } from '#root/bot/helpers/keyboard.js'
import { logHandle } from '#root/bot/helpers/logging.js'
import { checkSession } from '#root/bot/middlewares/session.js'
import { logger } from '#root/logger.js'
import { askAI } from '#root/neural-network/index.js'
import { Composer } from 'grammy'

const composer = new Composer<Context>()

const feature = composer.chatType('private')

feature.hears(EXTEND_FORECAST, logHandle(`hears-${FORECAST_CONVERSATION_ID}`), (ctx) => {
  if (checkSession(ctx) && ctx.session.lastCompletion) {
    const lastCompletion = ctx.session.lastCompletion
    ctx.reply('Ждем ответа от звезд...', { reply_markup: removeKeyboard })
      .then(async () => askAI('Детализируй прогноз и дай советы "что делать".', lastCompletion).catch((reason) => {
        logger.error(reason)
        return undefined
      }))
      .then((answer) => {
        return ctx.reply(answer?.content ?? 'Ошибка')
          .then(() => ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD }))
      })
      .finally(() => ctx.session.lastCompletion = undefined)
    return
  }
  return ctx.reply(ctx.t('unhandled'), { reply_markup: removeKeyboard })
})

export { composer as extendedForecastFeature }
