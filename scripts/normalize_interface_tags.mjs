import fs from "node:fs";

const file = "data/questions.json";
const questions = JSON.parse(fs.readFileSync(file, "utf8"));

const cFunctions = new Set([
  "qsort",
  "bsearch",
  "strcmp",
  "strcpy_s",
  "strncpy_s",
  "strstr",
  "strchr",
  "strrchr",
  "strtok_s",
  "strcat_s",
  "sscanf_s",
  "sprintf_s",
  "strtol",
  "strtoll"
]);

function isCInterfaceFn(fn) {
  const lower = fn.toLowerCase();
  return cFunctions.has(lower) || lower.startsWith("str");
}

function isVOSFn(fn) {
  return /^vos/i.test(fn);
}

function normalizeTags(tags, hasC, hasVOS) {
  let out = [...tags];

  if (hasC) {
    out = out.filter((t) => {
      const lower = String(t).toLowerCase();
      if (isCInterfaceFn(lower)) return false;
      return true;
    });
    if (!out.includes("C接口")) out.unshift("C接口");
  }

  if (hasVOS) {
    out = out.filter((t) => {
      const lower = String(t).toLowerCase();
      if (isVOSFn(lower)) return false;
      if (t === "容器") return false;
      return true;
    });
    if (!out.includes("VOS接口")) out.unshift("VOS接口");
  }

  return [...new Set(out)];
}

for (const q of questions) {
  const funcs = (q.related_functions ?? []).map((f) => String(f));
  const hasC = funcs.some(isCInterfaceFn);
  const hasVOS = funcs.some(isVOSFn);
  q.skill_tags = normalizeTags(q.skill_tags ?? [], hasC, hasVOS);
}

fs.writeFileSync(file, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
console.log("normalized interface tags");
