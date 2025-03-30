import type { Context, ConversationContext } from '#root/bot/context.js'
import { analyzeConversation } from '#root/bot/conversations/analyze.js'
import { forecastConversation } from '#root/bot/conversations/forecast.js'
import { greetingConversation } from '#root/bot/conversations/greeting.js'
import { ANALYZE_CONVERSATION_ID, CHANGE_SETTINGS_CONVERSATION_ID, FORECAST_CONVERSATION_ID, PSYCHO_CONVERSATION_ID, QUESTION_CONVERSATION_ID } from '#root/bot/conversations/main.js'
import { psychoConversation } from '#root/bot/conversations/psycho.js'
import { questionConversation } from '#root/bot/conversations/question.js'
import { changeSettingsConversation } from '#root/bot/conversations/settings.js'
import { createConversation } from '@grammyjs/conversations'

export const myConversations = [
  greetingConversation(),
  createConversation<Context, ConversationContext>(changeSettingsConversation, CHANGE_SETTINGS_CONVERSATION_ID),
  createConversation<Context, ConversationContext>(analyzeConversation, ANALYZE_CONVERSATION_ID),
  createConversation<Context, ConversationContext>(forecastConversation, FORECAST_CONVERSATION_ID),
  createConversation<Context, ConversationContext>(questionConversation, QUESTION_CONVERSATION_ID),
  createConversation<Context, ConversationContext>(psychoConversation, PSYCHO_CONVERSATION_ID),
]
