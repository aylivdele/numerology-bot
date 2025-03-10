import { Keyboard } from 'grammy'

export const MAIN_MESSAGE = 'Выбери, что ты хочешь узнать сегодня'
export const CHANGE_SETTINGS_CONVERSATION = 'Настройки'
export const CHANGE_SETTINGS_CONVERSATION_ID = 'settings'
export const QUESTION_CONVERSATION = 'Задать вопрос'
export const QUESTION_CONVERSATION_ID = 'question'
export const ANALYZE_CONVERSATION = 'Анализ личности'
export const ANALYZE_CONVERSATION_ID = 'analyze'
export const FORECAST_CONVERSATION = 'Получить прогноз'
export const FORECAST_CONVERSATION_ID = 'forecast'
export const TO_MAIN_MENU = 'Вернуться в меню'

export const MAIN_KEYBOARD = new Keyboard().persistent().resized().text(FORECAST_CONVERSATION).text(ANALYZE_CONVERSATION).text(QUESTION_CONVERSATION).row().text(CHANGE_SETTINGS_CONVERSATION)
