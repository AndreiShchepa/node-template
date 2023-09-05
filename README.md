## Overview

I have successfully completed the development task based on the requirements and optional guidelines. The project is written in TypeScript and utilizes the provided template. User authentication has been implemented using Basic Access Authentication. The CRUD functionalities for Problems are fully operational; users can create, read, update, and delete problems. Importantly, update and delete operations are restricted to the users who created the problem, enhancing security and data integrity.

The problems can either be of the type 'riddle' or 'expression,' and each problem has only one unique answer. Users can submit answers, and only correct answers are accepted. Filtering by problem type and by solved/unsolved status for the current user has been implemented as part of the optional enhancements. I've employed SQLite in-memory database for storage, and comprehensive tests have been written to validate the functionality. The REST API is fully documented, and I've ensured to use appropriate HTTP status codes and meaningful responses.

In this project, I opted to use postfix notation (also known as Reverse Polish Notation) for solving mathematical expressions, because it eliminates the need for parentheses to indicate operations order, thereby simplifying the expression's complexity. This results in easier and more efficient parsing and evaluation of mathematical expressions. The algorithm utilizes a stack data structure to hold operands and operators, which ensures a smooth and quick calculation process. Because postfix notation works in a linear fashion, reading from left to right, it is computationally more efficient, making it a preferable choice for performance-sensitive applications. The postfix notation technique aligns well with the principles of the stack, making it easier to implement and understand.

---

## Usage

`npm install`
`npm run build`
`npm start | test` - depends what do you need

`API Requests:`

- `POST /signup`: Registers a new user - Authentication: Basic Access Authentication required.
- `POST /problems`: Creates a new problem - Query Parameters: {`type`: Specifies the type of problem. Acceptable values are "expression" or "riddle"} - Request Body: {`problemText`: Contains the text of the problem}
- `POST /problems/:id`: Submits an answer for a specific problem. - Path Parameters: {`id`: The unique identifier for the problem} - Request Body: {`answer`: Contains the answer to the problem}
- `GET /problems`: Retrieves a list of problems, with optional filtering. - Query Parameters: {`type`: Filter by the type of problem, either "expression" or "riddle", `solved`: Filter by whether the problem has been solved by the current user, either "true" or "false"}
- `GET /problems/:id`: Fetches a specific problem by its ID. - Path Parameters: {`id`: The unique identifier for the problem}
- `DELETE /problems/:id`: Removes a specific problem. - Path Parameters: {`id`: The unique identifier for the problem}
- `PATCH /problems/:id`: Updates the text and/or type of a problem, and recalculates its answer. - Path Parameters: {`id`: The unique identifier for the problem} - Query Parameters: {`newType`: The new type for the problem, either "expression" or "riddle"} - Request Body: {`newProblemText`: Contains the updated text of the problem}

`Error Handling`
Failing to adhere to the specified format may result in an error. Such errors will be returned to you with a status code and a corresponding message indicating what went wrong.

---

## Tests

A total of 36 tests have been written to cover a wide range of scenarios, including both valid and invalid requests. These tests serve as a comprehensive suite to validate the core functionalities as well as edge cases. All helper functions required for testing are neatly organized in `template.test.ts`, making it easy for anyone to understand the test setup. The tests are designed to be easily extendable, so feel free to add your own to cover additional cases or scenarios. From simple GET requests to complex query parameters, the test suite aims to offer a thorough validation of the API endpoints and their corresponding functionalities. Testing for good and bad requests ensures that our API is both resilient and reliable.

---

## DB scheme

1. CREATE TABLE "answers" (
   "id" INTEGER NOT NULL UNIQUE,
   "problem_id" INTEGER NOT NULL UNIQUE,
   "answer" TEXT NOT NULL,
   PRIMARY KEY("id" AUTOINCREMENT),
   FOREIGN KEY("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE
   );

2. CREATE TABLE "problems" (
   "id" INTEGER NOT NULL UNIQUE,
   "text" TEXT NOT NULL,
   "user_id" INTEGER NOT NULL,
   "type" TEXT NOT NULL,
   PRIMARY KEY("id" AUTOINCREMENT)
   );

3. CREATE TABLE "solved" (
   "id" INTEGER NOT NULL UNIQUE,
   "user_id" INTEGER NOT NULL,
   "problem_id" INTEGER NOT NULL,
   FOREIGN KEY("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE,
   FOREIGN KEY("user_id") REFERENCES "users"("id"),
   UNIQUE("user_id","problem_id"),
   PRIMARY KEY("id" AUTOINCREMENT)
   );

4. CREATE TABLE "users" (
   "id" INTEGER NOT NULL UNIQUE,
   "username" TEXT NOT NULL UNIQUE,
   "password" TEXT NOT NULL,
   PRIMARY KEY("id" AUTOINCREMENT)
   );

---

## License

This project is published under [MIT license](./LICENSE).
