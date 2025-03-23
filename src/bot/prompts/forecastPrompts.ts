import type { SessionData } from '#root/bot/context.js'
import { ALL_PROMPT } from '#root/bot/prompts/systemPrompt.js'

/*
  Промт для ветки:

  Получить прогноз -> На неделю / На месяц / Специальный разбор

  Интервал находится в переменной 'questionOrInterval', пример в случае на месяц 'месяц 01/01/2025 - 01/02/2025'
                                                                                         ^ дата на момент запроса
  В случае специального разбора в этой переменной лежит вопрос введенный пользователем
*/
export function getForecastPrompt(session: SessionData, questionOrInterval: string, isCustomQuestion: boolean) {
  if (isCustomQuestion) {
    return `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  У меня вопрос: ${questionOrInterval}
  Дай ответ в формате "${session.format}"`
  }
  else {
    return `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
    Интересующие меня темы: ${session.interests.join(', ')}.
    Мне нужен прогноз на ${questionOrInterval}
    Дай ответ в формате "${session.format}"`
  }
}

/*
  Промт для ветки:

  Получить прогноз -> На неделю / На месяц / Специальный разбор -> Получить совет

  К эту промту нейронке передается прошлый системный промт + прошлый пользовательный промт + ответ нейронки
*/
export function getAdvicePropmt() {
  return `Детализируй прогноз и дай советы "что делать".`
}

/*
  Системный промт для ветки прогноза
  На текущей момент используется общий из файла 'systemPrompt.ts'
*/
const forecastPropmt = ALL_PROMPT

export function getForecastSystemPrompt() {
  return forecastPropmt
}
