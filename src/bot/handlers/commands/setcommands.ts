import type { Context } from '#root/bot/context.js'
import type { LanguageCode } from '@grammyjs/types'
import type { CommandContext } from 'grammy'
import { localize } from '#root/bot/i18n.js'
import { Command, CommandGroup } from '@grammyjs/commands'

function addCommandLocalizations(command: Command) {
  localize.locales.forEach((locale) => {
    command.localize(
      locale as LanguageCode,
      command.name,
      localize.t(locale, `${command.name}.description`),
    )
  })
  return command
}

function addCommandToChats(command: Command, chats: number[]) {
  for (const chatId of chats) {
    command.addToScope({
      type: 'chat',
      chat_id: chatId,
    })
  }
}

export async function setCommandsHandler(ctx: CommandContext<Context>) {
  const start = new Command('start', localize.t('en', 'start.description'))
    .addToScope({ type: 'all_private_chats' })
  addCommandLocalizations(start)
  addCommandToChats(start, ctx.config.botAdmins)

  const language = new Command('language', localize.t('en', 'language.description'))
    .addToScope({ type: 'all_private_chats' })
  addCommandLocalizations(language)
  addCommandToChats(language, ctx.config.botAdmins)

  const setcommands = new Command('setcommands', localize.t('en', 'setcommands.description'))
  addCommandToChats(setcommands, ctx.config.botAdmins)

  const commands = new CommandGroup()
    .add(start)
    .add(language)
    .add(setcommands)

  await commands.setCommands(ctx)

  return ctx.reply(ctx.t('admin-commands-updated'))
}
