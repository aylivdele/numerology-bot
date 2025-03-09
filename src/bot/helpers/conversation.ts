import type { Context, SessionData } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'

import type { Context as DefaultContext } from 'grammy'

export async function updateSession<SessionField extends keyof SessionData>(conversation: Conversation<Context, DefaultContext>, field: SessionField, value: SessionData[SessionField]) {
  return await conversation.external((ctx) => {
    const session = ctx.session
    session[field] = value
    ctx.session = session
  })
}
