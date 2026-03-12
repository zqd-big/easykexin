import type { MetaResponse, Question, WrongbookResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function fetchMeta(): Promise<MetaResponse> {
  return req<MetaResponse>("/api/meta");
}

export async function fetchQuestions(params: {
  mode?: string;
  skill?: string;
  func?: string;
  difficulty?: number;
  source?: string;
  includeAnswer?: boolean;
}): Promise<Question[]> {
  const sp = new URLSearchParams();
  if (params.mode) sp.set("mode", params.mode);
  if (params.skill) sp.set("skill", params.skill);
  if (params.func) sp.set("function", params.func);
  if (params.difficulty) sp.set("difficulty", String(params.difficulty));
  if (params.source) sp.set("source", params.source);
  if (params.includeAnswer) sp.set("include_answer", "1");
  const q = sp.toString();
  return req<Question[]>(`/api/questions${q ? `?${q}` : ""}`);
}

export async function fetchQuestionById(id: string, includeAnswer = false): Promise<Question> {
  const suffix = includeAnswer ? "?include_answer=1" : "";
  return req<Question>(`/api/questions/${id}${suffix}`);
}

export async function fetchWrongbook(): Promise<WrongbookResponse> {
  return req<WrongbookResponse>("/api/wrongbook");
}

export async function fetchDecompose(source: string): Promise<Question[]> {
  return req<Question[]>(`/api/decompose/${source}`);
}

export async function submitResult(payload: {
  question_id: string;
  code: string;
  is_correct: boolean;
  duration_seconds?: number;
}): Promise<void> {
  await req("/api/submissions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
