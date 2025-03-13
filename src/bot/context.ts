import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { AutoChatActionFlavor } from '@grammyjs/auto-chat-action'
import type { ConversationFlavor } from '@grammyjs/conversations'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { ParseModeFlavor } from '@grammyjs/parse-mode'
import type { Context as DefaultContext, SessionFlavor } from 'grammy'

export enum Interests {
  CAREER = 'Карьера',
  FINANCE = 'Финансы',
  GROWTH = 'Личностный рост',
}

export enum ForecastFormat {
  LONG = 'Развернутый текст',
  SHORT = 'Краткие тезисы',
  SCHEME = 'Графики и схемы',
}

export interface SessionData {
  name: string
  birthday: string
  interests: Interests[]
  format: ForecastFormat
  lastCompletion?: string
  isWaiting?: boolean
}

interface ExtendedContextFlavor {
  logger: Logger
  config: Config
}

export type Context = ConversationFlavor<
  ParseModeFlavor<
    HydrateFlavor<
      DefaultContext &
      ExtendedContextFlavor &
      SessionFlavor<SessionData> &
      I18nFlavor &
      AutoChatActionFlavor
    >
  >
>
