import type { Question } from "./types";

const DEBUG_NOTE_PREFIX = "micro-drills-debug-note:";

function hasTag(question: Question, tag: string): boolean {
  return question.skill_tags.includes(tag);
}

function hasFunction(question: Question, name: string): boolean {
  return question.related_functions.includes(name);
}

export function getAnswerQuality(question: Question): "完整代码" | "解法骨架" {
  const answer = (question.answer_code ?? "").trim();
  if (answer.includes("{") || answer.includes(";") || answer.includes("for (") || answer.includes("while (")) {
    return "完整代码";
  }
  return "解法骨架";
}

export function buildDebugChecklist(question: Question): string[] {
  const checklist = [
    "先用输入示例手推一遍，确认你理解的输入格式和输出格式一致。",
    "先检查边界：空输入、单元素、重复值、越界下标。"
  ];

  if (hasTag(question, "DFS")) {
    checklist.push("确认递归终止条件是否先于递归调用执行。");
    checklist.push("确认每次递归前后的状态是否需要恢复。");
  }

  if (hasTag(question, "二分")) {
    checklist.push("先写清区间不变量，再检查 while 条件与 mid 更新是否匹配。");
    checklist.push("重点看答案落点：返回 l、r、ans 还是 -1/n。");
  }

  if (hasTag(question, "回溯")) {
    checklist.push("区分不可复选(i+1)还是可复选(i)。");
    checklist.push("如果题目有重复元素，先排序，再确认去重条件是否是同层去重。");
  }

  if (hasTag(question, "滑窗")) {
    checklist.push("观察窗口何时扩张、何时收缩，确认 sum/计数变量是否同步更新。");
  }

  if (hasTag(question, "双指针")) {
    checklist.push("分别写出左右指针移动条件，避免一个指针漏动导致死循环。");
  }

  if (hasFunction(question, "strtok_s")) {
    checklist.push("确认首次调用传原串，后续调用传 NULL，并且上下文指针独立。");
  }

  if (hasFunction(question, "strtol") || hasFunction(question, "strtoll")) {
    checklist.push("确认 end 指针校验通过，而不是只看转换结果。");
  }

  if (hasFunction(question, "qsort") || hasFunction(question, "bsearch")) {
    checklist.push("确认比较函数的参数类型和返回值方向正确。");
  }

  if (question.related_functions.some((name) => /^Vos/i.test(name))) {
    checklist.push("确认容器里存的是值还是指针，注意对象生命周期和 destroy/free。");
  }

  return checklist;
}

export function buildDebugTemplate(question: Question): string {
  const lines = [
    `样例输入: ${question.input_example}`,
    `期望输出: ${question.expected_output}`,
    "",
    "step | 当前动作 | 关键变量 | 当前输出",
    "1    |         |         |",
    "2    |         |         |",
    "3    |         |         |",
    "",
    "边界检查:",
    "- 空输入:",
    "- 最小规模:",
    "- 重复值/越界:",
    "",
    "最终定位:"
  ];
  return lines.join("\n");
}

export function loadDebugNote(questionId: string): string {
  try {
    return localStorage.getItem(`${DEBUG_NOTE_PREFIX}${questionId}`) ?? "";
  } catch {
    return "";
  }
}

export function saveDebugNote(questionId: string, value: string): void {
  try {
    localStorage.setItem(`${DEBUG_NOTE_PREFIX}${questionId}`, value);
  } catch {
    // Ignore storage failures.
  }
}
