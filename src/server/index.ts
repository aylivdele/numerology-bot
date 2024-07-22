import type { AddressInfo } from 'node:net'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { serve } from '@hono/node-server'
import { webhookCallback } from 'grammy'
import { getPath } from 'hono/utils/url'
import { requestId } from './middlewares/request-id.js'
import { setLogger } from './middlewares/logger.js'
import type { Env } from './environment.js'
import type { Bot } from '#root/bot/index.js'
import { requestLogger } from '#root/server/middlewares/request-logger.js'
import type { Logger } from '#root/logger.js'
import type { Config } from '#root/config.js'

interface Dependencies {
  config: Config
  logger: Logger
}

export function createServer(bot: Bot, dependencies: Dependencies) {
  const {
    config,
    logger,
  } = dependencies

  if (!config.isWebhookMode) {
    throw new Error('Bot is not in webhook mode')
  }

  const server = new Hono<Env>()

  server.use(requestId())
  server.use(setLogger(logger))

  if (config.isDebug)
    server.use(requestLogger())

  server.onError(async (error, c) => {
    if (error instanceof HTTPException) {
      if (error.status < 500)
        c.var.logger.info(error)
      else
        c.var.logger.error(error)

      return error.getResponse()
    }

    // unexpected error
    c.var.logger.error({
      err: error,
      method: c.req.raw.method,
      path: getPath(c.req.raw),
    })
    return c.json(
      {
        error: 'Oops! Something went wrong.',
      },
      500,
    )
  })

  server.get('/', c => c.json({ status: true }))

  server.post(
    '/webhook',
    webhookCallback(bot, 'hono', {
      secretToken: config.botWebhookSecret,
    }),
  )

  return server
}

export type Server = Awaited<ReturnType<typeof createServer>>

export function createServerManager(server: Server) {
  let handle: undefined | ReturnType<typeof serve>
  return {
    start: (host: string, port: number) =>
      new Promise<AddressInfo>((resolve) => {
        handle = serve(
          {
            fetch: server.fetch,
            hostname: host,
            port,
          },
          info => resolve(info),
        )
      }),
    stop: () =>
      new Promise<void>((resolve) => {
        if (handle)
          handle.close(() => resolve())
        else
          resolve()
      }),
  }
}
