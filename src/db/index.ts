import { config } from '#root/config.js'
import { logger } from '#root/logger.js'
import pg from 'pg'

let client: pg.Client
let connected: boolean = false
if (config.databaseString) {
  client = new pg.Client({
    connectionString: config.databaseString,
  })
  client.connect().then(() => {
    connected = true
    logger.info('Successfully connected to database')
  }, error => logger.error(error, 'Error connection to postgres'))
}

export function getDbClient() {
  if (!connected) {
    return undefined
  }
  return client
}

const saveContextQuery = 'insert into psycho_context(id, chat_id, message, role) values($1, $2, $3, $4)'

export function saveContext(chat_id: number, message: string, role: boolean = true) {
  if (!connected) {
    return Promise.reject(new Error('Not connected to database'))
  }
  return client.query(saveContextQuery, [Date.now(), chat_id, message, role])
}
