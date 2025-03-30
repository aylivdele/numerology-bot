import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { settingsConversation } from '#root/bot/conversations/settings.js'
import { waitForCallbackQuery } from '#root/bot/helpers/conversation.js'
import { createConversation } from '@grammyjs/conversations'
import { InlineKeyboard } from 'grammy'

export const GREETING_CONVERSATION = 'greeting'

type ConversationContext =
  & DefaultContext

const startSettings = 'Начать настройку'

export function greetingConversation() {
  return createConversation(
    async (conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext) => {
      const startCallbackData = 'start-settings'
      const startKeyboard = new InlineKeyboard().text(startSettings, startCallbackData)

      let message_id: number | undefined = (await ctx.reply('Привет! Я помогу тебе разобраться в закономерностях жизни и принять важные решения. Давай настроим твой персональный опыт!', { reply_markup: startKeyboard })).message_id

      message_id = (await waitForCallbackQuery(conversation, startCallbackData, startKeyboard, message_id)).message_id

      return await settingsConversation(conversation, ctx, message_id)
    },
    GREETING_CONVERSATION,
  )
}
