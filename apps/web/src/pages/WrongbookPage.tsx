import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWrongbook } from "../api";
import type { WrongbookResponse } from "../types";

export default function WrongbookPage() {
  const [data, setData] = useState<WrongbookResponse | null>(null);

  useEffect(() => {
    fetchWrongbook().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return <p>暂无错题数据，先去做几题再回来查看。</p>;
  }

  return (
    <section className="two-col">
      <div className="panel">
        <h2>错题本</h2>
        <p>当前错题数：{data.totalWrongQuestions}</p>
        <div className="list-grid">
          {data.wrongQuestions.map((q) => (
            <article key={q.id} className="card">
              <h3>{q.title}</h3>
              <p>{q.brief}</p>
              <Link to={`/practice?qid=${q.id}`}>重新练习</Link>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>薄弱技能统计</h2>
        <ul>
          {data.weakSkills.map((w) => (
            <li key={w.tag}>
              {w.tag}: {w.wrongCount}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
