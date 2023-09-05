import { 
    UserModel,
    ProblemModel,
    AnswerModel
  } from "./models";
  import { db } from "../../server"
  import { promisify } from 'util'
  import { Database } from "sqlite3";
  
  /**
   * Promisified versions of db methods
   */
  let dbRunAsync: any, dbGetAsync: any, dbAllAsync: any;
  export const initializeDbMethods = (db: Database) => {
    dbRunAsync = promisify(db.run).bind(db);
    dbGetAsync = promisify(db.get).bind(db);
    dbAllAsync = promisify(db.all).bind(db);
  }
  
  const CustomError = (message: string, code: number = 400) => { return { status: code, res: message } }
  const fetchFromDB = async <T>(sqlStmt: string, params: any[]): Promise<T | null> => {
    try {
      return await dbGetAsync(sqlStmt, params);
    } catch (err) {
      throw CustomError(err.message);
    }
  }
  
  /**
   * Add a new user to the database.
   * 
   * @async
   * @param {string} username - The username of the new user.
   * @param {string} password - The password for the new user.
   * @returns {Promise<void>}
   * 
   * @throws {CustomError} - Throws a CustomError if there is an exception while inserting the user.
   */
  export const addUser = async (username: string, password: string) => {
    const sqlStmt = 'INSERT INTO users (username, password) VALUES (?, ?)';
    try {
      await dbRunAsync(sqlStmt, [username, password]);
      console.log("NOT ERRRRRRRRRRRRRRRRRRR")
    } catch (err) {
      console.log("ERRRRRRRRRRRRRRRRRRR " + err.message)
      throw CustomError(err.message);
    }
  }
  
  /**
   * Basic fetchers
   */
  export const getUser = (username: string) => fetchFromDB<UserModel>('SELECT * FROM users WHERE username = ?', [username])
  
  /**
   * Add a problem to the database.
   * 
   * @async
   * @param {string} username - The username of the user adding the problem.
   * @param {string} problemText - The text of the problem to be added.
   * @param {string} answer - The answer to the problem.
   * @param {string} problemType - The type of the problem.
   * @returns {Promise<void>} 
   * 
   * @throws {CustomError} - Throws a CustomError with a status code of 400 if the user is not found.
   * @throws {Error} - Throws a generic Error for other exceptions.
   */
  export const addProblem = async (username: string, problemText: string, answer: string, problemType: string) : Promise<void> => {
    try {
      const user = await getUser(username);
      if (!user) { throw CustomError('User not found', 400) }
  
      await db.run('INSERT INTO problems (text, user_id, type) VALUES (?, ?, ?)', [problemText, user.id, problemType], 
        async function(this: { lastID: number }, err: Error) {
          if (err) { throw err }
          await dbRunAsync('INSERT INTO answers (problem_id, answer) VALUES (?, ?)', [this.lastID, answer])
        }
      )
    } catch (err) {
      throw err.message ? CustomError(err.message) : err
    }
  }