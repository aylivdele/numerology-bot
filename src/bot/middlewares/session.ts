import type { Context, SessionData } from '#root/bot/context.js'
import type { Middleware, SessionOptions } from 'grammy'
import { session as createSession } from 'grammy'

type Options = Pick<SessionOptions<SessionData, Context>, 'getSessionKey' | 'storage' | 'initial'>

export function session(options: Options): Middleware<Context> {
  return createSession({
    getSessionKey: options.getSessionKey,
    // @ts-expect-error bug
    storage: options.storage,
    initial: () => ({}),
  })
}

export function checkSession(ctx: Context) {
  return ctx.session && ctx.session.birthday && ctx.session.name && ctx.session.format && ctx.session.interests
}

export function checkDialog(ctx: Context) {
  return checkSession(ctx) && ctx.session.dialog
}
