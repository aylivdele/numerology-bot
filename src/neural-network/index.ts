import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: config.networkToken,
})

export function testNetwork() {
  const completion = openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages: [
      { role: 'user', content: 'write a haiku about ai' },
    ],
  })

  completion.then(result => logger.info(result.choices[0].message))
}
