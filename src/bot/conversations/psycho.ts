import type { Context, ConversationContext } from '#root/bot/context.js'
import type { PsychoAnswer, QuestionsAnswer } from '#root/bot/prompts/psychoPrompts.js'
import type { Conversation } from '@grammyjs/conversations'
import { MAIN_KEYBOARD, MAIN_MESSAGE } from '#root/bot/conversations/main.js'
import { splitLongText } from '#root/bot/helpers/conversation.js'
import { getFirstPrompt } from '#root/bot/prompts/psychoPrompts.js'
import { saveContext } from '#root/db/index.js'
import { askAI } from '#root/neural-network/index.js'

export async function psychoConversation(conversation: Conversation<Context, ConversationContext>, ctx: ConversationContext) {
  await ctx.reply(ctx.t('psycho.start'))

  const problem = await conversation.form.text({
    otherwise: octx => octx.reply(octx.t('only-text')),
  })

  const rawQuestionsAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), problem).catch(() => null)))

  if (!rawQuestionsAnswer) {
    await ctx.reply(ctx.t('ai-error'))
    return
  }

  const questionsAnswer = JSON.parse(rawQuestionsAnswer) as QuestionsAnswer

  await ctx.reply(ctx.t('psycho.questions'))
  const userAnswers = []
  for (const question of questionsAnswer.questions) {
    await ctx.reply(question)
    const userAnswer = await conversation.form.text({
      otherwise: octx => octx.reply(octx.t('only-text')),
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

  const aiAnswer = (await conversation.external(async () => await askAI(getFirstPrompt(), problem, rawQuestionsAnswer, answersMessage).catch(() => null))) as PsychoAnswer | null

  if (!aiAnswer) {
    await ctx.reply(ctx.t('ai-error'))
    return
  }
  await conversation.external(() => saveContext(ctx.chat!.id, aiAnswer.short_answer, false))

  for (const message of splitLongText(aiAnswer.full_answer)) {
    await ctx.reply(message)
  }

  await ctx.reply(MAIN_MESSAGE, { reply_markup: MAIN_KEYBOARD })
}
