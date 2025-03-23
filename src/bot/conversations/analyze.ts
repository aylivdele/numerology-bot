import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { sendRandomSticker, splitLongText, waitForCallbackQuery } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { getAnalyzePrompt, getAnalyzeSystemPrompt } from '#root/bot/prompts/analyzePrompt.js'
import { askAI } from '#root/neural-network/index.js'
import { InlineKeyboard } from 'grammy'

export async function analyzeConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext, message_id?: number) {
  const strongs = 'analyze-strongs'
  const path = 'analyze-path'
  const growth = 'analyze-growth'

  const keyboard = new InlineKeyboard().text('Сильные стороны и таланты', strongs).row().text('Кармический путь', path).row().text('Лучшие периоды для роста', growth)

  message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Я могу сделать персональный разбор твоей личности и сильных сторон', keyboard, message_id))?.message_id ?? message_id

  const result = await waitForCallbackQuery(conversation, /^analyze-\w+$/, keyboard, message_id)
  const select = result.data
  message_id = result.message_id ?? message_id

  const session = await conversation.external(ctx => ctx.session)

  let question = 0

  switch (select) {
    case strongs:
      question = 1
      break
    case path:
      question = 2
      break
    case growth:
      question = 3
      break
  }

  const prompt = getAnalyzePrompt(session, question)

  message_id = (await editOrReplyWithInlineKeyboard(ctx, 'Ждем ответа от звезд...', new InlineKeyboard(), message_id))?.message_id ?? message_id
  const stickerMessage = await sendRandomSticker(ctx, await conversation.random())

  const answer = (await conversation.external(async () => await askAI(getAnalyzeSystemPrompt(), prompt).then(result => splitLongText(result)).catch(() => null))) ?? ['Ошибка, обратитесь к администрации']

  await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)

  for (let i = 0; i < answer.length; i++) {
    if (i === 0 && ctx.chat?.id && message_id) {
      ctx.api.editMessageText(ctx.chat!.id, message_id, answer[i])
    }
    else {
      await ctx.reply(answer[i])
    }
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
