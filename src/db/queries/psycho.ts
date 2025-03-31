import { getDbClient, isConnected } from '#root/db/index.js'

const saveContextQuery = 'insert into psycho_context(id, chat_id, message, role) values($1, $2, $3, $4)'

export function saveContextWithId(id: number, chat_id: number, message: string, role: boolean = true) {
  const client = getDbClient()
  if (!client || !isConnected()) {
    return Promise.reject(new Error('Not connected to database'))
  }
  return client.query(saveContextQuery, [id, chat_id, message, role])
}

export function saveContext(chat_id: number, message: string, role: boolean = true) {
  return saveContextWithId(Date.now(), chat_id, message, role)
}

const loadContextQuery = 'select message from psycho_context where chat_id = $1 order by id ASC'

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
  ).then()
}
