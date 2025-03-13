import type { Context, SessionData } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'

import type { Context as DefaultContext } from 'grammy'

export async function updateSession<SessionField extends keyof SessionData>(conversation: Conversation<Context, DefaultContext>, field: SessionField, value: SessionData[SessionField]) {
  return await conversation.external((ctx) => {
    const session = ctx.session
    session[field] = value
    ctx.session = session
  })
}

export function splitLongText(text?: string | null, maxLenght: number = 4000): string[] | undefined {
  if (!text) {
    return undefined
  }
  if (text.length < maxLenght) {
    return [text]
  }
  text = text!
  let index = Number.MAX_SAFE_INTEGER
  let firstPart = text
  while (index > maxLenght) {
    index = firstPart.lastIndexOf('\n\n')
    if (index === -1) {
      index = firstPart.lastIndexOf('\n')
    }
    if (index === -1) {
      throw new Error('Could not split text by next line symbol')
    }
    firstPart = text.substring(0, index)
  }
  const rest: string[] = []
  if (text.length - firstPart.length > maxLenght) {
    const restSplit = splitLongText(text.substring(index))
    if (!restSplit) {
      throw new Error('Could not split text by next line symbol')
    }
    rest.push(...restSplit)
  }
  else {
    rest.push(text.substring(index))
  }
  return [firstPart, ...rest]
}
