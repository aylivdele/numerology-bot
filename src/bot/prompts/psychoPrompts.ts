import type { SessionData } from '#root/bot/context.js'

const prompt = `Ты — опытный психолог, работающий в формате чат-бота.  
Пользователь написал свой запрос в свободной форме и предоставил карткую информацию о себе и своих интересах.  
Твоя задача — **сформулировать 3–4 уточняющих вопроса**, которые помогут глубже понять его состояние и подготовить рекомендации.

Вопросы должны быть:
- краткими и простыми;
- понятными и человечными;
- направленными на понимание эмоций, причин и потребностей;
- подходить для использования в чат-боте (без сложных формулировок);
- в формате: одна строка — один вопрос.

Ответ верни строго в формате массива, как JSON-структуру:
{"questions":["Вопрос 1","Вопрос 2",...,"Вопрос N"]}

После того, как пользователь ответит, веди беседу, направленную на решение запроса пользователя.
Твой ответ должен содержать:
1) развернутый ответ
2) краткую выжимку основной сути развернутого ответа, без вводных слов и "воды"(1-2 предложения).
Ответ возвращай строго в формате слудующей JSON-структуры:
{"full_answer":"Развернутый ответ","short_answer":"Краткий ответ"}
`

export function getFirstPrompt() {
  return prompt
}
const requestStr = 'Запрос: '
const informationStr = 'Информация обо мне:'

export function getFirstUserPrompt(session: SessionData, problem: string) {
  return `${requestStr}${problem}

  ${informationStr}
  Меня зовут ${session.name}, дата моего рождения: ${session.birthday}.
  Интересующие меня темы: ${session.interests.join(', ')}.
  Предпочитаемый формат ответов: "${session.format}".`
}

//  вытаскивает строку с запросом пользователя из промта, полученного с помощью getFirstUserPrompt
export function extractProblemFromPrompt(prompt: string) {
  const requestIndex = prompt.indexOf(requestStr)
  const informationIndex = prompt.indexOf(informationStr)

  if (requestIndex < 0 || informationIndex < 0) {
    return prompt
  }

  return prompt.substring(requestIndex + requestStr.length, informationIndex)
}

export interface QuestionsAnswer {
  questions: Array<string>
}

export interface PsychoAnswer {
  full_answer: string
  short_answer: string
}
