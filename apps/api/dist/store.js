import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../");
const dataDir = path.join(repoRoot, "data");
const questionsFile = path.join(dataDir, "questions.json");
const progressFile = path.join(dataDir, "user_progress.json");
function stripBom(text) {
    return text.replace(/^\uFEFF/, "");
}
async function readJson(filePath) {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(stripBom(raw));
}
async function writeJson(filePath, data) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
export async function getQuestions() {
    return readJson(questionsFile);
}
export async function getProgress() {
    try {
        return await readJson(progressFile);
    }
    catch {
        return { submissions: [] };
    }
}
export async function appendSubmission(submission) {
    const progress = await getProgress();
    progress.submissions.push(submission);
    await writeJson(progressFile, progress);
}
export function filterQuestions(questions, params) {
    return questions.filter((q) => {
        if (params.mode) {
            if (params.mode === "quick") {
                if (!(q.mode === "micro" || q.mode === "template"))
                    return false;
            }
            else if (q.mode !== params.mode) {
                return false;
            }
        }
        if (params.skill && !q.skill_tags.includes(params.skill))
            return false;
        if (params.func && !q.related_functions.includes(params.func))
            return false;
        if (params.difficulty && q.difficulty !== params.difficulty)
            return false;
        if (params.source && q.source_problem !== params.source)
            return false;
        return true;
    });
}
