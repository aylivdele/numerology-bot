import fs from 'node:fs'
import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: config.networkToken,
})

let systemPrompt: string | undefined

try {
  systemPrompt = fs.readFileSync('./system_prompt.txt').toString()
}
catch (error) {
  logger.error(error, 'Could not open system prompt file')
}

export function askAI(userPrompt: string): Promise<string | null> {
  if (!systemPrompt) {
    return Promise.reject(new Error('Could not get system propmt'))
  }
  return openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages: [
      { role: 'developer', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }).then(
    (result) => {
      logger.info(result, 'Answer of gpt-4o-mini')
      return result.choices[0].message.content
    },
  )
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
