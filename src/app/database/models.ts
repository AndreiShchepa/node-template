export interface UserModel {
    id: number;
    username: string,
    password: string
}

export interface ProblemModel {
    id: number,
    text: string,
    user_id: number,
    type: string,
}

export interface AnswerModel {
    id: number,
    problem_id: string,
    answer: string
}