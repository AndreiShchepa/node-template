import { Request, Response } from 'express'
import * as lodash from 'lodash'
import { Buffer } from 'buffer'

export interface AppMessage {
  user: string // it was TODO (undefined)
  locale: string
  param: {
    [key: string]: string
  }
  requestBody: any
}

/**
 * Extracts Bearer token from an Authorization header.
 * @param authorizationHeader - The Authorization header from the request.
 * @returns The access token or undefined if the header is invalid.
 */
const getBearerToken = (authorizationHeader?: string): string | undefined => {
  const [bearer, accessToken] = (authorizationHeader ?? '').split(' ')
  return bearer?.toLowerCase() === 'basic' ? accessToken : undefined
}

/**
 * Authenticates an access token.
 * @param accessToken - The token to authenticate.
 * @returns The userId or username associated with the token, or empty string if the token is invalid.
 */
const authenticateAccessToken = (accessToken?: string): string => {
  // If the token starts with 'U_', extract the userId.
  if (accessToken?.startsWith('U_')) {
    const [, userId] = accessToken.split('_')
    return userId
  }

  // Else, try to decode the token.
  try {
    const credentials = Buffer.from(accessToken ?? '', 'base64').toString(
      'utf8'
    )
    const [username] = credentials.split(':')
    return username
  } catch (error) {
    return ''
  }
}

export const createFromHttpRequest = async (httpContext: {
  req: Request
  res: Response
}): Promise<AppMessage> => {
  const { req } = httpContext
  const user: string = req.headers.authorization
    ? await authenticateAccessToken(getBearerToken(req.headers.authorization))
    : ''

  return {
    user,
    locale: 'en', // Install i18n to getLocale() from HTTP Request,
    param: lodash.defaults({}, req.headers, req.params, req.query),
    requestBody: req.body,
  }
}
