import type { Context } from '#root/bot/context.js'
import type { PsychoAnswer } from '#root/bot/prompts/psychoPrompts.js'
import type { Filter } from 'grammy'
import { TO_MAIN_QUERY } from '#root/bot/features/main.js'
import { sendClockSticker, splitLongText } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { getFirstPrompt } from '#root/bot/prompts/psychoPrompts.js'
import { loadPsychoContext, saveContext } from '#root/db/queries/psycho.js'
import { askAIwithHistory } from '#root/neural-network/index.js'
import { InlineKeyboard } from 'grammy'

export async function psychoDialogHandler(ctx: Filter<Context, 'message:text'>) {
  const message = ctx.message.text
  await saveContext(ctx.chat.id, message, false)

  const message_id = (await ctx.reply('Ждем ответа от звезд...'))?.message_id
  const stickerMessage = await sendClockSticker(ctx)

  const history = await loadPsychoContext(ctx.chat.id)

  const aiAnswer = await askAIwithHistory(getFirstPrompt(), ...history, message).then(result => result ? JSON.parse(result) : null).catch(() => null) as PsychoAnswer | null

  await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)

  if (!aiAnswer) {
    return await editOrReplyWithInlineKeyboard(ctx, ctx.t('ai-error'), new InlineKeyboard(), message_id)
  }
  await saveContext(ctx.chat!.id, aiAnswer.short_answer, false)

  const fullAnswer = splitLongText(aiAnswer.full_answer)

  for (let i = 0; i < fullAnswer.length; i++) {
    const markup = (i + 1 === fullAnswer.length) ? ({ reply_markup: new InlineKeyboard().text('Вернуться в меню', TO_MAIN_QUERY) }) : undefined
    if (i === 0 && ctx.chat?.id && message_id) {
      ctx.api.editMessageText(ctx.chat!.id, message_id, fullAnswer[i], markup)
    }
    else {
      await ctx.reply(fullAnswer[i], markup)
    }
  }
}
