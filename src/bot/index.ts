import type { Context, SessionData } from '#root/bot/context.js'
import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { BotConfig } from 'grammy'
import type pg from 'pg'
import { myConversations } from '#root/bot/conversations/index.js'
import { adminFeature } from '#root/bot/features/admin.js'
import { conversationFeatures } from '#root/bot/features/index.js'
import { languageFeature } from '#root/bot/features/language.js'
import { mainFeature } from '#root/bot/features/main.js'
import { unhandledFeature } from '#root/bot/features/unhandled.js'
import { errorHandler } from '#root/bot/handlers/error.js'
import { i18n, isMultipleLocales } from '#root/bot/i18n.js'
import { session } from '#root/bot/middlewares/session.js'
import { updateLogger } from '#root/bot/middlewares/update-logger.js'
import { autoChatAction } from '@grammyjs/auto-chat-action'
import { conversations } from '@grammyjs/conversations'
import { hydrate } from '@grammyjs/hydrate'
import { hydrateReply, parseMode } from '@grammyjs/parse-mode'
import { PsqlAdapter } from '@grammyjs/storage-psql'
import { MemorySessionStorage, Bot as TelegramBot } from 'grammy'

interface Dependencies {
  config: Config
  logger: Logger
}

function getSessionKey(ctx: Omit<Context, 'session'>) {
  return ctx.chat?.id.toString()
}

export async function createBot(token: string, dependencies: Dependencies, botConfig?: BotConfig<Context>, dbClient?: pg.Client) {
  const {
    config,
    logger,
  } = dependencies

  const bot = new TelegramBot<Context>(token, botConfig)

  bot.use(async (ctx, next) => {
    ctx.config = config
    ctx.logger = logger.child({
      update_id: ctx.update.update_id,
    })

    await next()
  })

  const protectedBot = bot.errorBoundary(errorHandler)

  // Middlewares
  bot.api.config.use(parseMode('HTML'))

  // if (config.isPollingMode)
  //   protectedBot.use(sequentialize(getSessionKey))
  if (config.isDebug)
    protectedBot.use(updateLogger())
  protectedBot.use(autoChatAction(bot.api))
  protectedBot.use(hydrateReply)
  protectedBot.use(hydrate())
  protectedBot.use(session({
    getSessionKey,
    // @ts-expect-error not possible to set generic type of PsqlAdapter
    storage: dbClient ? (await PsqlAdapter.create({ client: dbClient, tableName: 'session' })) : new MemorySessionStorage<SessionData>(),
  }))
  protectedBot.use(i18n)
  protectedBot.use(conversations())
  protectedBot.use(mainFeature)

  protectedBot.use(...myConversations)

  // Handlers
  protectedBot.use(...conversationFeatures)
  protectedBot.use(adminFeature)
  if (isMultipleLocales)
    protectedBot.use(languageFeature)

  // must be the last handler
  protectedBot.use(unhandledFeature)

  return bot
}

export type Bot = Awaited<ReturnType<typeof createBot>>
