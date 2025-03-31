import type { Context } from '#root/bot/context.js'
import type { Conversation } from '@grammyjs/conversations'

export async function testConversation(conversation: Conversation<Context, Context>, ctx: Context) {
  await ctx.reply(ctx.t('test'))
  await conversation.form.text()
  await ctx.deleteMessage()
}
