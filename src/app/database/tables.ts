import { db } from "../../server"
import { promisify } from 'util'

export const createTables = async () => {
  const dbRunAsync = promisify(db.run).bind(db);

  await Promise.all([
    dbRunAsync(`CREATE TABLE IF NOT EXISTS answers (
      id INTEGER NOT NULL UNIQUE,
      problem_id INTEGER NOT NULL UNIQUE,
      answer TEXT NOT NULL,
      PRIMARY KEY(id AUTOINCREMENT),
      FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE);`
    ),
    dbRunAsync(`CREATE TABLE IF NOT EXISTS "problems" (
      "id"	INTEGER NOT NULL UNIQUE,
      "text"	TEXT NOT NULL,
      "user_id"	INTEGER NOT NULL,
      "type"	TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT));`
    ),
    dbRunAsync(`CREATE TABLE IF NOT EXISTS "solved" (
      "id"	INTEGER NOT NULL UNIQUE,
      "user_id"	INTEGER NOT NULL,
      "problem_id"	INTEGER NOT NULL,
      FOREIGN KEY("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE,
      FOREIGN KEY("user_id") REFERENCES "users"("id"),
      UNIQUE("user_id","problem_id"),
      PRIMARY KEY("id" AUTOINCREMENT));`
    ),
    dbRunAsync(`CREATE TABLE IF NOT EXISTS "users" (
      "id"	INTEGER NOT NULL UNIQUE,
      "username"	TEXT NOT NULL UNIQUE,
      "password"	TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT));`
    )
  ]);

  return void 0
}