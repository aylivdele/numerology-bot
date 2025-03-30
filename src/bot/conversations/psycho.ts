import type { Context } from '#root/bot/context.js'
import type { PsychoAnswer, QuestionsAnswer } from '#root/bot/prompts/psychoPrompts.js'
import type { Conversation } from '@grammyjs/conversations'
import type { Context as DefaultContext } from 'grammy'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { sendClockSticker, splitLongText } from '#root/bot/helpers/conversation.js'
import { editOrReplyWithInlineKeyboard } from '#root/bot/helpers/keyboard.js'
import { localize } from '#root/bot/i18n.js'
import { getFirstPrompt } from '#root/bot/prompts/psychoPrompts.js'
import { saveContext } from '#root/db/index.js'
import { logger } from '#root/logger.js'
import { askAI } from '#root/neural-network/index.js'
import { InlineKeyboard } from 'grammy'

export async function psychoConversation(conversation: Conversation<Context, DefaultContext>, ctx: DefaultContext, message_id?: number) {
  message_id = (await editOrReplyWithInlineKeyboard(ctx, localize.t('ru', 'psycho.start'), new InlineKeyboard(), message_id))?.message_id ?? message_id

  const problem = await conversation.form.text({
    otherwise: octx => octx.reply(localize.t('ru', 'only-text')),
  })

  const rawQuestionsAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), problem).catch(() => null)))

  if (!rawQuestionsAnswer) {
    message_id = (await editOrReplyWithInlineKeyboard(ctx, localize.t('ru', 'ai-error'), new InlineKeyboard(), message_id))?.message_id

    return message_id
  }

  const questionsAnswer = JSON.parse(rawQuestionsAnswer) as QuestionsAnswer
  message_id = (await ctx.reply(localize.t('ru', 'psycho.questions')))?.message_id

  const userAnswers = []
  for (const question of questionsAnswer.questions) {
    await ctx.reply(question)
    const userAnswer = await conversation.form.text({
      otherwise: octx => octx.reply(localize.t('ru', 'only-text')),
    })
    userAnswers.push({ question, answer: userAnswer })
  }

  const answersMessage = userAnswers.reduce((acc, ans, ind) => `${acc}${ind + 1}. ${ans}\n`, '')

  await conversation.external((ectx) => {
    ectx.session = {
      ...ectx.session,
      psychoQuestions: rawQuestionsAnswer,
      psychoAnswers: answersMessage,
    }
  })

  message_id = (await ctx.reply('Ждем ответа от звезд...'))?.message_id
  const stickerMessage = await sendClockSticker(ctx)

  const aiAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), answersMessage, problem, rawQuestionsAnswer).catch(() => null))) as PsychoAnswer | null

  logger.info('Parsed answer: ', aiAnswer)

  if (!aiAnswer) {
    await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)
    message_id = (await editOrReplyWithInlineKeyboard(ctx, localize.t('ru', 'ai-error'), new InlineKeyboard(), message_id))?.message_id

    return message_id
  }
  await conversation.external(() => saveContext(ctx.chat!.id, aiAnswer.short_answer, false))

  const fullAnswer = splitLongText(aiAnswer.full_answer)
  await ctx.api.deleteMessage(stickerMessage.chat.id, stickerMessage.message_id)

  for (let i = 0; i < fullAnswer.length; i++) {
    if (i === 0 && ctx.chat?.id && message_id) {
      ctx.api.editMessageText(ctx.chat!.id, message_id, fullAnswer[i])
    }
    else {
      await ctx.reply(fullAnswer[i])
    }
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
