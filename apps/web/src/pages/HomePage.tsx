import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMeta } from "../api";

const modeOptions = [
  { value: "quick", label: "快速练习（微题+模板）" },
  { value: "micro", label: "仅微题" },
  { value: "template", label: "模板速练" },
  { value: "decompose", label: "长题拆解" }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("quick");
  const [skills, setSkills] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedFunc, setSelectedFunc] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMeta()
      .then((meta) => {
        setSkills(meta.tags);
        setFunctions(meta.functions);
        setTotal(meta.totalQuestions);
      })
      .catch(() => {
        setSkills([]);
        setFunctions([]);
      });
  }, []);

  useEffect(() => {
    setSelectedFunc("");
  }, [selectedSkill]);

  function startPractice() {
    const sp = new URLSearchParams();
    sp.set("mode", mode);
    if (selectedSkill) sp.set("skill", selectedSkill);
    if (selectedFunc) sp.set("func", selectedFunc);
    navigate(`/practice?${sp.toString()}`);
  }

  const isInterfaceSkill = selectedSkill === "C接口" || selectedSkill === "VOS接口";
  const functionOptions =
    selectedSkill === "VOS接口"
      ? functions.filter((f) => /^Vos/i.test(f))
      : functions.filter((f) => !/^Vos/i.test(f));

  return (
    <section>
      <h1>碎片化刷题入口</h1>
      <p className="sub">题库总量 {total} 题，单题目标 30 秒到 3 分钟。</p>

      <div className="panel">
        <h3>训练模式</h3>
        <div className="chips">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              className={mode === option.value ? "chip active" : "chip"}
              onClick={() => setMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>技能标签</h3>
        <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
          <option value="">全部标签</option>
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
        {isInterfaceSkill ? (
          <div style={{ marginTop: 10 }}>
            <select value={selectedFunc} onChange={(e) => setSelectedFunc(e.target.value)}>
              <option value="">全部接口</option>
              {functionOptions.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <button className="cta" onClick={startPractice}>
        开始练习
      </button>
    </section>
  );
}
