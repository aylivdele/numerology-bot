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
  if (!client) {
    return undefined
  }
  return client
}

export function isConnected(): boolean {
  return connected
}
