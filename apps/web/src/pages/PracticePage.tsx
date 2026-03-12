import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchQuestionById, fetchQuestions, submitResult } from "../api";
import type { Question } from "../types";

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
        <textarea value={code} onChange={(e) => setCode(e.target.value)} className="editor" spellCheck={false} />
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
