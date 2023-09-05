import { createServer } from 'unicore'
import { ctrl } from './app/controllers'
import logger from './app/logger'
import * as hello from './app/services/helloService'
import { createTables } from './app/database/tables'
import { uniqueId } from 'lodash'

const sqlite3 = require('sqlite3').verbose()
const path_to_db = ':memory:'
export const db = new sqlite3.Database(path_to_db, (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err)
    process.exit(1)
  } else {
    console.log('Database opened successfully')
    createTables()
  }

  return void 0
})

const server = createServer()
server.use(logger.express)
server.use(ctrl.json)
server.use(ctrl.cors)
server.all('/', ctrl.httpRootHandler)
server.use(ctrl.healthz)

server.all('/hello', ctrl.service(hello.hello))

server.use(ctrl.httpErrorHandler)
server.use(ctrl.httpFinalHandler)

process.on('SIGINT', async () => {
  await db.close()
  console.log('Database closed successfully')
  process.exit(0)
});
  
process.on('SIGTERM', async () => {
  await db.close()
  console.log('Database closed successfully')
  process.exit(0)
})

export default server
