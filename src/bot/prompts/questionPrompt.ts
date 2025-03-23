import type { SessionData } from '#root/bot/context.js'
import { ALL_PROMPT } from '#root/bot/prompts/systemPrompt.js'

/*
  Промт для ветки:

  Задать вопрос -> 'пользак вводит свой вопрос'

*/
export function getQuestionPrompt(session: SessionData, question: string) {
  return `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  У меня вопрос: ${question}.
  Дай ответ в формате "${session.format}"`
}

/*
  Системный промт для ветки задать вопрос
  На текущей момент используется общий из файла 'systemPrompt.ts'
*/
const questionPropmt = ALL_PROMPT

export function getQuestionSystemPrompt() {
  return questionPropmt
}
