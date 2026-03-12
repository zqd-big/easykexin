import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDecompose, fetchMeta } from "../api";
import type { Question } from "../types";

export default function DecomposePage() {
  const [sources, setSources] = useState<string[]>([]);
  const [source, setSource] = useState("vlan_cmd_transform");
  const [steps, setSteps] = useState<Question[]>([]);

  useEffect(() => {
    fetchMeta().then((meta) => {
      const opts = meta.sourceProblems.filter((s) => s !== "standalone");
      setSources(opts);
      if (opts.length > 0 && !opts.includes(source)) {
        setSource(opts[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!source) return;
    fetchDecompose(source).then(setSteps).catch(() => setSteps([]));
  }, [source]);

  return (
    <section>
      <h1>长题拆解模式</h1>
      <div className="panel">
        <label htmlFor="source-select">长题来源：</label>
        <select id="source-select" value={source} onChange={(e) => setSource(e.target.value)}>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="list-grid">
        {steps.map((step) => (
          <article className="card" key={step.id}>
            <h3>
              Step {step.step_order ?? "-"}: {step.title}
            </h3>
            <p>{step.brief}</p>
            <Link to={`/practice?qid=${step.id}`}>进入此步骤</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
