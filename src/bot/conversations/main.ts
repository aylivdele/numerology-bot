import { InlineKeyboard } from 'grammy'

export const MAIN_MESSAGE = 'Выбери, что ты хочешь узнать сегодня'
export const CHANGE_SETTINGS_CONVERSATION = 'Настройки'
export const CHANGE_SETTINGS_CONVERSATION_ID = 'settings'
export const CHANGE_INTERESTS_SETTINGS_CONVERSATION_ID = 'interests'
export const CHANGE_FORMAT_SETTINGS_CONVERSATION_ID = 'format'
export const QUESTION_CONVERSATION = 'Задать вопрос'
export const QUESTION_CONVERSATION_ID = 'question'
export const ANALYZE_CONVERSATION = 'Анализ личности'
export const ANALYZE_CONVERSATION_ID = 'analyze'
export const FORECAST_CONVERSATION = 'Получить прогноз'
export const FORECAST_CONVERSATION_ID = 'forecast'
export const PSYCHO_CONVERSATION = 'Психологический разбор'
export const PSYCHO_CONVERSATION_ID = 'psycho'
export const TO_MAIN_MENU = 'Вернуться в меню'

export const MAIN_KEYBOARD = new InlineKeyboard().text(FORECAST_CONVERSATION, FORECAST_CONVERSATION_ID).row().text(ANALYZE_CONVERSATION, ANALYZE_CONVERSATION_ID).row().text(QUESTION_CONVERSATION, QUESTION_CONVERSATION_ID).row().text(PSYCHO_CONVERSATION, PSYCHO_CONVERSATION_ID).row().text(CHANGE_SETTINGS_CONVERSATION, CHANGE_SETTINGS_CONVERSATION_ID)
