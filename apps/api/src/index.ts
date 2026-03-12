import cors from "cors";
import express from "express";
import { appendSubmission, filterQuestions, getProgress, getQuestions } from "./store.js";
import type { Question, Submission } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function hideAnswerFields(question: Question): Omit<Question, "answer_code" | "explanation" | "common_mistakes"> {
  const { answer_code, explanation, common_mistakes, ...rest } = question;
  void answer_code;
  void explanation;
  void common_mistakes;
  return rest;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "micro-drills-api" });
});

app.get("/api/meta", async (_req, res) => {
  const questions = await getQuestions();
  const tags = [...new Set(questions.flatMap((q) => q.skill_tags))].sort();
  const functions = [...new Set(questions.flatMap((q) => q.related_functions))].sort();
  const sourceProblems = [...new Set(questions.map((q) => q.source_problem))].sort();
  const modes = [...new Set(questions.map((q) => q.mode))].sort();
  res.json({ tags, functions, sourceProblems, modes, totalQuestions: questions.length });
});

app.get("/api/questions", async (req, res) => {
  const includeAnswer = req.query.include_answer === "1";
  const questions = await getQuestions();
  const filtered = filterQuestions(questions, {
    mode: req.query.mode?.toString(),
    skill: req.query.skill?.toString(),
    func: req.query.function?.toString(),
    difficulty: req.query.difficulty ? Number(req.query.difficulty) : undefined,
    source: req.query.source?.toString()
  });

  if (includeAnswer) {
    res.json(filtered);
    return;
  }

  res.json(filtered.map(hideAnswerFields));
});

app.get("/api/questions/:id", async (req, res) => {
  const includeAnswer = req.query.include_answer === "1";
  const questions = await getQuestions();
  const question = questions.find((q) => q.id === req.params.id);

  if (!question) {
    res.status(404).json({ message: "Question not found" });
    return;
  }

  res.json(includeAnswer ? question : hideAnswerFields(question));
});

app.get("/api/decompose/:source", async (req, res) => {
  const questions = await getQuestions();
  const items = questions
    .filter((q) => q.mode === "decompose" && q.source_problem === req.params.source)
    .sort((a, b) => (a.step_order ?? 999) - (b.step_order ?? 999));
  res.json(items);
});

app.post("/api/submissions", async (req, res) => {
  const body = req.body as Partial<Submission>;
  if (!body.question_id || typeof body.code !== "string" || typeof body.is_correct !== "boolean") {
    res.status(400).json({ message: "Invalid payload" });
    return;
  }

  const questions = await getQuestions();
  const questionExists = questions.some((q) => q.id === body.question_id);
  if (!questionExists) {
    res.status(400).json({ message: "question_id does not exist" });
    return;
  }

  const submission: Submission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    question_id: body.question_id,
    code: body.code,
    is_correct: body.is_correct,
    duration_seconds: body.duration_seconds,
    submitted_at: new Date().toISOString()
  };

  await appendSubmission(submission);
  res.status(201).json(submission);
});

app.get("/api/wrongbook", async (_req, res) => {
  const [progress, questions] = await Promise.all([getProgress(), getQuestions()]);
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const latestByQuestion = new Map<string, Submission>();
  for (const submission of progress.submissions) {
    const prev = latestByQuestion.get(submission.question_id);
    if (!prev || submission.submitted_at > prev.submitted_at) {
      latestByQuestion.set(submission.question_id, submission);
    }
  }

  const wrongQuestionIds = [...latestByQuestion.values()]
    .filter((s) => !s.is_correct)
    .map((s) => s.question_id);

  const wrongQuestions = wrongQuestionIds
    .map((id) => qMap.get(id))
    .filter((q): q is Question => Boolean(q))
    .map(hideAnswerFields);

  const weakSkillStats: Record<string, number> = {};
  for (const submission of progress.submissions) {
    if (submission.is_correct) continue;
    const question = qMap.get(submission.question_id);
    if (!question) continue;
    for (const tag of question.skill_tags) {
      weakSkillStats[tag] = (weakSkillStats[tag] ?? 0) + 1;
    }
  }

  const weakSkills = Object.entries(weakSkillStats)
    .map(([tag, wrongCount]) => ({ tag, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount);

  res.json({
    wrongQuestions,
    weakSkills,
    totalWrongQuestions: wrongQuestions.length,
    totalSubmissions: progress.submissions.length
  });
});

app.listen(port, () => {
  console.log(`micro-drills api running on http://localhost:${port}`);
});
