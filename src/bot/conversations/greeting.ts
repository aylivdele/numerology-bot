import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { settingsConversation } from '#root/bot/conversations/settings.js'
import { createConversation } from '@grammyjs/conversations'

export const GREETING_CONVERSATION = 'greeting'

type ConversationContext =
  & DefaultContext

const aboutText = 'Что умеет бот?'
const startSettings = 'Начать настройку'

export function greetingConversation() {
  return createConversation(
    async (conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext) => {
      const options = {
        reply_markup: {
          is_persistent: true,
          resize_keyboard: true,
          keyboard: [[
            {
              text: startSettings,
            },
            {
              text: aboutText,
            },
          ]],
        },
      }
      await ctx.reply('Привет! Я помогу тебе разобраться в закономерностях жизни и принять важные решения. Давай настроим твой персональный опыт!', options)

      while (true) {
        ctx = await conversation.wait()

        if (ctx.hasText(aboutText)) {
          ctx.reply('TODO: Заполнить информацию', options)
        }
        else if (ctx.hasText(startSettings)) {
          return await settingsConversation(conversation, ctx)
        }
        else {
          await ctx.reply('Пожалуйста, используй кнопки.', options)
        }
      }
    },
    GREETING_CONVERSATION,
  )
}
