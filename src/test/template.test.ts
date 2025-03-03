import config from '../config'
import { E_CODE, ServerError } from '../app/errors'
import { t } from './testing'

// helpers for tests
const createProblem = (type: string, problemText: string) => { return { type: type, problemText: problemText } }
const createPostAddProblem = (auth: string, problems: any) => { return { authorization: auth, problems: problems } }
const createUser = (token1: string, token2: any) => { return { authorization: token2, res: { token1: token1, token2: token2 } } }
const createPatchUpdateProblem = (auth: string, problems: any) => { return { authorization: auth, problems: problems } }
const updateProblem = (id: number, newType: string, newProblemText: string) => { return { id: id, newType: newType, newProblemText: newProblemText } }
const createDeleteProblem = (auth: string, ids: any) => { return { authorization: auth, ids: ids } }
const createGetProblem = (auth: string, filters: any, answer: any) => { return { authorization: auth, filters: filters, answer: answer } }
const createPostAnswerProblem = (auth: string, answers: any) => { return { authorization: auth, answers: answers } }  
const answerProblem = (id: number, answer: string) => { return { id: id, answer: answer} }

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
    test('Answer to 1 expression and 1 riddle', async () => {
      const data = [
        createPostAnswerProblem(
          "Basic U_ivan", 
          [
            answerProblem(1, "4"),
            answerProblem(4, config.my_vars.riddleAnswer)
          ]
        ),
        createPostAnswerProblem(
          "Basic U_andrei", 
          [
            answerProblem(6, "5"),
            answerProblem(8, config.my_vars.riddleAnswer)
          ]
        ),
        createPostAnswerProblem(
          "Basic U_sasa", 
          [
            answerProblem(10, "0"),
            answerProblem(11, config.my_vars.riddleAnswer)
          ]
        ),
      ]

      for (let user of data) {
        for (let answer of user.answers) {
          await t.request()
          .post(`/problems/${answer.id}`)
          .set('Authorization', user.authorization)
          .send({ answer: answer.answer })
          .expect(200)
          .then(({ body }: any) => {
            expect(body).toEqual({
              status: 200,
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
  }),
  describe('Problems wrong requests', () => {
    describe('POST /problems', () => {
      test('User is not authorized', () => {
        return t.request()
          .post('/problems')
          .expect(404) 
          .then(({ body }: any) => {
            expect(body.err).toBe('Unauthorized');
          });
      });
      test('Type is not a string', () => {
        return t.request()
          .post('/problems')
          .set('Authorization', 'Basic U_andrei')
          .query({ type: 123 /* Invalid type */ })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.err).toBe('Bad request. Check documentation for sending requests correctly');
          });
      });
      test('ProblemText is not a string', () => {
        return t.request()
          .post('/problems')
          .set('Authorization', 'Basic U_andrei')
          .query({ type: 'expression'})
          .send({problemText: 123 /* Invalid problemText */ })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.err).toBe('Bad request. Check documentation for sending requests correctly');
          });
      });
      test('Type is not "expression" or "riddle"', () => {
        return t.request()
          .post('/problems')
          .set('Authorization', 'Basic U_andrei')
          .query({ type: 'invalid_type'})
          .send({problemText: 'some text'})
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('Error! Wrong type of the problem (invalid_type)!');
          });
      });
      test('Expression has wrong format', () => {
        return t.request()
          .post('/problems')
          .set('Authorization', 'Basic U_andrei')
          .query({type: 'expression'})
          .send({problemText: 'aaa' })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('Error! Wrong expression (aaa)!');
          });
      });
    }),
    describe('DELETE /problems/:id', () => {
      test('User is not authorized', () => {
        return t.request()
          .delete('/problems/1')
          .expect(404)
          .then(({ body }: any) => {
            expect(body.err).toBe('Unauthorized');
          });
      });
      test('User or problem not found', () => {
        return t.request()
          .delete('/problems/2')
          .set('Authorization', 'Basic U_andrei')
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('User or problem not found');
          });
      });
      test('User is not the owner of the problem', () => {
        return t.request()
          .delete('/problems/7')
          .set('Authorization', 'Basic U_andrei')
          .expect(403)
          .then(({ body }: any) => {
            expect(body.res).toBe('You can only delete problems you added!');
          });
      });
    }),
    describe('PATCH /problems/:id', () => {
      test('User is not authorized', () => {
        return t.request()
          .patch('/problems/1')
          .expect(404)
          .then(({ body }: any) => {
            expect(body.err).toBe('Unauthorized');
          });
      });
      test('Bad request', () => {
        return t.request()
          .patch('/problems/123')
          .set('Authorization', 'Basic U_someUser')
          .expect(400)
          .then(({ body }: any) => {
            expect(body.err).toBe('Bad request. Check documentation for sending requests correctly');
          });
      });
      test('Wrong expression', () => {
        return t.request()
          .patch('/problems/someId')
          .set('Authorization', 'Basic U_someUser')
          .query({ newType: 'expression' })
          .send({ newProblemText: 'wrong expression' })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('Error! Wrong expression (wrong expression)!');
          });
      });
      test('Wrong problem type', () => {
        return t.request()
          .patch('/problems/someId')
          .set('Authorization', 'Basic U_someUser')
          .query({ newType: 'wrongType' })
          .send({ newProblemText: 'some text' })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('Error! Wrong type of the problem (wrongType)!');
          });
      });
      test('User is not the owner of the problem', () => {
        return t.request()
          .patch('/problems/7')
          .set('Authorization', 'Basic U_andrei')
          .query({ newType: 'riddle' })
          .send({ newProblemText: 'new expression' })
          .expect(403)
          .then(({ body }: any) => {
            expect(body.res).toBe('You can only update problems you added!');
          });
      });
    }),
    describe('GET /problems', () => {
      // Test for invalid problem type
      test('Wrong problem type', () => {
        return t.request()
          .get('/problems')
          .query({ typeProblem: 'wrongType' })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('Error! Wrong type of the problem (wrongType)!');
          });
      });
    
      // Test for invalid solved filter
      test('Wrong solved filter', () => {
        return t.request()
          .get('/problems')
          .query({ solved: 'wrongValue' })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('Error! Wrong filter (wrongValue)! Required "true" or "false".');
          });
      });
    }),
    describe('POST /problems/:id', () => {
      test('Unauthorized access', () => {
        return t.request()
          .post('/problems/1')
          .expect(404)
          .then(({ body }: any) => {
            expect(body.err).toBe('Unauthorized');
          });
      });
      test('Invalid problem ID type', () => {
        return t.request()
          .post('/problems/123')
          .set('Authorization', 'Basic U_andrei')
          .send({})
          .expect(400)
          .then(({ body }: any) => {
            expect(body.err).toBe('Bad request. Check documentation for sending requests correctly');
          });
      });
      test('Invalid answer type', () => {
        return t.request()
          .post('/problems/1')
          .set('Authorization', 'Basic U_andrei')
          .send({ answer: 12345 })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.err).toBe('Bad request. Check documentation for sending requests correctly');
          });
      });
      test('Incorrect answer', () => {
        return t.request()
          .post('/problems/1')
          .set('Authorization', 'Basic U_andrei')
          .send({ answer: '12' })
          .expect(400)
          .then(({ body }: any) => {
            expect(body.res).toBe('The answer is incorrect!');
          });
      });
      test('User or answer not found', () => {
        return t.request()
          .post('/problems/1')
          .set('Authorization', 'Basic U_unknown')
          .send({ answer: 'someAnswer' })
          .expect(404)
          .then(({ body }: any) => {
            expect(body.res).toBe('User or answer not found');
          });
      });
    });
  });
})
