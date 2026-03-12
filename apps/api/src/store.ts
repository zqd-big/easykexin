import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Question, Submission, UserProgress } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../");
const dataDir = path.join(repoRoot, "data");

const questionsFile = path.join(dataDir, "questions.json");
const progressFile = path.join(dataDir, "user_progress.json");

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(stripBom(raw)) as T;
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function getQuestions(): Promise<Question[]> {
  return readJson<Question[]>(questionsFile);
}

export async function getProgress(): Promise<UserProgress> {
  try {
    return await readJson<UserProgress>(progressFile);
  } catch {
    return { submissions: [] };
  }
}

export async function appendSubmission(submission: Submission): Promise<void> {
  const progress = await getProgress();
  progress.submissions.push(submission);
  await writeJson(progressFile, progress);
}

export function filterQuestions(
  questions: Question[],
  params: {
    mode?: string;
    skill?: string;
    func?: string;
    difficulty?: number;
    source?: string;
  }
): Question[] {
  return questions.filter((q) => {
    if (params.mode) {
      if (params.mode === "quick") {
        if (!(q.mode === "micro" || q.mode === "template")) return false;
      } else if (q.mode !== params.mode) {
        return false;
      }
    }
    if (params.skill && !q.skill_tags.includes(params.skill)) return false;
    if (params.func && !q.related_functions.includes(params.func)) return false;
    if (params.difficulty && q.difficulty !== params.difficulty) return false;
    if (params.source && q.source_problem !== params.source) return false;
    return true;
  });
}
