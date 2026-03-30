import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchQuestionById, fetchQuestions, submitResult } from "../api";
import type { Question } from "../types";

const INDENT = "    ";

function lineStartAt(text: string, index: number): number {
  return Math.max(0, text.lastIndexOf("\n", Math.max(0, index) - 1) + 1);
}

function lineEndAt(text: string, index: number): number {
  const pos = text.indexOf("\n", index);
  return pos === -1 ? text.length : pos;
}

function applyEditorValue(
  textarea: HTMLTextAreaElement,
  nextValue: string,
  start: number,
  end: number | null,
  setCode: (value: string) => void
): void {
  textarea.value = nextValue;
  textarea.selectionStart = start;
  textarea.selectionEnd = end == null ? start : end;
  setCode(nextValue);
}

function handleEditorKeyDown(
  event: KeyboardEvent<HTMLTextAreaElement>,
  setCode: (value: string) => void
): void {
  const textarea = event.currentTarget;
  const value = textarea.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (event.key === "Tab") {
    event.preventDefault();

    if (start === end) {
      if (event.shiftKey) {
        const lineStart = lineStartAt(value, start);
        if (value.slice(lineStart, lineStart + INDENT.length) === INDENT) {
          const nextValue = value.slice(0, lineStart) + value.slice(lineStart + INDENT.length);
          const nextPos = Math.max(lineStart, start - INDENT.length);
          applyEditorValue(textarea, nextValue, nextPos, null, setCode);
        }
        return;
      }

      const nextValue = value.slice(0, start) + INDENT + value.slice(end);
      applyEditorValue(textarea, nextValue, start + INDENT.length, null, setCode);
      return;
    }

    const blockStart = lineStartAt(value, start);
    const blockEnd = lineEndAt(value, end);
    const selected = value.slice(blockStart, blockEnd);
    const lines = selected.split("\n");

    if (event.shiftKey) {
      const updated = lines.map((line) => {
        if (line.startsWith(INDENT)) return line.slice(INDENT.length);
        if (line.startsWith("\t")) return line.slice(1);
        return line;
      });
      const removedFromFirst = lines[0].startsWith(INDENT) ? INDENT.length : lines[0].startsWith("\t") ? 1 : 0;
      const nextBlock = updated.join("\n");
      const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
      const removedTotal = selected.length - nextBlock.length;
      const nextStart = Math.max(blockStart, start - removedFromFirst);
      const nextEnd = Math.max(nextStart, end - removedTotal);
      applyEditorValue(textarea, nextValue, nextStart, nextEnd, setCode);
      return;
    }

    const nextBlock = lines.map((line) => INDENT + line).join("\n");
    const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
    const nextStart = start + INDENT.length;
    const nextEnd = end + INDENT.length * lines.length;
    applyEditorValue(textarea, nextValue, nextStart, nextEnd, setCode);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const before = value.slice(0, start);
    const after = value.slice(end);
    const currentLine = before.slice(lineStartAt(value, start));
    const indent = (currentLine.match(/^[ \t]*/) ?? [""])[0];
    const trimmed = currentLine.trimEnd();
    const nextChar = after[0] ?? "";
    const extraIndent = /[\{\[\(]$/.test(trimmed) ? INDENT : "";
    const closeAhead = /^[\}\]\)]/.test(after);

    if (closeAhead && extraIndent) {
      const insert = "\n" + indent + extraIndent + "\n" + indent;
      const cursor = start + 1 + indent.length + extraIndent.length;
      const nextValue = before + insert + after;
      applyEditorValue(textarea, nextValue, cursor, null, setCode);
      return;
    }

    if (nextChar && /^[\}\]\)]$/.test(nextChar) && indent.endsWith(INDENT)) {
      const insert = "\n" + indent.slice(0, -INDENT.length);
      const nextValue = before + insert + after;
      applyEditorValue(textarea, nextValue, start + insert.length, null, setCode);
      return;
    }

    const insert = "\n" + indent + extraIndent;
    const nextValue = before + insert + after;
    applyEditorValue(textarea, nextValue, start + insert.length, null, setCode);
  }
}

export default function PracticePage() {
  const [sp] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [code, setCode] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startAt, setStartAt] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");

  const mode = sp.get("mode") ?? undefined;
  const skill = sp.get("skill") ?? undefined;
  const func = sp.get("func") ?? undefined;
  const qid = sp.get("qid") ?? undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotice("");

    const load = async () => {
      try {
        let list: Question[] = [];
        let fallbackNotice = "";
        if (qid) {
          const q = await fetchQuestionById(qid, true);
          list = [q];
        } else {
          list = await fetchQuestions({ mode, skill, func, includeAnswer: true });

          if (list.length === 0 && mode && skill && func) {
            list = await fetchQuestions({ skill, func, includeAnswer: true });
            if (list.length > 0) {
              fallbackNotice = `当前“模式+标签+接口”无题，已自动切换为“标签+接口”。`;
            }
          }

          if (list.length === 0 && func) {
            list = await fetchQuestions({ func, includeAnswer: true });
            if (list.length > 0) {
              fallbackNotice = `当前筛选无题，已自动切换为“仅接口：${func}”。`;
            }
          }

          if (list.length === 0 && mode && skill) {
            list = await fetchQuestions({ skill, includeAnswer: true });
            if (list.length > 0) {
              fallbackNotice = `当前“模式+技能”无题，已自动切换为“仅技能：${skill}”。`;
            }
          }

          if (list.length === 0 && mode) {
            list = await fetchQuestions({ mode, includeAnswer: true });
            if (list.length > 0) {
              fallbackNotice = "当前筛选过窄，已自动切换为“仅模式”。";
            }
          }

          if (list.length === 0) {
            list = await fetchQuestions({ includeAnswer: true });
            if (list.length > 0) {
              fallbackNotice = "当前筛选无题，已自动切换为“全部题库”。";
            }
          }
        }
        if (cancelled) return;
        setQuestions(list);
        setIdx(0);
        setCode(list[0]?.starter_code ?? "");
        setShowAnswer(false);
        setStartAt(Date.now());
        setNotice(fallbackNotice);
      } catch {
        if (cancelled) return;
        setError("题目加载失败，请确认后端服务已启动。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [mode, skill, func, qid]);

  const current = useMemo(() => questions[idx], [questions, idx]);

  useEffect(() => {
    if (!current) return;
    setCode(current.starter_code);
    setShowAnswer(false);
    setStartAt(Date.now());
  }, [current?.id]);

  async function markResult(isCorrect: boolean) {
    if (!current) return;
    const duration = Math.max(1, Math.round((Date.now() - startAt) / 1000));
    await submitResult({
      question_id: current.id,
      code,
      is_correct: isCorrect,
      duration_seconds: duration
    });
    nextQuestion();
  }

  function nextQuestion() {
    if (idx + 1 < questions.length) {
      setIdx((v) => v + 1);
    }
  }

  if (loading) return <p>加载中...</p>;
  if (error) return <p>{error}</p>;
  if (!current) return <p>当前筛选条件下没有题目。</p>;

  return (
    <section className="practice-layout">
      <aside className="panel">
        {notice ? <p className="sub">{notice}</p> : null}
        <h2>{current.title}</h2>
        <p>{current.brief}</p>
        <p>
          <strong>模式：</strong>
          {current.mode}
        </p>
        <p>
          <strong>难度：</strong>
          {current.difficulty}
        </p>
        <p>
          <strong>预计耗时：</strong>
          {current.expected_time_seconds}s
        </p>
        <p>
          <strong>输入示例：</strong>
          {current.input_example}
        </p>
        <p>
          <strong>期望输出：</strong>
          {current.expected_output}
        </p>
        <p>
          <strong>标签：</strong>
          {current.skill_tags.join(" / ")}
        </p>
        <p>
          <strong>进度：</strong>
          {idx + 1}/{questions.length}
        </p>
      </aside>

      <div className="panel">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => handleEditorKeyDown(e, setCode)}
          className="editor"
          spellCheck={false}
        />
        <div className="row">
          <button onClick={() => setShowAnswer(true)}>查看答案</button>
          <button onClick={nextQuestion} disabled={idx + 1 >= questions.length}>
            下一题
          </button>
        </div>

        {showAnswer ? (
          <div className="answer-block">
            <h3>参考答案</h3>
            <pre>{current.answer_code}</pre>
            <h3>讲解</h3>
            <p>{current.explanation}</p>
            <h3>常见错误</h3>
            <ul>
              {(current.common_mistakes ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="row">
              <button onClick={() => void markResult(true)}>我答对了</button>
              <button onClick={() => void markResult(false)}>我答错了</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
