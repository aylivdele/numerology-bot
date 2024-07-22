#!/usr/bin/env tsx

import process from 'node:process'
import { ValiError, flatten } from 'valibot'
import { createLogger } from './logger.js'
import { createBot } from '#root/bot/index.js'
import type { PollingConfig, WebhookConfig } from '#root/config.js'
import { createConfig } from '#root/config.js'
import { createServer, createServerManager } from '#root/server/index.js'

async function startPolling(config: PollingConfig) {
  const logger = createLogger(config)
  const bot = createBot(config.botToken, {
    config,
    logger,
  })

  // graceful shutdown
  onShutdown(async () => {
    logger.info('Shutdown')
    await bot.stop()
  })

  // start bot
  await bot.start({
    allowed_updates: config.botAllowedUpdates,
    onStart: ({ username }) =>
      logger.info({
        msg: 'Bot running...',
        username,
      }),
  })
}

async function startWebhook(config: WebhookConfig) {
  const logger = createLogger(config)
  const bot = createBot(config.botToken, {
    config,
    logger,
  })
  const server = createServer(bot, {
    config,
    logger,
  })
  const serverManager = createServerManager(server)

  // graceful shutdown
  onShutdown(async () => {
    logger.info('Shutdown')
    await serverManager.stop()
  })

  // to prevent receiving updates before the bot is ready
  await bot.init()

  // start server
  const info = await serverManager.start(
    config.serverHost,
    config.serverPort,
  )
  logger.info({
    msg: 'Server started',
    url:
      info.family === 'IPv6'
        ? `http://[${info.address}]:${info.port}`
        : `http://${info.address}:${info.port}`,
  })

  // set webhook
  await bot.api.setWebhook(config.botWebhook, {
    allowed_updates: config.botAllowedUpdates,
    secret_token: config.botWebhookSecret,
  })
  logger.info({
    msg: 'Webhook was set',
    url: config.botWebhook,
  })
}

try {
  try {
    process.loadEnvFile()
  }
  catch {
    // No .env file found
  }

  // @ts-expect-error create config from environment variables
  const config = createConfig(convertKeysToCamelCase(process.env))

  if (config.isWebhookMode)
    await startWebhook(config)
  else if (config.isPollingMode)
    await startPolling(config)
}
catch (error) {
  if (error instanceof ValiError) {
    console.error('Config parsing error', flatten(error.issues))
  }
  else {
    console.error(error)
  }
  process.exit(1)
}

// Utils

function onShutdown(cleanUp: () => Promise<void>) {
  let isShuttingDown = false
  const handleShutdown = async () => {
    if (isShuttingDown)
      return
    isShuttingDown = true
    await cleanUp()
  }
  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>

type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends object ? KeysToCamelCase<T[K]> : T[K]
}

function toCamelCase(str: string): string {
  return str.toLowerCase().replace(/_([a-z])/g, (_match, p1) => p1.toUpperCase())
}

function convertKeysToCamelCase<T>(obj: T): KeysToCamelCase<T> {
  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelCaseKey = toCamelCase(key)
      result[camelCaseKey] = obj[key]
    }
  }
  return result
}
