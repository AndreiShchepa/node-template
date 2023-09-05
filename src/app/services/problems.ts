import { ctrl } from '../controllers'
import { 
  ProblemsPost,
  UsersPost
} from '../../openapi/interfaces'
import config from '../../config'
const md5 = require('md5')
import { 
  addUser,
  addProblem
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