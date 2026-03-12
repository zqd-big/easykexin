import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMeta, fetchQuestions } from "../api";
import type { Question } from "../types";

export default function BankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [skill, setSkill] = useState("");
  const [func, setFunc] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    fetchMeta().then((meta) => {
      setTags(meta.tags);
      setFunctions(meta.functions);
    });
  }, []);

  useEffect(() => {
    const d = difficulty ? Number(difficulty) : undefined;
    fetchQuestions({ skill: skill || undefined, func: func || undefined, difficulty: d }).then(setQuestions);
  }, [skill, func, difficulty]);

  return (
    <section>
      <h1>题库管理</h1>
      <div className="filters">
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">全部技能</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select value={func} onChange={(e) => setFunc(e.target.value)}>
          <option value="">全部函数</option>
          {functions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">全部难度</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              难度 {d}
            </option>
          ))}
        </select>
      </div>

      <div className="list-grid">
        {questions.map((q) => (
          <article key={q.id} className="card">
            <h3>{q.title}</h3>
            <p>{q.brief}</p>
            <p>难度 {q.difficulty} | {q.mode}</p>
            <p>{q.skill_tags.join(" / ")}</p>
            <Link to={`/practice?qid=${q.id}`}>去练习</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
