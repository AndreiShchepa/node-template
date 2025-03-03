import { ctrl } from '../controllers'
import { 
  ProblemsPost,
  ProblemsDelete,
  ProblemsPatch,
  ProblemsGet,
  UsersPost
} from '../../openapi/interfaces'
import config from '../../config'
const md5 = require('md5')
import { 
  addUser,
  addProblem,
  deleteProblem,
  updateProblem,
  getAllProblems,
  getOneProblem,
  answerProblem
} from '../database/db_functions'
import * as openapi from '../../openapi'
import { parseAndEvaluate } from '../eval_expr'

const checkAuthorization = (user: string) => {
  if (!user) {
    throw {status: 404, err : 'Unauthorized'}
  }
}

const checkRequest = (condition : boolean) => {
  if (condition) {
    throw {status: 400, err : 'Bad request. Check documentation for sending requests correctly'}
  }
}

/**
 * Handles user creation via a POST request.
 *
 * Extracts authorization header, validates it, and then adds the user 
 * to the database after hashing the password.
 * 
 * @returns {Promise<openapi.OpenAPIResponse<UsersPost>>}
 * 
 * @throws {Object}
 */
export const createUserHandler = async (): Promise<openapi.OpenAPIResponse<UsersPost>> => {
    const message = ctrl.getOasPathAppMessage<UsersPost>();
    console.log(message)
    if (!message.param.authorization) { throw {status: 401, res: `Please use Basic Authentication for authorization`} }
    const [username, userpwd] = (Buffer.from(message.param.authorization.split(" ")[1]!, 'base64').toString('utf8')).split(":")
  
    await addUser(username, md5(userpwd))
    return {
      "token1": "Basic U_" + username,
      "token2": message.param.authorization,
    }
  }

/**
 * Handles adding a problem through a POST request.
 * 
 * Validates the request and parameters, performs calculations if needed, 
 * and calls the `addProblem` function to add the problem to the database.
 *
 * @returns {Promise<openapi.OpenAPIResponse<Problems>>}
 * @throws {Object}  
 */
export const addProblemHandler = async (): Promise<openapi.OpenAPIResponse<ProblemsPost>> => {
  const message = ctrl.getOasPathAppMessage<ProblemsPost>()

  checkAuthorization(message.user)
  checkRequest(!message.param || typeof message.param.type !== 'string' || !message.requestBody 
               || typeof message.requestBody.problemText !== 'string')

  let answer: string | null = config.my_vars.riddleAnswer
  if (message.param.type === 'expression') {
    answer = parseAndEvaluate(message.requestBody.problemText)?.toString() ?? null
    if (answer === null) throw {status: 400, res: `Error! Wrong expression (${message.requestBody.problemText})!`}
  }
  else if (message.param.type !== 'riddle') {
    throw {status: 400, res: `Error! Wrong type of the problem (${message.param.type})!`}
  }

  await addProblem(message.user, message.requestBody.problemText, answer, message.param.type)
  return {status: 201, res: 'Success'}
}

/**
 * Handles deleting a problem through a DELETE request.
 * 
 * Validates the request and parameters, checks authorization,
 * and calls the `deleteProblem` function to remove the problem from the database.
 *
 * @returns {Promise<openapi.OpenAPIResponse<ProblemsDelete>>}
 * @throws {Object}
 */
export const deleteProblemHandler = async (): Promise<openapi.OpenAPIResponse<ProblemsDelete>> => {
  const message = ctrl.getOasPathAppMessage<ProblemsDelete>();

  checkAuthorization(message.user)
  checkRequest(!message.param || typeof message.param.id !== 'string')

  await deleteProblem(message.user, message.param.id)
  return {status: 204, res: 'Success'}
}

/**
 * Handles updating a problem through a PATCH request.
 * 
 * Validates the request and parameters, checks authorization, 
 * and calls the `updateProblem` function to update the problem in the database.
 * 
 * @returns {Promise<openapi.OpenAPIResponse<ProblemsPatch>>}
 * @throws {Object}
 */
export const updateProblemHandler = async (): Promise<openapi.OpenAPIResponse<ProblemsPatch>> => {
  const message = ctrl.getOasPathAppMessage<ProblemsPatch>();

  checkAuthorization(message.user)
  checkRequest(!message.param || typeof message.param.id !== 'string' || !message.requestBody 
               || typeof message.requestBody.newProblemText !== 'string')

  let answer: string | null = config.my_vars.riddleAnswer
  if (message.param.newType == 'expression') {
    answer = parseAndEvaluate(message.requestBody.newProblemText)?.toString() ?? null
    if (answer === null) return {status: 400, res: `Error! Wrong expression (${message.requestBody.newProblemText})!`}
  }
  else if (message.param.newType !== 'riddle') {
    return {status: 400, res: `Error! Wrong type of the problem (${message.param.newType})!`}
  }

  await updateProblem(message.user, message.param.id, message.requestBody.newProblemText, answer, message.param.newType)
  return {status: 202, res: "Success"}
}

/**
 * Handles fetching a single problem through a GET request.
 * 
 * Validates the request parameters, and calls the `getOneProblem` function 
 * to retrieve the problem from the database.
 * 
 * @returns {Promise<openapi.OpenAPIResponse<ProblemsGet>>} 
 * 
 * @throws {Object}
 */
export const getProblemHandler = async (): Promise<openapi.OpenAPIResponse<ProblemsGet>> => {
  const message = ctrl.getOasPathAppMessage<ProblemsGet>();
  checkRequest(!message.param || !message.param.id || typeof message.param.id !== 'string')
  return await getOneProblem(message.param.id)
}

/**
 * Handles fetching all problems through a GET request.
 * 
 * Validates the request parameters, and calls the `getAllProblems` function
 * to retrieve the problems from the database based on the provided filters.
 * 
 * @returns {Promise<openapi.OpenAPIResponse<ProblemsGet>>} 
 * 
 * @throws {Object}
 */
export const getAllProblemsHandler = async (): Promise<openapi.OpenAPIResponse<ProblemsGet>> => {
  const message = ctrl.getOasPathAppMessage<ProblemsGet>()

  if (message.param.typeProblem && !['expression', 'riddle'].includes(message.param.typeProblem)) {
    return {status: 400, res: `Error! Wrong type of the problem (${message.param.typeProblem})!`}
  }

  if (message.param.solved && !['true', 'false'].includes(message.param.solved)) {
    return {status: 400, res: `Error! Wrong filter (${message.param.solved})! Required "true" or "false".`}
  }

  return await getAllProblems(message.param.typeProblem, message.param.solved, message.user)
}

/**
 * Handles the answering of a problem via a POST request.
 *
 * Validates the request parameters and body, checks for authorization, 
 * and then calls the `answerProblem` function to record the answer.
 * 
 * @returns {Promise<openapi.OpenAPIResponse<ProblemsPost>>} 
 * 
 * @throws {Object}
 */
export const answerProblemHandler = async (): Promise<openapi.OpenAPIResponse<ProblemsPost>> => {
  const message = ctrl.getOasPathAppMessage<ProblemsPost>()

  checkAuthorization(message.user)
  checkRequest(!message.param || typeof message.param.id !== 'string' 
               || !message.requestBody || typeof message.requestBody.answer !== 'string')

  await answerProblem(message.user, message.param.id, message.requestBody.answer)
  return {status: 200, res: "Success"}
}