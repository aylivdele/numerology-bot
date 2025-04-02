import type { DialogType } from '#root/bot/context.js'
import { getDbClient, isConnected } from '#root/db/index.js'

const saveContextQuery = 'insert into dialog_context(id, chat_id, message, role, type) values($1, $2, $3, $4, $5)'

export function saveContextWithId(id: number, chat_id: number, message: string, role: boolean = true, type: DialogType) {
  const client = getDbClient()
  if (!client || !isConnected()) {
    return Promise.reject(new Error('Not connected to database'))
  }
  return client.query(saveContextQuery, [id, chat_id, message, role, type])
}

export function saveContext(chat_id: number, message: string, role: boolean = true, type: DialogType) {
  return saveContextWithId(Date.now(), chat_id, message, role, type)
}

const loadContextQuery = 'select message from dialog_context where chat_id = $1 order by id ASC'

export function loadPsychoContext(chat_id?: number): Promise<Array<string>> {
  const client = getDbClient()
  if (!client || !isConnected()) {
    return Promise.reject(new Error('Not connected to database'))
  }
  if (!chat_id) {
    return Promise.resolve([])
  }
  return client.query(loadContextQuery, [chat_id]).then(result =>
    result.rows.map(row => row.message),
  )
}

const firstMessageQuery = 'SELECT message FROM dialog_context WHERE chat_id = $1 AND type like $2 ORDER BY id ASC LIMIT 1'

export function getFirstDialogMessage(chatId: number, type: DialogType): Promise<string | undefined> {
  const client = getDbClient()
  if (!client || !isConnected()) {
    return Promise.reject(new Error('Not connected to database'))
  }
  return client.query(firstMessageQuery, [chatId, type]).then(result =>
    result.rowCount === 1 ? result.rows[0].message : undefined,
  )
}

const clearDialogQuery = 'delete from dialog_context where chat_id = $1 and type = $2'

export function clearDialog(chatId: number, type: DialogType): Promise<void> {
  const client = getDbClient()
  if (!client || !isConnected()) {
    return Promise.reject(new Error('Not connected to database'))
  }
  return client.query(clearDialogQuery, [chatId, type]).then()
}
