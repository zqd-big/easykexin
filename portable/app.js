(function () {
  const QUESTIONS = Array.isArray(window.QUESTIONS) ? window.QUESTIONS : [];
  const STORE_KEY = "micro_drills_submissions_v1";

  const app = {
    route: "home",
    filters: {
      mode: "quick",
      skill: "",
      func: ""
    },
    practice: {
      list: [],
      index: 0,
      code: "",
      showAnswer: false,
      startAt: Date.now(),
      notice: ""
    },
    bank: {
      skill: "",
      func: "",
      difficulty: ""
    },
    decompose: {
      source: ""
    }
  };

  function esc(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadSubmissions() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveSubmissions(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  function postSubmission(questionId, code, isCorrect, durationSeconds) {
    const list = loadSubmissions();
    list.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      question_id: questionId,
      code,
      is_correct: isCorrect,
      duration_seconds: durationSeconds,
      submitted_at: new Date().toISOString()
    });
    saveSubmissions(list);
  }

  function unique(arr) {
    return [...new Set(arr)];
  }

  function meta() {
    return {
      tags: unique(QUESTIONS.flatMap((q) => q.skill_tags || [])).sort(),
      functions: unique(QUESTIONS.flatMap((q) => q.related_functions || [])).sort(),
      sourceProblems: unique(QUESTIONS.map((q) => q.source_problem)).filter((s) => s !== "standalone").sort(),
      totalQuestions: QUESTIONS.length
    };
  }

  function isModeMatch(q, mode) {
    if (!mode) return true;
    if (mode === "quick") return q.mode === "micro" || q.mode === "template";
    return q.mode === mode;
  }

  function filterQuestions(params) {
    return QUESTIONS.filter((q) => {
      if (!isModeMatch(q, params.mode)) return false;
      if (params.skill && !(q.skill_tags || []).includes(params.skill)) return false;
      if (params.func && !(q.related_functions || []).includes(params.func)) return false;
      if (params.difficulty && q.difficulty !== Number(params.difficulty)) return false;
      if (params.source && q.source_problem !== params.source) return false;
      return true;
    });
  }

  function getFunctionsBySkill(skill) {
    const all = meta().functions;
    if (skill === "VOS接口") return all.filter((f) => /^Vos/i.test(f));
    if (skill === "C接口") return all.filter((f) => !/^Vos/i.test(f));
    return [];
  }

  function buildPracticeList(filters) {
    const tries = [];
    const mode = filters.mode || "";
    const skill = filters.skill || "";
    const func = filters.func || "";

    if (mode || skill || func) tries.push({ mode, skill, func, notice: "" });
    if (mode && skill && func) tries.push({ skill, func, notice: "当前“模式+标签+接口”无题，已切换为“标签+接口”。" });
    if (func) tries.push({ func, notice: `当前筛选无题，已切换为“仅接口：${func}”。` });
    if (mode && skill) tries.push({ skill, notice: `当前“模式+技能”无题，已切换为“仅技能：${skill}”。` });
    if (mode) tries.push({ mode, notice: "当前筛选过窄，已切换为“仅模式”。" });
    tries.push({ notice: "当前筛选无题，已切换为“全部题库”。" });

    for (const t of tries) {
      const list = filterQuestions(t);
      if (list.length > 0) return { list, notice: t.notice || "" };
    }
    return { list: [], notice: "" };
  }

  function openPracticeByFilters() {
    const result = buildPracticeList(app.filters);
    app.practice.list = result.list;
    app.practice.notice = result.notice;
    app.practice.index = 0;
    app.practice.showAnswer = false;
    app.practice.startAt = Date.now();
    app.practice.code = result.list[0] ? result.list[0].starter_code : "";
    app.route = "practice";
    render();
  }

  function openPracticeById(qid) {
    const q = QUESTIONS.find((x) => x.id === qid);
    app.practice.list = q ? [q] : [];
    app.practice.notice = "";
    app.practice.index = 0;
    app.practice.showAnswer = false;
    app.practice.startAt = Date.now();
    app.practice.code = q ? q.starter_code : "";
    app.route = "practice";
    render();
  }

  function currentQuestion() {
    return app.practice.list[app.practice.index];
  }

  function renderTopbar() {
    return `
      <header class="topbar">
        <div class="brand">可信考试 Micro Drills（免Node便携版）</div>
        <nav>
          <button class="${app.route === "home" ? "active" : ""}" onclick="AppActions.goto('home')">首页</button>
          <button class="${app.route === "practice" ? "active" : ""}" onclick="AppActions.goto('practice')">练习</button>
          <button class="${app.route === "bank" ? "active" : ""}" onclick="AppActions.goto('bank')">题库</button>
          <button class="${app.route === "wrongbook" ? "active" : ""}" onclick="AppActions.goto('wrongbook')">错题</button>
          <button class="${app.route === "decompose" ? "active" : ""}" onclick="AppActions.goto('decompose')">拆解</button>
        </nav>
      </header>
    `;
  }

  function renderHome() {
    const m = meta();
    const isInterfaceSkill = app.filters.skill === "C接口" || app.filters.skill === "VOS接口";
    const funcs = getFunctionsBySkill(app.filters.skill);
    return `
      <section class="panel">
        <h2>碎片化刷题入口</h2>
        <p class="sub">题库总量 ${m.totalQuestions} 题。该版本可离线打开，无需 Node.js。</p>
      </section>

      <section class="panel">
        <h3>训练模式</h3>
        <div class="row">
          <button class="${app.filters.mode === "quick" ? "primary" : ""}" onclick="AppActions.setMode('quick')">快速练习（微题+模板）</button>
          <button class="${app.filters.mode === "micro" ? "primary" : ""}" onclick="AppActions.setMode('micro')">仅微题</button>
          <button class="${app.filters.mode === "template" ? "primary" : ""}" onclick="AppActions.setMode('template')">模板速练</button>
          <button class="${app.filters.mode === "decompose" ? "primary" : ""}" onclick="AppActions.setMode('decompose')">长题拆解</button>
        </div>
      </section>

      <section class="panel">
        <h3>标签筛选</h3>
        <div class="row">
          <select onchange="AppActions.setSkill(this.value)">
            <option value="">全部标签</option>
            ${m.tags
              .map((tag) => `<option value="${esc(tag)}" ${app.filters.skill === tag ? "selected" : ""}>${esc(tag)}</option>`)
              .join("")}
          </select>
          ${
            isInterfaceSkill
              ? `<select onchange="AppActions.setFunc(this.value)">
                  <option value="">全部接口</option>
                  ${funcs
                    .map((f) => `<option value="${esc(f)}" ${app.filters.func === f ? "selected" : ""}>${esc(f)}</option>`)
                    .join("")}
                </select>`
              : ""
          }
        </div>
        <div class="row">
          <button class="primary" onclick="AppActions.startPractice()">开始练习</button>
        </div>
      </section>
    `;
  }

  function renderPractice() {
    const q = currentQuestion();
    if (!q) {
      return `
        <section class="panel">
          <h2>练习</h2>
          <p>当前筛选条件下没有题目。</p>
        </section>
      `;
    }

    const notice = app.practice.notice ? `<p class="sub">${esc(app.practice.notice)}</p>` : "";
    const answer = app.practice.showAnswer
      ? `
        <div>
          <h3>参考答案</h3>
          <pre>${esc(q.answer_code || "")}</pre>
          <h3>讲解</h3>
          <p>${esc(q.explanation || "")}</p>
          <h3>常见错误</h3>
          <ul>
            ${(q.common_mistakes || []).map((x) => `<li>${esc(x)}</li>`).join("")}
          </ul>
          <div class="row">
            <button onclick="AppActions.submitPractice(true)">我答对了</button>
            <button onclick="AppActions.submitPractice(false)">我答错了</button>
          </div>
        </div>
      `
      : "";

    return `
      <section class="practice">
        <aside class="panel">
          ${notice}
          <h2>${esc(q.title)}</h2>
          <p>${esc(q.brief)}</p>
          <p><strong>模式：</strong>${esc(q.mode)}</p>
          <p><strong>难度：</strong>${esc(q.difficulty)}</p>
          <p><strong>预计耗时：</strong>${esc(q.expected_time_seconds)}s</p>
          <p><strong>输入示例：</strong>${esc(q.input_example)}</p>
          <p><strong>期望输出：</strong>${esc(q.expected_output)}</p>
          <p><strong>标签：</strong>${esc((q.skill_tags || []).join(" / "))}</p>
          <p><strong>进度：</strong>${app.practice.index + 1}/${app.practice.list.length}</p>
        </aside>
        <div class="panel">
          <textarea id="code-editor" class="editor" oninput="AppActions.updateCode(this.value)">${esc(app.practice.code)}</textarea>
          <div class="row">
            <button onclick="AppActions.showAnswer()">查看答案</button>
            <button onclick="AppActions.nextPractice()">下一题</button>
          </div>
          ${answer}
        </div>
      </section>
    `;
  }

  function renderBank() {
    const m = meta();
    const isInterfaceSkill = app.bank.skill === "C接口" || app.bank.skill === "VOS接口";
    const funcs = getFunctionsBySkill(app.bank.skill);
    const list = filterQuestions({
      skill: app.bank.skill || undefined,
      func: app.bank.func || undefined,
      difficulty: app.bank.difficulty || undefined
    });

    return `
      <section class="panel">
        <h2>题库管理</h2>
        <div class="row">
          <select onchange="AppActions.bankSetSkill(this.value)">
            <option value="">全部技能</option>
            ${m.tags.map((t) => `<option value="${esc(t)}" ${app.bank.skill === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
          </select>
          ${
            isInterfaceSkill
              ? `<select onchange="AppActions.bankSetFunc(this.value)">
                  <option value="">全部接口</option>
                  ${funcs.map((f) => `<option value="${esc(f)}" ${app.bank.func === f ? "selected" : ""}>${esc(f)}</option>`).join("")}
                </select>`
              : ""
          }
          <select onchange="AppActions.bankSetDifficulty(this.value)">
            <option value="">全部难度</option>
            ${[1, 2, 3, 4, 5].map((d) => `<option value="${d}" ${String(app.bank.difficulty) === String(d) ? "selected" : ""}>难度 ${d}</option>`).join("")}
          </select>
        </div>
      </section>
      <section class="cards">
        ${list
          .map(
            (q) => `
          <article class="card">
            <h3>${esc(q.title)}</h3>
            <p>${esc(q.brief)}</p>
            <p>难度 ${esc(q.difficulty)} | ${esc(q.mode)}</p>
            <p>${esc((q.skill_tags || []).join(" / "))}</p>
            <button onclick="AppActions.openQ('${esc(q.id)}')">去练习</button>
          </article>
        `
          )
          .join("")}
      </section>
    `;
  }

  function renderWrongbook() {
    const subs = loadSubmissions();
    const qMap = new Map(QUESTIONS.map((q) => [q.id, q]));
    const latest = new Map();
    for (const s of subs) {
      const old = latest.get(s.question_id);
      if (!old || s.submitted_at > old.submitted_at) latest.set(s.question_id, s);
    }

    const wrongIds = [...latest.values()]
      .filter((s) => !s.is_correct)
      .map((s) => s.question_id);
    const wrongQs = wrongIds.map((id) => qMap.get(id)).filter(Boolean);

    const weakStats = {};
    for (const s of subs) {
      if (s.is_correct) continue;
      const q = qMap.get(s.question_id);
      if (!q) continue;
      for (const tag of q.skill_tags || []) {
        weakStats[tag] = (weakStats[tag] || 0) + 1;
      }
    }
    const weakList = Object.entries(weakStats).sort((a, b) => b[1] - a[1]);

    return `
      <section class="grid two">
        <div class="panel">
          <h2>错题本</h2>
          <p>当前错题数：${wrongQs.length}</p>
          <div class="cards">
            ${wrongQs
              .map(
                (q) => `
              <article class="card">
                <h3>${esc(q.title)}</h3>
                <p>${esc(q.brief)}</p>
                <button onclick="AppActions.openQ('${esc(q.id)}')">重新练习</button>
              </article>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="panel">
          <h2>薄弱技能统计</h2>
          <ul>
            ${weakList.map(([tag, cnt]) => `<li>${esc(tag)}: ${cnt}</li>`).join("")}
          </ul>
        </div>
      </section>
    `;
  }

  function renderDecompose() {
    const m = meta();
    if (!app.decompose.source && m.sourceProblems.length > 0) app.decompose.source = m.sourceProblems[0];
    const list = filterQuestions({ source: app.decompose.source, mode: "decompose" }).sort(
      (a, b) => (a.step_order || 999) - (b.step_order || 999)
    );

    return `
      <section class="panel">
        <h2>长题拆解</h2>
        <div class="row">
          <select onchange="AppActions.setSource(this.value)">
            ${m.sourceProblems
              .map((s) => `<option value="${esc(s)}" ${app.decompose.source === s ? "selected" : ""}>${esc(s)}</option>`)
              .join("")}
          </select>
        </div>
      </section>
      <section class="cards">
        ${list
          .map(
            (q) => `
          <article class="card">
            <h3>Step ${esc(q.step_order || "-")}：${esc(q.title)}</h3>
            <p>${esc(q.brief)}</p>
            <button onclick="AppActions.openQ('${esc(q.id)}')">进入此步骤</button>
          </article>
        `
          )
          .join("")}
      </section>
    `;
  }

  function renderView() {
    if (app.route === "home") return renderHome();
    if (app.route === "practice") return renderPractice();
    if (app.route === "bank") return renderBank();
    if (app.route === "wrongbook") return renderWrongbook();
    if (app.route === "decompose") return renderDecompose();
    return "";
  }

  function render() {
    const root = document.getElementById("app");
    root.innerHTML = `
      <div class="app-shell">
        ${renderTopbar()}
        ${renderView()}
      </div>
    `;
  }

  window.AppActions = {
    goto(route) {
      app.route = route;
      render();
    },
    setMode(mode) {
      app.filters.mode = mode;
      render();
    },
    setSkill(skill) {
      app.filters.skill = skill;
      app.filters.func = "";
      render();
    },
    setFunc(func) {
      app.filters.func = func;
      render();
    },
    startPractice() {
      openPracticeByFilters();
    },
    openQ(qid) {
      openPracticeById(qid);
    },
    updateCode(code) {
      app.practice.code = code;
    },
    showAnswer() {
      app.practice.showAnswer = true;
      render();
    },
    nextPractice() {
      if (app.practice.index + 1 < app.practice.list.length) {
        app.practice.index += 1;
        app.practice.showAnswer = false;
        app.practice.startAt = Date.now();
        app.practice.code = currentQuestion().starter_code || "";
        render();
      } else {
        alert("已经是最后一题。");
      }
    },
    submitPractice(isCorrect) {
      const q = currentQuestion();
      if (!q) return;
      const duration = Math.max(1, Math.round((Date.now() - app.practice.startAt) / 1000));
      postSubmission(q.id, app.practice.code, isCorrect, duration);
      this.nextPractice();
    },
    bankSetSkill(skill) {
      app.bank.skill = skill;
      app.bank.func = "";
      render();
    },
    bankSetFunc(func) {
      app.bank.func = func;
      render();
    },
    bankSetDifficulty(d) {
      app.bank.difficulty = d;
      render();
    },
    setSource(source) {
      app.decompose.source = source;
      render();
    }
  };

  render();
})();
