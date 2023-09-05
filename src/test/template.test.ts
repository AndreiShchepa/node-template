import config from '../config'
import { E_CODE, ServerError } from '../app/errors'
import { t } from './testing'

const createProblem = (type: string, problemText: string) => { return { type: type, problemText: problemText } }
const createPostAddProblem = (auth: string, problems: any) => { return { authorization: auth, problems: problems } }
const createUser = (token1: string, token2: any) => { return { authorization: token2, res: { token1: token1, token2: token2 } } }

describe('Template (System)', () => {
  test('Configuration is loaded', () => {
    expect(typeof config)
      .toBeTruthy()
      .toBe('object')
  })
  describe('Errors', () => {
    test('Throws', () => {
      expect(() => {
        throw new ServerError(E_CODE.UNKNOWN)
      }).toThrow(ServerError)
    })
    test('Throws with correct name', () => {
      let name = ''
      try {
        throw new ServerError(E_CODE.UNKNOWN)
      } catch (e) {
        if (e instanceof ServerError) {
          name = e.name
        }
      }
      expect(name).toBe('ServerError')
    })
    test('Responds to toJson as expected', () => {
      expect(
        new ServerError(E_CODE.UNKNOWN, { data: true }).toJSON()
      ).toMatchSnapshot({
        stack: expect.stringContaining('at'),
      })
    })
    test('Works without error code', () => {
      expect(new ServerError().toJSON()).toMatchSnapshot({
        stack: expect.stringContaining('at'),
      })
    })
  })
  describe('Server', () => {
    it('Server does respond', () => {
      return t.request().get('/').expect(200)
    })
    it('Healthz', () => {
      return (
        t
          .request()
          .get('/healthz')
          // Default healthz fails deliberately to remind replacement with real impl.
          .expect(500)
          .then(({ body }: any) => {
            expect(body.tldr).toMatchSnapshot()
          })
      )
    })
  })
  describe('Hello', () => {
    test('Hello', () => {
      const input = {
        a: 1,
      }
      return t
        .request()
        .post('/hello')
        .send(input)
        .expect(200)
        .then(({ body }: any) => {
          const { payload, ...rest } = body
          expect(payload).toEqual(input)
          expect(rest).toMatchInlineSnapshot(`
            Object {
              "hello": "World",
            }
          `)
        })
    })
  })
  describe('Problems correct requests', () => {
    test('Create 3 users: andrei, sasa and ivan', async () => {
      const data = [
        createUser("Basic U_andrei", "Basic YW5kcmVpOmxvbDE0MTRsb2wxNA=="),
        createUser("Basic U_sasa", "Basic c2FzYTpsb2wyOTI5bG9s=="),
        createUser("Basic U_ivan", "Basic aXZhbjpsb2wyNzI3bG9s==")
      ]
    
      for (let user of data) {
        await t.request()
          .post('/signup')
          .set('Authorization', user.authorization)
          .expect(200)
          .then(({ body }: any) => {
            expect(body).toEqual(
              user.res
            );
          });
      }
    }),
    test('Add 2 expressions and 2 riddles for each user', async () => {
      const data = [
        createPostAddProblem(
          "Basic U_andrei", 
          [
            createProblem("expression", "1- (10/5)* 2 +7"),
            createProblem("expression", "80 / 80 + 90 / 10 - 9 *2 + 20"),
            createProblem("riddle", "1 Test riddle from Andrei"),
            createProblem("riddle", "2 Test riddle from Andrei"),
          ]
        ),
        createPostAddProblem(
          "Basic U_sasa", 
          [
            createProblem("expression", "9 + 1 + 2 - (2 - 9) * 3"),
            createProblem("expression", "1+4"),
            createProblem("riddle", "1 Test riddle from Sasa"),
            createProblem("riddle", "2 Test riddle from Sasa"),
          ]
        ),
        createPostAddProblem(
          "Basic U_ivan", 
          [
            createProblem("expression", "90 -10 -10 - 8 * 10 + 10 + 1"),
            createProblem("expression", "9+1-10*2+10 + 0 * 4"),
            createProblem("riddle", "1 Test riddle from Ivan"),
            createProblem("riddle", "2 Test riddle from Ivan"),
          ]
        )
      ]

      for (let user of data) {
        for (let problem of user.problems) {
          await t.request()
          .post('/problems')
          .set('Authorization', user.authorization)
          .query({ type: problem.type })
          .send({ problemText: problem.problemText })
          .expect(201)
          .then(({ body }: any) => {
            expect(body).toEqual({
              status: 201,
              res: "Success"
            });
          });
        }  
      }
    })
  })
})
