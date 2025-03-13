import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import fs from 'node:fs'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: config.networkToken,
})

let systemPrompt: string | undefined

try {
  systemPrompt = fs.readFileSync('prompts/system_prompt.txt').toString()
}
catch (error) {
  logger.error(error, 'Could not open system prompt file')
}

export function getHistory(completion_id?: string): Promise<ChatCompletionMessageParam[] | null> {
  if (!completion_id) {
    return Promise.resolve(null)
  }
  return Promise.all([openai.chat.completions.messages.list(completion_id)
    .then((result) => {
      logger.info(result, `completions.messages.list result for ${completion_id}`)
      return result.data.map((d) => {
        return { content: d.content!, role: d.role } as ChatCompletionMessageParam
      })
    }), openai.chat.completions.retrieve(completion_id)
    .then((result) => {
      logger.info(result, `completions.retrieve result for ${completion_id}`)
      return { content: result.choices[0].message.content!, role: 'assistant' } as ChatCompletionMessageParam
    })]).then(([messages, completion]) => ([...messages, completion]))
}

export interface AIAnswer {
  content?: string | null
  completion_id?: string
}

export function askAI(userPrompt: string, completion_id?: string): Promise<AIAnswer> {
  if (!systemPrompt) {
    return Promise.reject(new Error('Could not get system propmt'))
  }
  return getHistory(completion_id).then((history) => {
    const messages: ChatCompletionMessageParam[] = []
    if (history) {
      messages.push(...history)
    }
    else {
      messages.push({ role: 'developer', content: systemPrompt })
    }
    messages.push({ role: 'user', content: userPrompt })
    return openai.chat.completions.create({
      model: 'gpt-4o-mini',
      store: true,
      messages,
    }).then(
      (result) => {
        logger.info(result, 'Answer of gpt-4o-mini')
        return { content: result.choices[0].message.content, completion_id: result.id }
      },
    )
  })
}

export function testNetwork() {
  const completion = openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages: [
      { role: 'system', content: 'Сделай предсказание на ближающую неделю для козерога' },
      { role: 'user', content: 'Сделай предсказание на ближающую неделю для козерога' },
    ],
  })

  completion.then(result => logger.info(result.choices[0].message))
}
