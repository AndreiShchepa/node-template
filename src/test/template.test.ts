import config from '../config'
import { E_CODE, ServerError } from '../app/errors'
import { t } from './testing'

const createProblem = (type: string, problemText: string) => { return { type: type, problemText: problemText } }
const createPostAddProblem = (auth: string, problems: any) => { return { authorization: auth, problems: problems } }
const createUser = (token1: string, token2: any) => { return { authorization: token2, res: { token1: token1, token2: token2 } } }
const createPatchUpdateProblem = (auth: string, problems: any) => { return { authorization: auth, problems: problems } }
const updateProblem = (id: number, newType: string, newProblemText: string) => { return { id: id, newType: newType, newProblemText: newProblemText } }
const createDeleteProblem = (auth: string, ids: any) => { return { authorization: auth, ids: ids } }
const createGetProblem = (auth: string, filters: any, answer: any) => { return { authorization: auth, filters: filters, answer: answer } }

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
    }),
    test('Update 1 riddle and 1 expression for each user', async () => {
      const data = [
        createPatchUpdateProblem(
          "Basic U_andrei", 
          [
            updateProblem(2, "expression", "6 + 6+ 6"),
            updateProblem(3, "riddle", "Updated riddle Andrei"),
          ]
        ),
        createPatchUpdateProblem(
          "Basic U_sasa", 
          [
            updateProblem(5, "expression", "6 - 6 - 6"),
            updateProblem(7, "riddle", "Updated riddle Sasa"),
          ]
        ),
        createPatchUpdateProblem(
          "Basic U_ivan", 
          [
            updateProblem(9, "expression", "1 + 3 * 3 + 7 - (2 - 6)"),
            updateProblem(12, "riddle", "Updated riddle Ivan"),
          ]
        ),
      ]

      for (let user of data) {
        for (let problem of user.problems) {
          await t.request()
          .patch(`/problems/${problem.id}`)
          .set('Authorization', user.authorization)
          .query({ newType: problem.newType })
          .send({ newProblemText: problem.newProblemText })
          .expect(202)
          .then(({ body }: any) => {
            expect(body).toEqual({
              status: 202,
              res: "Success"
            });
          });
        }  
      }
    }),
    test('Get all problems', async () => {
      const expected_data = [
        {"id": 1, "text": "1- (10/5)* 2 +7"},
        {"id": 2, "text": "6 + 6+ 6"},
        {"id": 3, "text": "Updated riddle Andrei"},
        {"id": 4, "text": "2 Test riddle from Andrei"},
        {"id": 5, "text": "6 - 6 - 6"},
        {"id": 6, "text": "1+4"},
        {"id": 7, "text": "Updated riddle Sasa"},
        {"id": 8, "text": "2 Test riddle from Sasa"},
        {"id": 9, "text": "1 + 3 * 3 + 7 - (2 - 6)"},
        {"id": 10, "text": "9+1-10*2+10 + 0 * 4"},
        {"id": 11, "text": "1 Test riddle from Ivan"},
        {"id": 12, "text": "Updated riddle Ivan"},
      ]

      await t.request()
      .get(`/problems`)
      .expect(200)
      .then(({ body }: any) => {        
        expect(body).toEqual(expected_data);
      });
    }),
    test('Delete problems', async () => {
      const data = [
        createDeleteProblem(
          "Basic U_andrei", 
          [2]
        ),
        createDeleteProblem(
          "Basic U_sasa", 
          [5, 6]
        ),
        createDeleteProblem(
          "Basic U_ivan", 
          [9, 12]
        ),
      ]

      for (let user of data) {
        for (let id of user.ids) {
          await t.request()
          .delete(`/problems/${id}`)
          .set('Authorization', user.authorization)
          .expect(204)
          .then(({ body }: any) => {
          });
        }  
      }
    }),
    test('Get the problem with filters', async () => {
      const data = [
        createGetProblem(
          "Basic U_andrei", 
          {type: "riddle", solved: "true"},
          [{"id": 8, "text": "2 Test riddle from Sasa"}]
        )
      ]

      for (let user of data) {
        await t.request()
        .get(`/problems`)
        .query({typeProblem: user.filters.typeProblem, solved: user.filters.solved})
        .set('Authorization', user.authorization)
        .expect(200)
        .then(({ body }: any) => {
          expect(body).toEqual(user.answer)
        });
      }  
    }),
    test('Get problems without any filters', () => {
      return t.request()
        .get('/problems')
        .expect(200)
        .then(({ body }: any) => {
          expect(Array.isArray(body)).toBe(true);
        });
    });
  })
})
