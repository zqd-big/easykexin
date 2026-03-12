export type QuestionMode = "micro" | "decompose" | "template";

export interface Question {
  id: string;
  title: string;
  brief: string;
  skill_tags: string[];
  source_problem: string;
  difficulty: number;
  expected_time_seconds: number;
  input_example: string;
  expected_output: string;
  starter_code: string;
  answer_code?: string;
  explanation?: string;
  common_mistakes?: string[];
  related_functions: string[];
  language: "C";
  mode: QuestionMode;
  step_order?: number;
}

export interface MetaResponse {
  tags: string[];
  functions: string[];
  sourceProblems: string[];
  modes: QuestionMode[];
  totalQuestions: number;
}

export interface WrongbookResponse {
  wrongQuestions: Question[];
  weakSkills: Array<{ tag: string; wrongCount: number }>;
  totalWrongQuestions: number;
  totalSubmissions: number;
}
