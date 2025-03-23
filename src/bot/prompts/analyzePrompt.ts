import type { SessionData } from '#root/bot/context.js'
import { ALL_PROMPT } from '#root/bot/prompts/systemPrompt.js'

/*
  Промт для ветки:

  Анализ личности -> 'Сильные стороны и таланты'/'Кармический путь'/'Лучшие периоды для роста'

*/

export function getAnalyzePrompt(session: SessionData, variant: number) {
  let question
  switch (variant) {
    case 1:
      question = 'Расскажи про мои сильные стороны и таланты'
      break
    case 2:
      question = 'Расскажи про мой кармический путь'
      break
    case 3:
      question = 'Расскажи про мои лучшие периоды для роста'
      break
  }
  return `Привет! Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
    Интересующие меня темы: ${session.interests.join(', ')}.
    ${question}
    Дай ответ в формате "${session.format}"`
}

/*
  Системный промт для ветки анализа личности
  На текущей момент используется общий из файла 'systemPrompt.ts'
*/
const analyzePropmt = ALL_PROMPT

export function getAnalyzeSystemPrompt() {
  return analyzePropmt
}
