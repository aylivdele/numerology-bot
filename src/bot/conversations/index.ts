import type { Context } from '#root/bot/context.js'
import { analyzeConversation } from '#root/bot/conversations/analyze.js'
import { forecastConversation } from '#root/bot/conversations/forecast.js'
import { greetingConversation } from '#root/bot/conversations/greeting.js'
import { psychoConversation } from '#root/bot/conversations/psycho.js'
import { questionConversation } from '#root/bot/conversations/question.js'
import { changeSettingsConversation } from '#root/bot/conversations/settings.js'
import { testConversation } from '#root/bot/conversations/test.js'
import { ANALYZE_CONVERSATION_ID, CHANGE_SETTINGS_CONVERSATION_ID, FORECAST_CONVERSATION_ID, PSYCHO_CONVERSATION_ID, QUESTION_CONVERSATION_ID } from '#root/bot/helpers/main.js'
import { createConversation } from '@grammyjs/conversations'

export const myConversations = [
  greetingConversation(),
  createConversation(changeSettingsConversation, CHANGE_SETTINGS_CONVERSATION_ID),
  createConversation(analyzeConversation, ANALYZE_CONVERSATION_ID),
  createConversation(forecastConversation, FORECAST_CONVERSATION_ID),
  createConversation(questionConversation, QUESTION_CONVERSATION_ID),
  createConversation(psychoConversation, PSYCHO_CONVERSATION_ID),
  createConversation<Context, Context>(testConversation, 'test'),
]
