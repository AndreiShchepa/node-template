type Operator = '+' | '-' | '*' | '/';
type Token = number | Operator | '(' | ')';

/**
 * Gets the precedence value of a given mathematical operator.
 *
 * The precedence value determines the order in which operators are evaluated.
 * For example, multiplication and division have higher precedence than addition and subtraction.
 *
 * @param {Operator} op - The operator whose precedence value needs to be determined.
 * @returns {number} - The precedence value for the given operator.
 * @throws {Error} Throws an error if an unknown operator is passed.
 *
 * @example
 * // Get the precedence of the '+' operator
 * const prec = precedence('+');
 * // prec should be 1
 *
 * // Get the precedence of the '*' operator
 * const prec = precedence('*');
 * // prec should be 2
 */
const precedence = (op: Operator): number => {
  switch (op) {
    case '+':
    case '-':
      return 1
    case '*':
    case '/':
      return 2
    default:
      throw new Error('Unknown operator: ' + op)
  }
}

/**
 * Tokenizes a mathematical expression represented as a string.
 *
 * The function scans the input string from left to right and generates an array of tokens.
 * The tokens can be numbers, operators, or parentheses.
 *
 * @param {string} input - The input string representing a mathematical expression in infix notation.
 * @returns {Token[]} - An array of tokens where each token is either a number, an operator, or a parenthesis.
 * @throws {Error} Throws an error if there are mismatched parentheses in the expression.
 *
 * @example
 * // Tokenize an infix expression
 * const tokens = tokenize("3 + 4 * 2");
 * // tokens should be [3, "+", 4, "*", 2]
 */
const tokenize = (input: string): Token[] => {
  const tokens: Token[] = []
  let numBuffer = ''
  let parenCount = 0

  for (const char of input) {
    if ('0123456789.'.includes(char)) {
      numBuffer += char
    } 
    else {
      if (numBuffer) {
        tokens.push(parseFloat(numBuffer))
        numBuffer = ''
      }

      if ('+-*/()'.includes(char)) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) { throw new Error('Mismatched parentheses') }
        tokens.push(char as Token)
      }
    }
  }

  if (parenCount !== 0) { throw new Error('Mismatched parentheses') }
  if (numBuffer) { tokens.push(parseFloat(numBuffer)) }
  return tokens
}

/**
 * Converts an infix expression represented as an array of tokens to postfix notation.
 *
 * The function transforms an array of tokens that represent an infix mathematical
 * expression into a postfix notation expression, also represented as an array of tokens.
 * It uses the shunting-yard algorithm for the conversion.
 *
 * @param {Token[]} tokens - An array of tokens representing an infix expression.
 * @returns {Token[]} - An array of tokens representing the equivalent postfix expression.
 *
 * @example
 * // Convert infix expression to postfix
 * const result = toPostfix([3, "+", 4, "*", 2]);
 * // result should be [3, 4, 2, "*", "+"]
 */
const toPostfix = (tokens: Token[]): Token[] => {
  const output: Token[] = []
  const operators: Token[] = []

  for (const token of tokens) {
    if (typeof token === 'number') { 
      output.push(token) 
    } else if (token === '(') {
      operators.push(token) 
    } 
    else if (token === ')') {
      while (operators.length && operators[operators.length - 1] !== '(') {
        output.push(operators.pop() as Operator)
      }
      operators.pop()
    } else {
      while (operators.length && 
             operators[operators.length - 1] !== '(' && 
             precedence(token as Operator) <= precedence(operators[operators.length - 1] as Operator)) 
      {
        output.push(operators.pop() as Operator)
      }
      operators.push(token)
    }
  }

  while (operators.length) {
    output.push(operators.pop() as Operator)
  }

  return output
}

/** 
 * Evaluates a postfix expression represented as an array of tokens.
 * 
 * This function evaluates a postfix mathematical expression represented by an array of tokens.
 * It expects that the array of tokens is a valid postfix expression.
 * 
 * @param {Token[]} postfixTokens - An array of tokens representing a postfix expression.
 * @returns {number} - The result of evaluating the postfix expression.
 * @throws {Error} - Throws an error if division by zero is attempted or if an unknown operator is encountered.
 * 
 * @example
 * // Evaluate a postfix expression
 * const result = evaluatePostfix([3, 4, 2, "*", "+"]);
 * // result should be 11
 */
const evaluatePostfix = (postfixTokens: Token[]): number => {
  const stack: number[] = []

  for (const token of postfixTokens) {
    if (typeof token === 'number') {
      stack.push(token)
    } else {
      const b = stack.pop()!
      const a = stack.pop()!
      switch (token) {
        case '+':
          stack.push(a + b)
          break
        case '-':
          stack.push(a - b)
          break
        case '*':
          stack.push(a * b)
          break
        case '/':
          if (b === 0) {
              throw new Error('Division by zero');
          }
          stack.push(a / b)
          break
        default:
          throw new Error('Unknown operator: ' + token);
      }
    }
  }

  return stack.pop()!;
}

/** 
 * Parses and evaluates a mathematical expression.
 * 
 * This function tokenizes the given expression, converts it to postfix notation,
 * and then evaluates the postfix expression.
 * 
 * @param {string} exp - The expression to parse and evaluate.
 * @returns {number | null} - The result of evaluating the expression or null if it fails.
 * 
 * @example
 * // Parse and evaluate a simple expression
 * const result = parseAndEvaluate('3 + 4 * 2');
 * // result should be 11
 */
export const parseAndEvaluate = (exp: string) => {
  try {
    const result = evaluatePostfix(toPostfix(tokenize(exp)))
    if (Number.isNaN(result) || typeof result === 'undefined') { return null }
    else { return result }
  } catch (err) {
      return null
  }
} 

