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
  answer_code: string;
  explanation: string;
  common_mistakes: string[];
  related_functions: string[];
  language: "C";
  mode: QuestionMode;
  step_order?: number;
}

export interface Submission {
  id: string;
  question_id: string;
  code: string;
  is_correct: boolean;
  duration_seconds?: number;
  submitted_at: string;
}

export interface UserProgress {
  submissions: Submission[];
}
