import type { Context } from '#root/bot/context.js'
import type { PsychoAnswer, QuestionsAnswer } from '#root/bot/prompts/psychoPrompts.js'
import type { Conversation } from '@grammyjs/conversations'
import { TO_MAIN_QUERY } from '#root/bot/features/main.js'
import { sendClockSticker, splitLongText } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { getFirstPrompt } from '#root/bot/prompts/psychoPrompts.js'
import { saveContext } from '#root/db/queries/psycho.js'
import { askAI } from '#root/neural-network/index.js'
import { InlineKeyboard } from 'grammy'

export async function psychoConversation(conversation: Conversation<Context, Context>, ctx: Context, message_id?: number) {
  message_id = (await editOrReplyWithInlineKeyboard(ctx, ctx.t('psycho.start'), new InlineKeyboard(), message_id))?.message_id ?? message_id

  const problem = await conversation.form.text({
    otherwise: octx => octx.reply(ctx.t('only-text')),
  })

  const rawQuestionsAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), problem).catch(() => null)))

  if (!rawQuestionsAnswer) {
    message_id = (await editOrReplyWithInlineKeyboard(ctx, ctx.t('ai-error'), new InlineKeyboard(), message_id))?.message_id

    return message_id
  }

  const questionsAnswer = JSON.parse(rawQuestionsAnswer) as QuestionsAnswer
  message_id = (await ctx.reply(ctx.t('psycho.questions')))?.message_id

  const userAnswers = []
  for (const question of questionsAnswer.questions) {
    await ctx.reply(question)
    const userAnswer = await conversation.form.text({
      otherwise: octx => octx.reply(ctx.t('only-text')),
    })
    userAnswers.push({ question, answer: userAnswer })
  }

  const userAnswersMessage = userAnswers.reduce((acc, ans, ind) => `${acc}${ind + 1}. ${ans.answer}\n`, '')

  await conversation.external(async (ectx) => {
    await saveContext(ectx.chat!.id, problem, true)
    await saveContext(ectx.chat!.id, rawQuestionsAnswer, false)
    await saveContext(ectx.chat!.id, userAnswersMessage, true)
  })

  message_id = (await ctx.reply('Ждем ответа от звезд...'))?.message_id
  const stickerMessage = await sendClockSticker(ctx)

  const aiAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), userAnswersMessage, problem, rawQuestionsAnswer).then(result => result ? JSON.parse(result) : null).catch(() => null))) as PsychoAnswer | null

  // logger.info('Parsed answer: ' + JSON.stringify(aiAnswer))

  if (!aiAnswer) {
    await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)
    message_id = (await editOrReplyWithInlineKeyboard(ctx, ctx.t('ai-error'), new InlineKeyboard(), message_id))?.message_id

    return message_id
  }
  await conversation.external(() => saveContext(ctx.chat!.id, aiAnswer.short_answer, false))

  const fullAnswer = splitLongText(aiAnswer.full_answer)
  await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)

  for (let i = 0; i < fullAnswer.length; i++) {
    const markup = (i + 1 === fullAnswer.length) ? ({ reply_markup: new InlineKeyboard().text('Вернуться в меню', TO_MAIN_QUERY) }) : undefined
    if (i === 0 && ctx.chat?.id && message_id) {
      ctx.api.editMessageText(ctx.chat!.id, message_id, fullAnswer[i], markup)
    }
    else {
      await ctx.reply(fullAnswer[i], markup)
    }
  }
  await conversation.external(cctx => cctx.session.dialog = 'psycho')
}
