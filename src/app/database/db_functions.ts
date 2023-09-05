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
  } catch (err) {
    throw CustomError(err.message);
  }
}
  
/**
 * Basic fetchers
 */
export const getProblem = (problemId: string) => fetchFromDB<ProblemModel>('SELECT * FROM problems WHERE id = ?', [problemId])
export const getUser = (username: string) => fetchFromDB<UserModel>('SELECT * FROM users WHERE username = ?', [username])
export const getAnswer = (problemId: string) => fetchFromDB<AnswerModel>('SELECT answer FROM answers WHERE problem_id = ?', [problemId])

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

/**
 * Delete a problem from the database.
 * 
 * @async
 * @function
 * @param {string} username - The username of the user attempting to delete the problem.
 * @param {string} problemId - The ID of the problem to be deleted.
 * 
 * @returns {Promise<void>} 
 * 
 * @throws {CustomError} - Throws a CustomError with a default status code if either the user or problem is not found.
 * @throws {CustomError} - Throws a CustomError with status code 403 if the user attempting the deletion is not the one who added the problem.
 * @throws {Error} - Throws a generic Error for other exceptions.
 */
export const deleteProblem = async (username: string, problemId: string): Promise<void> => {
  try {
    const user = await getUser(username)
    const problem = await getProblem(problemId)

    if (!user || !problem) { throw CustomError('User or problem not found') }
    if (user.id !== problem.user_id) { throw CustomError('You can only delete problems you added!', 403) }

    await dbRunAsync('DELETE FROM problems WHERE id = ?', [problemId])
  } catch (err) {
    throw err.message ? CustomError(err.message) : err
  }
}

/**
 * Update the details of an existing problem in the database.
 * 
 * @async
 * @function
 * @param {string} username - The username of the user attempting the update.
 * @param {string} problemId - The ID of the problem to be updated.
 * @param {string} newProblemText - The new text to update the problem with.
 * @param {string} answer - The new answer associated with the problem.
 * @param {string} problemType - The new type/category of the problem.
 * 
 * @returns {Promise<void>}
 * 
 * @throws {CustomError} Throws a CustomError with a default status code if either the user or problem is not found.
 * @throws {CustomError} Throws a CustomError with status code 403 if the user attempting the update is not the one who added the problem.
 * @throws {Error} Throws a generic Error for other exceptions.
 */
export const updateProblem = async (
  username: string,
  problemId: string,
  newProblemText: string,
  answer: string,
  problemType: string
): Promise<void> => {
  try {
    const user = await getUser(username)
    const problem = await getProblem(problemId)

    if (!user || !problem) { throw CustomError('User or problem not found') }
    if (user.id !== problem.user_id) { throw CustomError('You can only update problems you added!', 403) }

    await Promise.all([
      dbRunAsync('UPDATE problems SET text = ?, type = ? WHERE id = ?', [newProblemText, problemType, problemId]),
      dbRunAsync('UPDATE answers SET answer = ? WHERE id = ?', [answer, problemId])
    ]);
  } catch (err) {
    throw err.message ? CustomError(err.message) : err
  }
}

/**
 * Retrieve a single problem by its ID.
 * 
 * @async
 * @function
 * @param {string} problemId - The ID of the problem to be retrieved.
 * 
 * @returns {Promise<{ 'id': number, 'text': string }>} - A Promise that resolves to an object containing the problem's ID and text.
 * 
 * @throws {CustomError} Throws a CustomError with status code 404 if the problem ID is incorrect or if no problem is found.
 * @throws {Error} Throws a generic Error for other exceptions.
 */
export const getOneProblem = async (problemId: string): Promise<{ 'id': number, 'text': string }> => {
  try {
    const problem = await getProblem(problemId)
    if (!problem) { throw CustomError('Error! Incorrect id of problem!', 404) }
    return { 'id': problem.id, 'text': problem.text }
  } catch (err) {
    throw err.message ? CustomError(err.message) : err
  }
}

/**
 * Retrieve a list of problems based on various filters: problem type, whether it's solved or not, and username.
 * 
 * @async
 * @function
 * @param {string} typeProblem - The type/category of problem to retrieve. Optional.
 * @param {string} solved - A string flag to indicate if solved problems should be included ("true") or excluded ("false").
 * @param {string} username - The username of the person whose problems are to be fetched. 
 * 
 * @returns {Promise<ProblemModel[] | null>} - A Promise that resolves to an array of ProblemModel objects or null if none are found.
 * 
 * @throws {CustomError} Throws a CustomError if there are issues during the query or if no user is found.
 * @throws {Error} Throws a generic Error for other exceptions.
 */
export const getAllProblems = async (typeProblem: string, solved: string, username: string) : Promise<{ 'id': number, 'text': string }[]> => { 
  try {
    const user = await getUser(username)
    let finalStmt = "select problems.id, problems.text from problems"
    
    // Append additional SQL query conditions based on the parameters
    if (user && solved) {
      let solved_text = solved === "true" ? `where solved.user_id = ${user.id}` 
                                          : `and solved.user_id = ${user.id} where solved.user_id is NULL`
      finalStmt += ` left join solved on problems.id = solved.problem_id ${solved_text}`
      if (typeProblem) { finalStmt += ` and problems.type = "${typeProblem}"` }
    }
    else if (typeProblem) {
      finalStmt += ` where type = "${typeProblem}"`
    }
    
    return dbAllAsync(finalStmt)
  }
  catch(err) {
    throw err.message ? CustomError(err.message) : err
  }
}

/**
 * Answer a specific problem and store the result in the database.
 * 
 * @async
 * @function
 * @param {string} username - The username of the person attempting to answer the problem.
 * @param {string} problemId - The unique identifier of the problem to be answered.
 * @param {string} userAnswer - The answer provided by the user.
 * @returns {Promise<void>}
 * 
 * @throws {CustomError} Throws a CustomError if the user or answer is not found, or if the answer is incorrect.
 * @throws {Error} Throws a generic Error if any other exception occurs.
 */
export const answerProblem = async (username: string, problemId: string, userAnswer: string): Promise<void> => {
  try {
    const [user, answer] = await Promise.all([
      getUser(username),
      getAnswer(problemId)
    ]);

    if (!user || !answer) { throw CustomError('User or answer not found', 404) }
    if (userAnswer !== answer.answer) { throw CustomError('The answer is incorrect!') }

    await dbRunAsync('INSERT INTO solved (user_id, problem_id) VALUES (?, ?)', [user.id, problemId]);
  } catch (err) {
    throw err.message ? CustomError(err.message) : err
  }
}