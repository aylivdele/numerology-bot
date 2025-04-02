import type { Context } from '#root/bot/context.js'
import type { PsychoAnswer, QuestionsAnswer } from '#root/bot/prompts/psychoPrompts.js'
import type { Conversation } from '@grammyjs/conversations'
import { DialogType } from '#root/bot/context.js'
import { sendClockSticker, splitLongText, waitForCallbackQuery } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { CONTINUE_KEYBOARD, CONTINUE_QUERY, TO_MAIN_KEYBOARD } from '#root/bot/helpers/main.js'
import { extractProblemFromPrompt, getFirstPrompt, getFirstUserPrompt } from '#root/bot/prompts/psychoPrompts.js'
import { clearDialog, getFirstDialogMessage, saveContext } from '#root/db/queries/psycho.js'
import { askAI } from '#root/neural-network/index.js'
import { InlineKeyboard } from 'grammy'

export async function psychoConversation(conversation: Conversation<Context, Context>, ctx: Context, message_id?: number) {
  const dialogExists = await conversation.external(() => getFirstDialogMessage(ctx.chat!.id, DialogType.PSYCHO))

  if (dialogExists !== undefined) {
    const myProblem = extractProblemFromPrompt(dialogExists)
    message_id = (await editOrReplyWithInlineKeyboard(ctx, ctx.t('dialog.continue', { message: myProblem }), CONTINUE_KEYBOARD, message_id))?.message_id

    const msg = await waitForCallbackQuery(conversation, /^continue-.+/, CONTINUE_KEYBOARD, message_id)
    if (msg.data === CONTINUE_QUERY) {
      await conversation.external(cctx => cctx.session.dialog = 'psycho')
      await editOrReplyWithInlineKeyboard(ctx, ctx.t('dialog.news-question'), TO_MAIN_KEYBOARD, msg.message_id)

      return
    }
    else {
      await clearDialog(ctx.chat!.id, DialogType.PSYCHO)
    }
  }

  message_id = (await editOrReplyWithInlineKeyboard(ctx, ctx.t('psycho.start'), new InlineKeyboard(), message_id))?.message_id ?? message_id

  const problem = await conversation.form.text({
    otherwise: octx => octx.reply(ctx.t('only-text')),
  })

  const session = await conversation.external(cctx => cctx.session)
  const firstUserPrompt = getFirstUserPrompt(session, problem)

  const rawQuestionsAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), firstUserPrompt).catch(() => null)))

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
    await saveContext(ectx.chat!.id, firstUserPrompt, true, DialogType.PSYCHO)
    await saveContext(ectx.chat!.id, rawQuestionsAnswer, false, DialogType.PSYCHO)
    await saveContext(ectx.chat!.id, userAnswersMessage, true, DialogType.PSYCHO)
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
  await conversation.external(() => saveContext(ctx.chat!.id, aiAnswer.short_answer, false, DialogType.PSYCHO))

  const fullAnswer = splitLongText(aiAnswer.full_answer)
  await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)

  for (let i = 0; i < fullAnswer.length; i++) {
    const markup = (i + 1 === fullAnswer.length) ? ({ reply_markup: TO_MAIN_KEYBOARD }) : undefined
    if (i === 0 && ctx.chat?.id && message_id) {
      ctx.api.editMessageText(ctx.chat!.id, message_id, fullAnswer[i], markup)
    }
    else {
      await ctx.reply(fullAnswer[i], markup)
    }
  }
  await conversation.external(cctx => cctx.session.dialog = 'psycho')
}
