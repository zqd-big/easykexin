(function () {
  const QUESTIONS = Array.isArray(window.QUESTIONS) ? window.QUESTIONS : [];
  const INTERFACE_HINTS = window.INTERFACE_HINTS && typeof window.INTERFACE_HINTS === "object" ? window.INTERFACE_HINTS : {};
  const STORE_KEY = "micro_drills_submissions_v1";
  const DEBUG_DRIVER_PREFIX = "micro_drills_debug_driver_v2_";
  const INDENT = "    ";

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
      driverCode: "",
      showAnswer: false,
      startAt: Date.now(),
      notice: "",
      debugSessionId: "",
      debugSnapshot: null,
      debugBusy: false,
      debugError: "",
      showDriverEditor: false,
      showHintPanel: false,
      judgeBusy: false,
      judgeError: "",
      judgeResult: null
    },
    bank: {
      skill: "",
      func: "",
      difficulty: ""
    },
    decompose: {
      source: ""
    },
    debugService: {
      checked: false,
      available: false,
      gcc: "",
      gdb: "",
      mode: "",
      message: ""
    }
  };

  function esc(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function unique(arr) {
    return [...new Set(arr)];
  }

  function disabledAttr(flag) {
    return flag ? "disabled" : "";
  }

  function loadSubmissions() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveSubmissions(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  function postSubmission(questionId, code, isCorrect, durationSeconds, extra) {
    const list = loadSubmissions();
    list.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      question_id: questionId,
      code,
      is_correct: isCorrect,
      duration_seconds: durationSeconds,
      submitted_at: new Date().toISOString(),
      source_type: extra && extra.source_type ? extra.source_type : "manual",
      compile_error: Boolean(extra && extra.compile_error),
      actual_output: String((extra && extra.actual_output) || "").slice(0, 2000),
      expected_output: String((extra && extra.expected_output) || "").slice(0, 2000),
      stderr: String((extra && extra.stderr) || "").slice(0, 2000)
    });
    if (list.length > 500) list.splice(0, list.length - 500);
    saveSubmissions(list);
  }

  function getQuestionSubmissions(questionId) {
    return loadSubmissions()
      .filter((item) => item.question_id === questionId)
      .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)));
  }

  function formatSubmissionTime(text) {
    try {
      return new Date(text).toLocaleString("zh-CN", {
        hour12: false,
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(text || "");
    }
  }

  function submissionStatusText(item) {
    const sourceType = item && item.source_type ? item.source_type : "manual";
    if (!item) return "未知";
    if (sourceType === "manual") return item.is_correct ? "手动答对" : "手动答错";
    if (item.compile_error) return "编译错误";
    return item.is_correct ? "判题通过" : "判题未通过";
  }

  function submissionStatusClass(item) {
    const sourceType = item && item.source_type ? item.source_type : "manual";
    if (!item) return "status-neutral";
    if (sourceType === "manual") return item.is_correct ? "status-pass" : "status-manual";
    if (item.compile_error) return "status-compile";
    return item.is_correct ? "status-pass" : "status-fail";
  }

  function meta() {
    return {
      tags: unique(QUESTIONS.flatMap((q) => q.skill_tags || [])).sort(),
      functions: unique(QUESTIONS.flatMap((q) => q.related_functions || [])).sort(),
      sourceProblems: unique(QUESTIONS.map((q) => q.source_problem)).filter((item) => item && item !== "standalone").sort(),
      totalQuestions: QUESTIONS.length
    };
  }

  function isModeMatch(question, mode) {
    if (!mode) return true;
    if (mode === "quick") return question.mode === "micro" || question.mode === "template";
    return question.mode === mode;
  }

  function filterQuestions(params) {
    return QUESTIONS.filter((question) => {
      if (!isModeMatch(question, params.mode)) return false;
      if (params.skill && !(question.skill_tags || []).includes(params.skill)) return false;
      if (params.func && !(question.related_functions || []).includes(params.func)) return false;
      if (params.difficulty && question.difficulty !== Number(params.difficulty)) return false;
      if (params.source && question.source_problem !== params.source) return false;
      return true;
    });
  }

  function getFunctionsBySkill(skill) {
    const all = meta().functions;
    if (skill === "VOS接口") return all.filter((name) => /^Vos/i.test(name));
    if (skill === "C接口") return all.filter((name) => !/^Vos/i.test(name));
    return [];
  }

  function quoteCString(text) {
    return JSON.stringify(String(text || '').replace(/\r?\n/g, ' ').trim());
  }

  function normalizeSampleText(text) {
    const raw = String(text || '').trim();
    if (!raw || raw === '???' || raw === '见题干') return '';
    return raw.replace(/^["']|["']$/g, '');
  }

  function splitTopLevel(text, sep) {
    const parts = [];
    let depthParen = 0;
    let depthBracket = 0;
    let depthBrace = 0;
    let current = '';
    for (const ch of String(text || '')) {
      if (ch === '(') depthParen += 1;
      else if (ch === ')' && depthParen > 0) depthParen -= 1;
      else if (ch === '[') depthBracket += 1;
      else if (ch === ']' && depthBracket > 0) depthBracket -= 1;
      else if (ch === '{') depthBrace += 1;
      else if (ch === '}' && depthBrace > 0) depthBrace -= 1;

      if (ch === sep && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    if (current) parts.push(current);
    return parts;
  }

  function hasNamedDeclaration(source, name) {
    const target = String(name || '').trim();
    const cleaned = String(source || '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/.*$/gm, ' ');
    const statements = cleaned.split(';');

    for (const rawStmt of statements) {
      const stmt = rawStmt.trim();
      if (!stmt) continue;
      const match = stmt.match(
        /^(?:const\s+|unsigned\s+|signed\s+|static\s+|volatile\s+|register\s+|short\s+|long\s+)*(?:struct\s+[A-Za-z_][A-Za-z0-9_]*\s+|[A-Za-z_][A-Za-z0-9_]*\s+)(.+)$/
      );
      if (!match) continue;

      const declarators = splitTopLevel(match[1], ',');
      for (const declarator of declarators) {
        const lhs = String(declarator).split('=')[0].trim();
        const nameMatch = lhs.match(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\])?\s*$/);
        if (nameMatch && nameMatch[1] === target) return true;
      }
    }

    return false;
  }

  function maybeDeclare(source, name, line) {
    return hasNamedDeclaration(source, name) ? null : line;
  }

  function joinCodeLines(lines) {
    return lines.filter((line) => line != null && line !== '').join('\n');
  }

  function extractIntArray(text) {
    const match = String(text || '').match(/\[([^\]]+)\]/);
    if (!match) return [];
    return match[1]
      .split(/[,\s]+/)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  function buildIntArrayLiteral(values, fallback) {
    const list = values.length ? values : fallback;
    return '{ ' + list.join(', ') + ' }';
  }

  function lineStartAt(text, index) {
    return Math.max(0, String(text || '').lastIndexOf('\n', Math.max(0, index) - 1) + 1);
  }

  function lineEndAt(text, index) {
    const pos = String(text || '').indexOf('\n', index);
    return pos === -1 ? String(text || '').length : pos;
  }

  function applyEditorValue(kind, textarea, nextValue, start, end) {
    if (kind === 'driver') {
      app.practice.driverCode = nextValue;
      const question = currentQuestion();
      if (question) saveDriverCode(question.id, nextValue);
    } else {
      app.practice.code = nextValue;
      app.practice.judgeError = "";
      app.practice.judgeResult = null;
    }
    textarea.value = nextValue;
    textarea.focus();
    textarea.setSelectionRange(start, end == null ? start : end);
  }

  function getEditorElement(kind) {
    const id = kind === 'driver' ? 'driver-editor' : 'code-editor';
    return document.getElementById(id);
  }

  function applyIndentToTextarea(kind, textarea, shiftKey) {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      if (shiftKey) {
        const lineStart = lineStartAt(value, start);
        if (value.slice(lineStart, lineStart + INDENT.length) === INDENT) {
          const nextValue = value.slice(0, lineStart) + value.slice(lineStart + INDENT.length);
          const nextPos = Math.max(lineStart, start - INDENT.length);
          applyEditorValue(kind, textarea, nextValue, nextPos);
        }
        return;
      }

      const nextValue = value.slice(0, start) + INDENT + value.slice(end);
      applyEditorValue(kind, textarea, nextValue, start + INDENT.length);
      return;
    }

    const blockStart = lineStartAt(value, start);
    const blockEnd = lineEndAt(value, end);
    const selected = value.slice(blockStart, blockEnd);
    const lines = selected.split('\n');

    if (shiftKey) {
      const updated = lines.map((line) => {
        if (line.startsWith(INDENT)) return line.slice(INDENT.length);
        if (line.startsWith('\t')) return line.slice(1);
        return line;
      });
      const removedFromFirst = lines[0].startsWith(INDENT) ? INDENT.length : (lines[0].startsWith('\t') ? 1 : 0);
      const nextBlock = updated.join('\n');
      const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
      const removedTotal = selected.length - nextBlock.length;
      const nextStart = Math.max(blockStart, start - removedFromFirst);
      const nextEnd = Math.max(nextStart, end - removedTotal);
      applyEditorValue(kind, textarea, nextValue, nextStart, nextEnd);
      return;
    }

    const nextBlock = lines.map((line) => INDENT + line).join('\n');
    const nextValue = value.slice(0, blockStart) + nextBlock + value.slice(blockEnd);
    const nextStart = start + INDENT.length;
    const nextEnd = end + INDENT.length * lines.length;
    applyEditorValue(kind, textarea, nextValue, nextStart, nextEnd);
  }

  function handleEditorIndent(event, kind) {
    if (event.key !== 'Tab') return false;
    event.preventDefault();
    applyIndentToTextarea(kind, event.target, event.shiftKey);
    return true;
  }

  function handleEditorEnter(event, kind) {
    if (event.key !== 'Enter') return false;
    event.preventDefault();

    const textarea = event.target;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const currentLine = before.slice(lineStartAt(value, start));
    const indent = (currentLine.match(/^[ \t]*/) || [''])[0];
    const trimmed = currentLine.trimEnd();
    const nextChar = after[0] || '';
    const extraIndent = /[\{\[\(]$/.test(trimmed) ? INDENT : '';
    const closeAhead = /^[\}\]\)]/.test(after);

    if (closeAhead && extraIndent) {
      const insert = '\n' + indent + extraIndent + '\n' + indent;
      const cursor = start + 1 + indent.length + extraIndent.length;
      const nextValue = before + insert + after;
      applyEditorValue(kind, textarea, nextValue, cursor);
      return true;
    }

    if (nextChar && /^[\}\]\)]$/.test(nextChar) && indent.endsWith(INDENT)) {
      const insert = '\n' + indent.slice(0, -INDENT.length);
      const nextValue = before + insert + after;
      applyEditorValue(kind, textarea, nextValue, start + insert.length);
      return true;
    }

    const insert = '\n' + indent + extraIndent;
    const nextValue = before + insert + after;
    applyEditorValue(kind, textarea, nextValue, start + insert.length);
    return true;
  }

  function formatCLikeCode(text) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    let level = 0;
    const out = [];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        out.push('');
        continue;
      }

      const closeCount = (trimmed.match(/^[\}\]\)]+/) || [''])[0].length;
      const lineLevel = Math.max(0, level - closeCount);
      out.push(INDENT.repeat(lineLevel) + trimmed);

      const openCount = (trimmed.match(/[\{\[\(]/g) || []).length;
      const endCloseCount = (trimmed.match(/[\}\]\)]/g) || []).length;
      level = Math.max(0, lineLevel + openCount - endCloseCount + closeCount);
    }

    return out.join('\n');
  }

  function editorToolbar(kind) {
    return `
      <div class="editor-toolbar">
        <span class="editor-hint">编辑器增强已启用：Tab 缩进 / Shift+Tab 反缩进 / Enter 自动缩进</span>
        <div class="row compact">
          <button type="button" onclick="AppActions.editorIndent('${kind}')">缩进</button>
          <button type="button" onclick="AppActions.editorOutdent('${kind}')">反缩进</button>
          <button type="button" onclick="AppActions.editorFormat('${kind}')">整理缩进</button>
        </div>
      </div>
    `;
  }

  function extractFunctionName(code) {
    const match = String(code || '').match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\([^;{}]*\)\s*\{/);
    return match ? match[1] : '';
  }

  function looksLikeFunctionCode(code) {
    const source = String(code || '').trim();
    if (!source) return false;
    if (/\bint\s+main\s*\(/.test(source)) return false;
    return /\b[A-Za-z_][A-Za-z0-9_\s\*]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\([^;{}]*\)\s*\{/.test(source);
  }

  function buildSnippetDriver(question, code) {
    const funcs = question.related_functions || [];
    const sample = normalizeSampleText(question.input_example);
    const source = String(code || question.starter_code || '');

    if (funcs.includes('sscanf_s')) {
      const printLine = question.id === 'ext_iface_sscanf_s'
        ? 'printf("id=%d, mem=%d\\n", id, mem);'
        : 'printf("id=%d mem=%d\\n", id, mem);';
      return joinCodeLines([
        maybeDeclare(source, 'line', 'char line[] = ' + quoteCString(sample || 'id=3,mem=256') + ';'),
        maybeDeclare(source, 'id', 'int id = 0;'),
        maybeDeclare(source, 'mem', 'int mem = 0;'),
        '/*__USER_CODE__*/',
        printLine,
        'return 0;'
      ]);
    }

    if (funcs.includes('strtok_s')) {
      return joinCodeLines([
        maybeDeclare(source, 'line', 'char line[] = ' + quoteCString(sample || 'a,b,c') + ';'),
        maybeDeclare(source, 'out', 'char *out[16] = {0};'),
        maybeDeclare(source, 'max_n', 'int max_n = 16;'),
        maybeDeclare(source, 'n', 'int n = 0;'),
        '/*__USER_CODE__*/',
        'for (int i = 0; i < n; ++i) {',
        '  printf("%s\\n", out[i]);',
        '}',
        'return 0;'
      ]);
    }

    if (funcs.includes('sprintf_s')) {
      return joinCodeLines([
        maybeDeclare(source, 'out', 'char out[128] = {0};'),
        maybeDeclare(source, 'buf', 'char buf[128] = {0};'),
        maybeDeclare(source, 'id', 'int id = 7;'),
        '/*__USER_CODE__*/',
        'if (out[0] != \'\\0\') printf("%s\\n", out);',
        'if (buf[0] != \'\\0\') printf("%s\\n", buf);',
        'return 0;'
      ]);
    }

    if (funcs.includes('strtol') || funcs.includes('strtoll')) {
      return joinCodeLines([
        maybeDeclare(source, 'text', 'char text[] = ' + quoteCString(sample || '0x1f') + ';'),
        maybeDeclare(source, 'end', 'char *end = NULL;'),
        maybeDeclare(source, 'v', 'long v = 0;'),
        '/*__USER_CODE__*/',
        'printf("%ld\\n", v);',
        'return 0;'
      ]);
    }

    if (funcs.includes('strcpy_s') || funcs.includes('strncpy_s') || funcs.includes('strcat_s')) {
      return [
        'char src[] = "abcdef";',
        'char dir[] = "/tmp/";',
        'char file[] = "a.txt";',
        'char dst[128] = {0};',
        'char out[128] = {0};',
        'size_t n = 3;',
        '/*__USER_CODE__*/',
        'if (dst[0] != \'\\0\') printf("%s\\n", dst);',
        'if (out[0] != \'\\0\') printf("%s\\n", out);',
        'return 0;'
      ].join('\n');
    }

    if (funcs.includes('strstr') || funcs.includes('strchr') || funcs.includes('strrchr')) {
      return [
        'char line[] = ' + quoteCString(sample || 'abc,def,ghi') + ';',
        'char *s = line;',
        'char *p = NULL;',
        'int pos = -1;',
        '/*__USER_CODE__*/',
        'if (p != NULL) pos = (int)(p - line);',
        'printf("pos=%d\\n", pos);',
        'return 0;'
      ].join('\n');
    }

    return [
      '/* Auto driver: snippet questions run directly inside main. */',
      '/*__USER_CODE__*/',
      'return 0;'
    ].join('\n');
  }

  function buildFunctionDriver(question, code) {
    const funcs = question.related_functions || [];
    const fn = extractFunctionName(code) || extractFunctionName(question.starter_code || '') || 'solve';
    const arr = extractIntArray(question.input_example);

    if (question.id === 'md_vlan_extract_numbers' || /parse_vlan_ids/.test(code)) {
      return [
        'char line[] = ' + quoteCString(normalizeSampleText(question.input_example) || 'port trunk allow-pass vlan 10 20 to 30') + ';',
        'int out[32] = {0};',
        'int n = ' + fn + '(line, out, 32);',
        'for (int i = 0; i < n; ++i) {',
        '  printf("%d\\n", out[i]);',
        '}',
        'return 0;'
      ].join('\n');
    }

    if (question.id === 'md_vlan_merge_ranges' || /merge_ranges/.test(code)) {
      return [
        'int arr[] = ' + buildIntArrayLiteral(arr, [9, 10, 11, 15, 16, 18]) + ';',
        'int out[16][2] = {{0}};',
        'int n = sizeof(arr) / sizeof(arr[0]);',
        'int k = ' + fn + '(arr, n, out);',
        'for (int i = 0; i < k; ++i) {',
        '  printf("[%d,%d]\\n", out[i][0], out[i][1]);',
        '}',
        'return 0;'
      ].join('\n');
    }

    if (question.id === 'md_vlan_format_output' || /build_cmd/.test(code)) {
      return [
        'int ranges[][2] = {{9, 11}, {15, 16}, {18, 18}};',
        'char out[256] = {0};',
        'int k = sizeof(ranges) / sizeof(ranges[0]);',
        fn + '(ranges, k, out, sizeof(out));',
        'printf("%s\\n", out);',
        'return 0;'
      ].join('\n');
    }

    if (/MachineCmp/.test(code) || question.id === 'micro_priority_machine_cmp') {
      return [
        'Machine a = {3, 64, 2};',
        'Machine b = {8, 64, 1};',
        'int r = ' + fn + '(&a, &b);',
        'printf("cmp=%d\\n", r);',
        'return 0;'
      ].join('\n');
    }

    if (funcs.includes('qsort')) {
      return [
        'int left = 5, right = 1;',
        'int cmp = ' + fn + '(&left, &right);',
        'printf("cmp=%d\\n", cmp);',
        'int arr[] = ' + buildIntArrayLiteral(arr, [5, 1, 9, 2]) + ';',
        'int n = sizeof(arr) / sizeof(arr[0]);',
        'qsort(arr, n, sizeof(arr[0]), ' + fn + ');',
        'for (int i = 0; i < n; ++i) {',
          '  printf("%d\\n", arr[i]);',
        '}',
        'return 0;'
      ].join('\n');
    }

    if (funcs.includes('strtok_s')) {
      return [
        'char line[] = ' + quoteCString(normalizeSampleText(question.input_example) || 'a,b,c') + ';',
        'char *out[16] = {0};',
        'int n = ' + fn + '(line, out, 16);',
        'for (int i = 0; i < n; ++i) {',
        '  printf("%s\\n", out[i]);',
        '}',
        'return 0;'
      ].join('\n');
    }

    return [
      '/* Auto driver generated. Start debugging directly; edit only if needed. */',
      'return 0;'
    ].join('\n');
  }

  function buildDriverTemplate(question, code) {
    if (!question) return 'return 0;';
    const source = String(code || question.starter_code || '');
    return looksLikeFunctionCode(source) ? buildFunctionDriver(question, source) : buildSnippetDriver(question, source);
  }

  function normalizeHintKey(name) {
    const raw = String(name || "").trim().toLowerCase();
    if (!raw) return "";
    if (raw.startsWith("vosvector")) return "vosvector";
    if (raw.startsWith("vosmap")) return "vosmap";
    if (raw.startsWith("voshash")) return "voshash";
    if (raw.startsWith("vosprique")) return "vosprique";
    return raw.replace(/[^a-z0-9_]/g, "");
  }

  function getInterfaceHints(question) {
    if (!question) return [];
    const hints = [];
    const seen = new Set();
    const keys = [];

    for (const name of question.related_functions || []) {
      const key = normalizeHintKey(name);
      if (key) keys.push(key);
    }

    if (keys.length === 0) {
      const source = `${question.title || ""} ${question.brief || ""} ${question.starter_code || ""}`;
      for (const key of Object.keys(INTERFACE_HINTS)) {
        if (source.toLowerCase().includes(key)) keys.push(key);
      }
    }

    for (const key of keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      if (INTERFACE_HINTS[key]) hints.push(INTERFACE_HINTS[key]);
    }

    return hints;
  }

  function extractNamedInt(text, name, fallback) {
    const match = String(text || "").match(new RegExp(`${name}\\s*=\\s*(-?\\d+)`));
    return match ? Number(match[1]) : fallback;
  }

  function extractTuplePairs(text) {
    const pairs = [];
    const regex = /\((-?\d+)\s*,\s*(-?\d+)\)/g;
    let match = regex.exec(String(text || ""));
    while (match) {
      pairs.push([Number(match[1]), Number(match[2])]);
      match = regex.exec(String(text || ""));
    }
    return pairs;
  }

  function sanitizeJudgeSource(question, code) {
    const questionId = question && question.id ? question.id : "";
    let text = String(code || "");
    if (questionId === "tpl_dfs_preorder") {
      text = text.replace(/typedef\s+struct\s+Node\s*\{[\s\S]*?\}\s*Node\s*;\s*/m, "");
    }
    return text.trim();
  }

  function buildJudgeSpec(question, code) {
    if (!question) return null;
    const source = sanitizeJudgeSource(question, code || question.starter_code || "");
    const funcs = question.related_functions || [];
    const fn = extractFunctionName(source) || extractFunctionName(question.starter_code || "");
    const questionId = question.id || "";
    const useGlobalCode = looksLikeFunctionCode(source);
    const recordHelpers = [
      'static int used[16] = {0};',
      'static int md_path[64];',
      'static int md_path_len = 0;',
      'static int md_records[256][64];',
      'static int md_record_lens[256];',
      'static int md_record_count = 0;',
      'void path_push(int v) { if (md_path_len < 64) md_path[md_path_len++] = v; }',
      'void path_pop(void) { if (md_path_len > 0) --md_path_len; }',
      'int path_size(void) { return md_path_len; }',
      'void record_path(void) {',
      '  if (md_record_count >= 256) return;',
      '  md_record_lens[md_record_count] = md_path_len;',
      '  for (int i = 0; i < md_path_len; ++i) md_records[md_record_count][i] = md_path[i];',
      '  ++md_record_count;',
      '}',
      'int md_cmp_int(const void *a, const void *b) {',
      '  int x = *(const int *)a;',
      '  int y = *(const int *)b;',
      '  return (x > y) - (x < y);',
      '}',
      'int md_record_less(int a, int b) {',
      '  int n = md_record_lens[a] < md_record_lens[b] ? md_record_lens[a] : md_record_lens[b];',
      '  for (int i = 0; i < n; ++i) {',
      '    if (md_records[a][i] != md_records[b][i]) return md_records[a][i] < md_records[b][i];',
      '  }',
      '  return md_record_lens[a] < md_record_lens[b];',
      '}',
      'void md_swap_record(int a, int b) {',
      '  int len = md_record_lens[a];',
      '  md_record_lens[a] = md_record_lens[b];',
      '  md_record_lens[b] = len;',
      '  for (int i = 0; i < 64; ++i) {',
      '    int tmp = md_records[a][i];',
      '    md_records[a][i] = md_records[b][i];',
      '    md_records[b][i] = tmp;',
      '  }',
      '}',
      'void md_sort_records(void) {',
      '  for (int i = 0; i < md_record_count; ++i) {',
      '    for (int j = i + 1; j < md_record_count; ++j) {',
      '      if (!md_record_less(i, j)) md_swap_record(i, j);',
      '    }',
      '  }',
      '}',
      'void md_print_records(void) {',
      '  printf("[");',
      '  for (int i = 0; i < md_record_count; ++i) {',
      '    if (i) printf(",");',
      '    printf("[");',
      '    for (int j = 0; j < md_record_lens[i]; ++j) {',
      '      if (j) printf(",");',
      '      printf("%d", md_records[i][j]);',
      '    }',
      '    printf("]");',
      '  }',
      '  printf("]\\n");',
      '}'
    ].join("\n");

    if ((questionId === "md_vlan_extract_numbers" || fn === "parse_vlan_ids") && fn) {
      return {
        driverCode: [
          'char line[] = "port trunk allow-pass vlan 10 20 to 30";',
          'int out[32] = {0};',
          `int n = ${fn}(line, out, 32);`,
          'printf("[");',
          'for (int i = 0; i < n; ++i) {',
          '  printf(i ? ",%d" : "%d", out[i]);',
          '}',
          'printf("]\\n");',
          'return 0;'
        ].join("\n"),
        expectedOutput: "[10,20,30]"
      };
    }

    if ((questionId === "md_vlan_merge_ranges" || fn === "merge_ranges") && fn) {
      return {
        driverCode: [
          'int arr[] = {9, 10, 11, 15, 16, 18};',
          'int out[16][2] = {{0}};',
          'int n = sizeof(arr) / sizeof(arr[0]);',
          `int k = ${fn}(arr, n, out);`,
          'printf("[");',
          'for (int i = 0; i < k; ++i) {',
          '  printf(i ? ",(%d,%d)" : "(%d,%d)", out[i][0], out[i][1]);',
          '}',
          'printf("]\\n");',
          'return 0;'
        ].join("\n"),
        expectedOutput: "[(9,11),(15,16),(18,18)]"
      };
    }

    if ((questionId === "md_vlan_format_output" || fn === "build_cmd") && fn) {
      const pairs = extractTuplePairs(question.input_example);
      const ranges = pairs.length ? pairs : [[9, 11], [15, 16], [18, 18]];
      const rangeLiteral = `{ ${ranges.map((pair) => `{${pair[0]}, ${pair[1]}}`).join(", ")} }`;
      return {
        driverCode: [
          `int ranges[][2] = ${rangeLiteral};`,
          'char out[256] = {0};',
          'int k = sizeof(ranges) / sizeof(ranges[0]);',
          `${fn}(ranges, k, out, sizeof(out));`,
          'printf("%s\\n", out);',
          'return 0;'
        ].join("\n"),
        expectedOutput: "port trunk allow-pass vlan 9 to 11 15 to 16 18"
      };
    }

    if ((questionId === "tpl_qsort_int_cmp" || questionId === "ext_iface_qsort" || (funcs.includes("qsort") && /cmp/i.test(fn) && fn !== "MachineCmp")) && fn) {
      const arr = extractIntArray(question.input_example);
      return {
        driverCode: [
          `int arr[] = ${buildIntArrayLiteral(arr, [5, 1, 4, 2])};`,
          'int n = sizeof(arr) / sizeof(arr[0]);',
          `qsort(arr, n, sizeof(arr[0]), ${fn});`,
          'printf("[");',
          'for (int i = 0; i < n; ++i) {',
          '  printf(i ? ",%d" : "%d", arr[i]);',
          '}',
          'printf("]\\n");',
          'return 0;'
        ].join("\n"),
        expectedOutput: question.expected_output || "[1,2,4,5]"
      };
    }

    if ((questionId === "micro_priority_machine_cmp" || fn === "MachineCmp") && fn) {
      return {
        driverCode: [
          'typedef struct { int id; int leftMemory; int vmNums; } Machine;',
          'Machine a = {3, 64, 2};',
          'Machine b = {8, 64, 1};',
          `int cmp = ${fn}(&a, &b);`,
          'if (cmp > 0) printf("B 浼樺厛\\n");',
          'else if (cmp < 0) printf("A 浼樺厛\\n");',
          'else printf("鐩哥瓑\\n");',
          'return 0;'
        ].join("\n"),
        expectedOutput: "B 浼樺厛"
      };
    }

    if ((questionId === "micro_bsearch_int" || questionId === "ext_iface_bsearch" || source.includes("find_idx(")) && source.includes("find_idx(")) {
      const arr = extractIntArray(question.input_example);
      const target = extractNamedInt(question.input_example, "target", arr.length > 1 ? arr[1] : 5);
      return {
        driverCode: [
          `int arr[] = ${buildIntArrayLiteral(arr, [1, 3, 5, 8])};`,
          'int n = sizeof(arr) / sizeof(arr[0]);',
          `int target = ${target};`,
          'printf("index=%d\\n", find_idx(arr, n, target));',
          'return 0;'
        ].join("\n"),
        expectedOutput: questionId === "ext_iface_bsearch" ? "index=2" : (question.expected_output || "index=2")
      };
    }

    if ((questionId === "tpl_strtok_csv" || source.includes("split_csv(")) && source.includes("split_csv(")) {
      const sample = normalizeSampleText(question.input_example) || "a,b,c";
      return {
        driverCode: [
          `char line[] = ${quoteCString(sample)};`,
          'char *out[16] = {0};',
          'int n = split_csv(line, out, 16);',
          'printf("[");',
          'for (int i = 0; i < n; ++i) {',
          '  printf(i ? ",\\"%s\\"" : "\\"%s\\"", out[i]);',
          '}',
          'printf("]\\n");',
          'return 0;'
        ].join("\n"),
        expectedOutput: question.expected_output || "[\"a\",\"b\",\"c\"]"
      };
    }

    if (questionId === "tpl_sscanf_parse_pair" || questionId === "ext_iface_sscanf_s" || funcs.includes("sscanf_s")) {
      const printLine =
        questionId === "ext_iface_sscanf_s"
          ? 'printf("id=%d, mem=%d\\n", id, mem);'
          : 'printf("id=%d mem=%d\\n", id, mem);';
      const sample = normalizeSampleText(question.input_example) || "id=17,mem=32";
      return {
        driverCode: joinCodeLines([
          maybeDeclare(source, 'line', `char line[] = ${quoteCString(sample)};`),
          maybeDeclare(source, 'id', 'int id = 0;'),
          maybeDeclare(source, 'mem', 'int mem = 0;'),
          '/*__USER_CODE__*/',
          printLine,
          'return 0;'
        ]),
        expectedOutput: questionId === "ext_iface_sscanf_s" ? "id=17, mem=32" : "id=17 mem=32"
      };
    }

    if (questionId === "tpl_sprintf_node" || questionId === "ext_iface_sprintf_s" || funcs.includes("sprintf_s")) {
      const id = extractNamedInt(question.input_example, "id", 3);
      return {
        driverCode: joinCodeLines([
          maybeDeclare(source, 'buf', 'char buf[128] = {0};'),
          maybeDeclare(source, 'out', 'char out[128] = {0};'),
          maybeDeclare(source, 'id', `int id = ${id};`),
          '/*__USER_CODE__*/',
          'if (out[0] != \'\\0\') printf("%s\\n", out);',
          'else printf("%s\\n", buf);',
          'return 0;'
        ]),
        expectedOutput: question.expected_output || "node-03"
      };
    }

    if (funcs.includes("strtol") || funcs.includes("strtoll")) {
      const sample = normalizeSampleText(question.input_example) || "0x1f";
      return {
        driverCode: joinCodeLines([
          maybeDeclare(source, 'text', `char text[] = ${quoteCString(sample)};`),
          maybeDeclare(source, 'end', 'char *end = NULL;'),
          maybeDeclare(source, 'v', 'long v = 0;'),
          '/*__USER_CODE__*/',
          'printf("%ld\\n", v);',
          'return 0;'
        ]),
        expectedOutput: question.expected_output || "31"
      };
    }

    if (questionId === "tpl_dfs_preorder" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  Node n4 = {4, NULL, NULL, NULL};',
          '  Node n5 = {5, NULL, NULL, NULL};',
          '  Node n2 = {2, NULL, NULL, NULL};',
          '  Node n3 = {3, &n4, &n5, NULL};',
          '  Node n1 = {1, &n2, &n3, NULL};',
          '  int out[16] = {0};',
          '  int idx = 0;',
          `  ${fn}(&n1, out, &idx);`,
          '  printf("[");',
          '  for (int i = 0; i < idx; ++i) {',
          '    printf(i ? ",%d" : "%d", out[i]);',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[1,2,3,4,5]"
      };
    }

    if (questionId === "ext_algo_tree_dfs" && useGlobalCode && fn) {
      return {
        driverCode: [
          'static int md_visit_out[32];',
          'static int md_visit_n = 0;',
          'void visit(Node *x) {',
          '  if (x != NULL) md_visit_out[md_visit_n++] = x->val;',
          '}',
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  Node n2 = {2, NULL, NULL, NULL};',
          '  Node n3 = {3, NULL, NULL, NULL};',
          '  Node n1 = {1, &n2, &n3, NULL};',
          `  ${fn}(&n1);`,
          '  printf("[");',
          '  for (int i = 0; i < md_visit_n; ++i) {',
          '    printf(i ? ",%d" : "%d", md_visit_out[i]);',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[1,2,3]"
      };
    }

    if (questionId === "dfs_traversal_collect_leaves" && useGlobalCode && fn) {
      return {
        driverCode: [
          recordHelpers,
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  md_path_len = 0;',
          '  md_record_count = 0;',
          '  Node n2 = {2, NULL, NULL, NULL};',
          '  Node n4 = {4, NULL, NULL, NULL};',
          '  Node n3 = {3, &n4, NULL, NULL};',
          '  Node n1 = {1, &n2, &n3, NULL};',
          `  ${fn}(&n1);`,
          '  md_sort_records();',
          '  md_print_records();',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[[1,2],[1,3,4]]"
      };
    }

    if (questionId === "dfs_traversal_component_count" && useGlobalCode && fn) {
      return {
        driverCode: [
          'char grid[64][64];',
          'int vis[64][64];',
          'int n = 0;',
          'int m = 0;',
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  memset(grid, 0, sizeof(grid));',
          '  memset(vis, 0, sizeof(vis));',
          '  strcpy(grid[0], "1100");',
          '  strcpy(grid[1], "0101");',
          '  strcpy(grid[2], "0011");',
          '  n = 3;',
          '  m = 4;',
          '  int ans = 0;',
          '  for (int i = 0; i < n; ++i) {',
          '    for (int j = 0; j < m; ++j) {',
          '      if (grid[i][j] == \'1\' && !vis[i][j]) {',
          '        ++ans;',
          `        ${fn}(i, j);`,
          '      }',
          '    }',
          '  }',
          '  printf("%d\\n", ans);',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "2"
      };
    }

    if (questionId === "dfs_divide_tree_height" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  Node n4 = {4, NULL, NULL, NULL};',
          '  Node n5 = {5, NULL, NULL, NULL};',
          '  Node n2 = {2, NULL, NULL, NULL};',
          '  Node n3 = {3, &n4, &n5, NULL};',
          '  Node n1 = {1, &n2, &n3, NULL};',
          `  printf("%d\\n", ${fn}(&n1));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "3"
      };
    }

    if (questionId === "dfs_divide_balanced_tree" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  Node b4 = {4, NULL, NULL, NULL};',
          '  Node b5 = {5, NULL, NULL, NULL};',
          '  Node b2 = {2, NULL, NULL, NULL};',
          '  Node b3 = {3, &b4, &b5, NULL};',
          '  Node b1 = {1, &b2, &b3, NULL};',
          '  Node u4 = {4, NULL, NULL, NULL};',
          '  Node u3 = {3, &u4, NULL, NULL};',
          '  Node u2 = {2, &u3, NULL, NULL};',
          '  Node u1 = {1, &u2, NULL, NULL};',
          `  printf("%s\\n", ${fn}(&b1) == -1 ? "false" : "true");`,
          `  printf("%s\\n", ${fn}(&u1) == -1 ? "false" : "true");`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "true\nfalse"
      };
    }

    if (questionId === "micro_bfs_shortest_path" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  char grid[3][64] = {"S01", "000", "10T"};',
          `  printf("%d\\n", ${fn}(grid, 3, 3));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "4"
      };
    }

    if (questionId === "ext_algo_graph_bfs" && useGlobalCode && fn) {
      return {
        driverCode: [
          'int graph[256][256];',
          'int deg[256];',
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  memset(graph, 0, sizeof(graph));',
          '  memset(deg, 0, sizeof(deg));',
          '  graph[0][deg[0]++] = 1;',
          '  graph[1][deg[1]++] = 0;',
          '  graph[1][deg[1]++] = 2;',
          '  graph[2][deg[2]++] = 1;',
          `  printf("%s\\n", ${fn}(4, 0, 2) ? "true" : "false");`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "true"
      };
    }

    if (questionId === "bs_lcro_first_ge" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int a[] = {1, 2, 4, 4, 7};',
          `  printf("%d\\n", ${fn}(a, 5, 4));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "2"
      };
    }

    if (questionId === "bs_lcro_first_gt" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int a[] = {1, 2, 4, 4, 7};',
          `  printf("%d\\n", ${fn}(a, 5, 4));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "4"
      };
    }

    if (questionId === "bs_lcrc_last_le" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int a[] = {1, 2, 4, 4, 7};',
          `  printf("%d\\n", ${fn}(a, 5, 4));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "3"
      };
    }

    if (questionId === "bs_lcrc_first_ge" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int a[] = {1, 2, 4, 4, 7};',
          `  printf("%d\\n", ${fn}(a, 5, 3));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "2"
      };
    }

    if (questionId === "bs_locr_find_peak" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int a[] = {1, 3, 5, 4, 2};',
          `  printf("%d\\n", ${fn}(a, 5));`,
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "2"
      };
    }

    if (questionId === "bt_subset_unique_once" && useGlobalCode && fn) {
      return {
        driverCode: [
          recordHelpers,
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int nums[] = {1, 2, 3};',
          '  md_path_len = 0;',
          '  md_record_count = 0;',
          `  ${fn}(nums, 3, 0);`,
          '  md_sort_records();',
          '  md_print_records();',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]"
      };
    }

    if (questionId === "bt_comb_sum_unique_once" && useGlobalCode && fn) {
      return {
        driverCode: [
          recordHelpers,
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int nums[] = {2, 3, 6, 7};',
          '  md_path_len = 0;',
          '  md_record_count = 0;',
          `  ${fn}(nums, 4, 0, 7);`,
          '  md_sort_records();',
          '  md_print_records();',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[[7]]"
      };
    }

    if (questionId === "bt_perm_unique_once" && useGlobalCode && fn) {
      return {
        driverCode: [
          recordHelpers,
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int nums[] = {1, 2, 3};',
          '  memset(used, 0, sizeof(used));',
          '  md_path_len = 0;',
          '  md_record_count = 0;',
          `  ${fn}(nums, 3);`,
          '  md_sort_records();',
          '  md_print_records();',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"
      };
    }

    if (questionId === "bt_subset_dup_once") {
      return {
        driverCode: useGlobalCode
          ? [
              recordHelpers,
              '/*__USER_GLOBAL__*/',
              'int main(void) {',
              '  int nums[] = {1, 2, 2};',
              '  qsort(nums, 3, sizeof(nums[0]), md_cmp_int);',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(nums, 3, 0);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n")
          : [
              recordHelpers,
              'void dfs(int *nums, int n, int idx) {',
              '  record_path();',
              '  /*__USER_SNIPPET__*/',
              '}',
              'int main(void) {',
              '  int nums[] = {1, 2, 2};',
              '  qsort(nums, 3, sizeof(nums[0]), md_cmp_int);',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(nums, 3, 0);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n"),
        expectedOutput: "[[],[1],[1,2],[1,2,2],[2],[2,2]]"
      };
    }

    if (questionId === "bt_comb_sum_dup_once") {
      return {
        driverCode: useGlobalCode
          ? [
              recordHelpers,
              '/*__USER_GLOBAL__*/',
              'int main(void) {',
              '  int a[] = {2, 5, 2, 1, 2};',
              '  qsort(a, 5, sizeof(a[0]), md_cmp_int);',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(a, 5, 0, 7);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n")
          : [
              recordHelpers,
              'void dfs(int *a, int n, int idx, int remain) {',
              '  if (remain == 0) { record_path(); return; }',
              '  if (remain < 0) return;',
              '  /*__USER_SNIPPET__*/',
              '}',
              'int main(void) {',
              '  int a[] = {2, 5, 2, 1, 2};',
              '  qsort(a, 5, sizeof(a[0]), md_cmp_int);',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(a, 5, 0, 7);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n"),
        expectedOutput: "[[1,2,2,2],[2,5]]"
      };
    }

    if (questionId === "bt_perm_dup_once") {
      return {
        driverCode: useGlobalCode
          ? [
              recordHelpers,
              '/*__USER_GLOBAL__*/',
              'int main(void) {',
              '  int nums[] = {1, 1, 2};',
              '  qsort(nums, 3, sizeof(nums[0]), md_cmp_int);',
              '  memset(used, 0, sizeof(used));',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(nums, 3);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n")
          : [
              recordHelpers,
              'void dfs(int *nums, int n) {',
              '  if (path_size() == n) { record_path(); return; }',
              '  /*__USER_SNIPPET__*/',
              '}',
              'int main(void) {',
              '  int nums[] = {1, 1, 2};',
              '  qsort(nums, 3, sizeof(nums[0]), md_cmp_int);',
              '  memset(used, 0, sizeof(used));',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(nums, 3);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n"),
        expectedOutput: "[[1,1,2],[1,2,1],[2,1,1]]"
      };
    }

    if (questionId === "bt_subset_unique_repeat") {
      return {
        driverCode: useGlobalCode
          ? [
              recordHelpers,
              '/*__USER_GLOBAL__*/',
              'int main(void) {',
              '  int nums[] = {2, 3};',
              '  int k = 3;',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(nums, 2, 0, 0, k);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n")
          : [
              recordHelpers,
              'void dfs(int *nums, int n, int idx, int depth, int k) {',
              '  if (depth > k) return;',
              '  record_path();',
              '  /*__USER_SNIPPET__*/',
              '}',
              'int main(void) {',
              '  int nums[] = {2, 3};',
              '  int k = 3;',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(nums, 2, 0, 0, k);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n"),
        expectedOutput: "[[],[2],[2,2],[2,2,2],[2,2,3],[2,3],[2,3,3],[3],[3,3],[3,3,3]]"
      };
    }

    if (questionId === "bt_comb_sum_unique_repeat") {
      return {
        driverCode: useGlobalCode
          ? [
              recordHelpers,
              '/*__USER_GLOBAL__*/',
              'int main(void) {',
              '  int a[] = {2, 3, 6, 7};',
              '  qsort(a, 4, sizeof(a[0]), md_cmp_int);',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(a, 4, 0, 7);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n")
          : [
              recordHelpers,
              'void dfs(int *a, int n, int idx, int remain) {',
              '  if (remain == 0) { record_path(); return; }',
              '  if (remain < 0) return;',
              '  /*__USER_SNIPPET__*/',
              '}',
              'int main(void) {',
              '  int a[] = {2, 3, 6, 7};',
              '  qsort(a, 4, sizeof(a[0]), md_cmp_int);',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(a, 4, 0, 7);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n"),
        expectedOutput: "[[2,2,3],[7]]"
      };
    }

    if (questionId === "bt_perm_unique_repeat") {
      return {
        driverCode: useGlobalCode
          ? [
              recordHelpers,
              '/*__USER_GLOBAL__*/',
              'int main(void) {',
              '  int a[] = {1, 2};',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(a, 2, 3);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n")
          : [
              recordHelpers,
              'void dfs(int *a, int n, int k) {',
              '  if (path_size() == k) { record_path(); return; }',
              '  /*__USER_SNIPPET__*/',
              '}',
              'int main(void) {',
              '  int a[] = {1, 2};',
              '  md_path_len = 0;',
              '  md_record_count = 0;',
              '  dfs(a, 2, 3);',
              '  md_sort_records();',
              '  md_print_records();',
              '  return 0;',
              '}'
            ].join("\n"),
        expectedOutput: "[[1,1,1],[1,1,2],[1,2,1],[1,2,2],[2,1,1],[2,1,2],[2,2,1],[2,2,2]]"
      };
    }

    if (questionId === "tpl_vosvector_push_sort") {
      return {
        driverCode: [
          'int cmp_int(const void *a, const void *b) {',
          '  int x = *(const int *)a;',
          '  int y = *(const int *)b;',
          '  return (x > y) - (x < y);',
          '}',
          'int main(void) {',
          '  int arr[] = {7, 2, 5};',
          '  int n = 3;',
          '  /*__USER_SNIPPET__*/',
          '  printf("[");',
          '  for (int i = 0; i < vec->size; ++i) {',
          '    int *p = (int *)(vec->data + (size_t)i * vec->item_size);',
          '    printf(i ? ",%d" : "%d", *p);',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[2,5,7]"
      };
    }

    if (questionId === "micro_vosmap_count_freq") {
      return {
        driverCode: [
          'int main(void) {',
          '  const char *words[] = {"err", "warn", "err"};',
          '  int n = 3;',
          '  /*__USER_SNIPPET__*/',
          '  int *err = (int *)VOS_MapGet(m, "err");',
          '  int *warn = (int *)VOS_MapGet(m, "warn");',
          '  printf("err:%d warn:%d\\n", err ? *err : -1, warn ? *warn : -1);',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "err:2 warn:1"
      };
    }

    if (questionId === "micro_voshash_dedup" || questionId === "ext_vos_voshash") {
      return {
        driverCode: [
          'int main(void) {',
          questionId === "micro_voshash_dedup" ? '  int arr[] = {4, 2, 4, 3, 2};' : '  int arr[] = {4, 2, 4, 3, 2};',
          '  int n = 5;',
          '  int out[16] = {0};',
          '  int out_n = 0;',
          questionId === "micro_voshash_dedup" ? '  /*__USER_SNIPPET__*/' : '  VosHash *hash = VOS_HashCreate();\n  /*__USER_SNIPPET__*/',
          '  printf("[");',
          '  for (int i = 0; i < out_n; ++i) {',
          '    printf(i ? ",%d" : "%d", out[i]);',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[4,2,3]"
      };
    }

    if (questionId === "micro_vosprique_topk") {
      return {
        driverCode: [
          'int cmp_min_heap(const void *a, const void *b) {',
          '  int x = *(const int *)a;',
          '  int y = *(const int *)b;',
          '  return (x > y) - (x < y);',
          '}',
          'int main(void) {',
          '  int arr[] = {9, 1, 5, 7, 3};',
          '  int n = 5;',
          '  int k = 3;',
          '  /*__USER_SNIPPET__*/',
          '  int out[8] = {0};',
          '  int out_n = 0;',
          '  while (VOS_PriQueSize(pq) > 0) {',
          '    int *top = (int *)VOS_PriQueTop(pq);',
          '    out[out_n++] = *top;',
          '    VOS_PriQuePop(pq);',
          '  }',
          '  qsort(out, out_n, sizeof(out[0]), cmp_min_heap);',
          '  printf("[");',
          '  for (int i = 0; i < out_n; ++i) {',
          '    printf(i ? ",%d" : "%d", out[i]);',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[5,7,9]"
      };
    }

    if (questionId === "ext_vos_vosvector") {
      return {
        driverCode: [
          'int main(void) {',
          '  int arr[] = {3, 1, 2};',
          '  int n = 3;',
          '  /*__USER_SNIPPET__*/',
          '  printf("size=%d\\n", vec->size);',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "size=3"
      };
    }

    if (questionId === "ext_vos_voslist") {
      return {
        driverCode: [
          'int main(void) {',
          '  int *a = (int *)malloc(sizeof(int)); *a = 1;',
          '  int *b = (int *)malloc(sizeof(int)); *b = 2;',
          '  int *c = (int *)malloc(sizeof(int)); *c = 3;',
          '  int *d = (int *)malloc(sizeof(int)); *d = 4;',
          '  VosListNode *n1 = (VosListNode *)malloc(sizeof(VosListNode));',
          '  VosListNode *n2 = (VosListNode *)malloc(sizeof(VosListNode));',
          '  VosListNode *n3 = (VosListNode *)malloc(sizeof(VosListNode));',
          '  VosListNode *n4 = (VosListNode *)malloc(sizeof(VosListNode));',
          '  *n1 = (VosListNode){a, n2};',
          '  *n2 = (VosListNode){b, n3};',
          '  *n3 = (VosListNode){c, n4};',
          '  *n4 = (VosListNode){d, NULL};',
          '  VosList list_obj = {n1};',
          '  VosList *list = &list_obj;',
          '  /*__USER_SNIPPET__*/',
          '  printf("[");',
          '  VosListNode *cur = VOS_ListFront(list);',
          '  int idx = 0;',
          '  while (cur != NULL) {',
          '    int *value = (int *)VOS_ListData(cur);',
          '    printf(idx ? ",%d" : "%d", value ? *value : -1);',
          '    cur = VOS_ListNext(cur);',
          '    ++idx;',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[1,3]"
      };
    }

    if (questionId === "ext_vos_vosmap") {
      return {
        driverCode: [
          'int main(void) {',
          '  VosMap *map = VOS_MapCreate();',
          '  const char *key = "latency";',
          '  /*__USER_SNIPPET__*/',
          '  printf("%s\\n", VOS_MapGet(map, key) != NULL ? "found" : "missing");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "found"
      };
    }

    if (questionId === "ext_vos_vosmapfreq") {
      return {
        driverCode: [
          'int main(void) {',
          '  VosMap *map = VOS_MapCreate();',
          '  const char *words[] = {"err", "warn", "err"};',
          '  int n = 3;',
          '  /*__USER_SNIPPET__*/',
          '  int *err = (int *)VOS_MapGet(map, "err");',
          '  int *warn = (int *)VOS_MapGet(map, "warn");',
          '  printf("err:%d warn:%d\\n", err ? *err : -1, warn ? *warn : -1);',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "err:2 warn:1"
      };
    }

    if ((questionId === "ext_vos_vosprique" || questionId === "micro_priority_machine_cmp") && fn) {
      const machineType =
        questionId === "ext_vos_vosprique"
          ? 'typedef struct { int id; int left; int vm; } Machine;'
          : 'typedef struct { int id; int leftMemory; int vmNums; } Machine;';
      const machineA =
        questionId === "ext_vos_vosprique"
          ? '  Machine a = {3, 64, 2};'
          : '  Machine a = {3, 64, 2};';
      const machineB =
        questionId === "ext_vos_vosprique"
          ? '  Machine b = {8, 64, 1};'
          : '  Machine b = {8, 64, 1};';
      return {
        driverCode: [
          machineType,
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          machineA,
          machineB,
          `  int cmp = ${fn}(&a, &b);`,
          '  if (cmp > 0) printf("B 优先\\n");',
          '  else if (cmp < 0) printf("A 优先\\n");',
          '  else printf("相等\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "B 优先"
      };
    }

    if (questionId === "ext_vos_vosvectorsort" && fn) {
      return {
        driverCode: [
          '/*__USER_GLOBAL__*/',
          'int main(void) {',
          '  int arr[] = {7, 2, 5};',
          '  VosVector *vec = VOS_VectorCreate(sizeof(int), NULL);',
          '  for (int i = 0; i < 3; ++i) VOS_VectorPushBack(vec, &arr[i]);',
          `  VOS_VectorSort(vec, ${fn});`,
          '  printf("[");',
          '  for (int i = 0; i < vec->size; ++i) {',
          '    int *p = (int *)(vec->data + (size_t)i * vec->item_size);',
          '    printf(i ? ",%d" : "%d", *p);',
          '  }',
          '  printf("]\\n");',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "[2,5,7]"
      };
    }

    if (questionId === "ext_vos_vospriquedispatch") {
      return {
        driverCode: [
          'typedef struct { int id; int left; int vm; } Machine;',
          'int MachineCmp(const void *pa, const void *pb) {',
          '  const Machine *a = (const Machine *)pa;',
          '  const Machine *b = (const Machine *)pb;',
          '  if (a->left != b->left) return b->left - a->left;',
          '  if (a->vm != b->vm) return a->vm - b->vm;',
          '  return a->id - b->id;',
          '}',
          'int dispatch(VosPriQue *pq, int request) {',
          '  /*__USER_SNIPPET__*/',
          '}',
          'int main(void) {',
          '  Machine a = {3, 64, 2};',
          '  Machine b = {8, 64, 1};',
          '  Machine c = {5, 48, 1};',
          '  int request = 16;',
          '  VosPriQue *pq = VOS_PriQueCreate(MachineCmp, NULL);',
          '  VOS_PriQuePush(pq, (uintptr_t)&a);',
          '  VOS_PriQuePush(pq, (uintptr_t)&b);',
          '  VOS_PriQuePush(pq, (uintptr_t)&c);',
          '  printf("%d\\n", dispatch(pq, request));',
          '  return 0;',
          '}'
        ].join("\n"),
        expectedOutput: "8"
      };
    }

    return null;
  }

  function renderInterfaceHints(hints) {
    if (!hints.length) {
      return `
        <section class="helper-panel">
          <div class="debug-header">
            <h3>接口提示</h3>
            <span class="debug-badge">未命中</span>
          </div>
          <p class="sub">当前题目没有可展示的接口定义，通常说明它更偏算法模板题。</p>
        </section>
      `;
    }

    return `
      <section class="helper-panel">
        <div class="debug-header">
          <h3>接口提示</h3>
          <span class="debug-badge">${hints.length} 个接口</span>
        </div>
        <div class="hint-grid">
          ${hints
            .map(
              (hint) => `
              <article class="hint-card">
                <h4>${esc(hint.name || "")}</h4>
                <pre>${esc(hint.signature || "")}</pre>
                <p>${esc(hint.summary || "")}</p>
                ${
                  Array.isArray(hint.params) && hint.params.length
                    ? `<ul class="param-list">${hint.params
                        .map((item) => `<li><strong>${esc(item.name)}</strong>: ${esc(item.meaning)}</li>`)
                        .join("")}</ul>`
                    : ""
                }
                ${
                  Array.isArray(hint.notes) && hint.notes.length
                    ? `<ul class="param-list">${hint.notes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
                    : ""
                }
              </article>
            `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderJudgeResult() {
    if (!app.practice.judgeBusy && !app.practice.judgeError && !app.practice.judgeResult) return "";
    if (app.practice.judgeBusy) {
      return `
        <section class="judge-panel">
          <div class="debug-header">
            <h3>一键判题</h3>
            <span class="debug-badge">执行中</span>
          </div>
          <p class="sub">正在编译并执行样例，请稍等。</p>
        </section>
      `;
    }
    if (app.practice.judgeError) {
      return `
        <section class="judge-panel judge-fail">
          <div class="debug-header">
            <h3>一键判题</h3>
            <span class="debug-badge">不可判</span>
          </div>
          <pre class="debug-error">${esc(app.practice.judgeError)}</pre>
        </section>
      `;
    }

    const result = app.practice.judgeResult || {};
    const statusText = result.compile_error ? "编译错误" : (result.passed ? "通过" : "未通过");
    const statusClass = result.passed ? "judge-pass" : "judge-fail";

    return `
      <section class="judge-panel ${statusClass}">
        <div class="debug-header">
          <h3>一键判题</h3>
          <span class="debug-badge">${statusText}</span>
        </div>
        <p class="sub">返回码：${esc(result.return_code ?? "")}</p>
        <div class="judge-grid">
          <div class="card">
            <h4>期望输出</h4>
            <pre>${esc(result.expected_output || "")}</pre>
          </div>
          <div class="card">
            <h4>实际输出</h4>
            <pre>${esc(result.actual_output || "")}</pre>
          </div>
        </div>
        ${
          result.stderr
            ? `<div class="card"><h4>stderr</h4><pre>${esc(result.stderr)}</pre></div>`
            : ""
        }
      </section>
    `;
  }

  function renderSubmissionHistory(question) {
    const history = getQuestionSubmissions(question.id).slice(0, 8);
    if (!history.length) {
      return `
        <aside class="history-panel">
          <div class="debug-header">
            <h3>提交记录</h3>
            <span class="debug-badge">0 条</span>
          </div>
          <p class="sub">判题后会自动保存代码快照。手动“我答对了 / 我答错了”也会记在这里。</p>
        </aside>
      `;
    }

    return `
      <aside class="history-panel">
        <div class="debug-header">
          <h3>提交记录</h3>
          <span class="debug-badge">${history.length} 条</span>
        </div>
        <div class="history-list">
          ${history
            .map(
              (item) => `
              <article class="history-item">
                <div class="history-top">
                  <span class="status-chip ${submissionStatusClass(item)}">${submissionStatusText(item)}</span>
                  <span class="history-time">${esc(formatSubmissionTime(item.submitted_at))}</span>
                </div>
                <div class="history-meta">
                  <span>${item.duration_seconds ? `${esc(item.duration_seconds)}s` : "-"}</span>
                  <span>${esc((item.source_type || "manual") === "manual" ? "手动提交" : "判题提交")}</span>
                </div>
                ${
                  (item.source_type || "manual") === "judge"
                    ? `<div class="history-io">
                        <div><strong>期望：</strong>${esc(item.expected_output || "-")}</div>
                        <div><strong>实际：</strong>${esc(item.actual_output || item.stderr || "-")}</div>
                      </div>`
                    : ""
                }
                <pre class="history-code">${esc(item.code || "")}</pre>
                <div class="row compact">
                  <button type="button" onclick="AppActions.loadSubmission('${esc(item.id)}')">载入这份代码</button>
                </div>
              </article>
            `
            )
            .join("")}
        </div>
      </aside>
    `;
  }

  function storageGet(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures in portable mode.
    }
  }

  function driverKey(questionId) {
    return `${DEBUG_DRIVER_PREFIX}${questionId}`;
  }

  function loadDriverCode(questionId, fallback) {
    return storageGet(driverKey(questionId), fallback);
  }

  function saveDriverCode(questionId, value) {
    storageSet(driverKey(questionId), value);
  }

  function needsDriverRefresh(driver) {
    const text = String(driver || "");
    if (!text.trim()) return true;
    if (/printf\("[^"]*\r?\n/.test(text)) return true;
    if (/printf\('%[^']*\r?\n/.test(text)) return true;
    if (/printf\("%d ",\s*out\[i\]\);/.test(text)) return true;
    if (/printf\("%d ",\s*arr\[i\]\);/.test(text)) return true;
    if (/printf\("\[%d,%d\] ",\s*out\[i\]\[0\],\s*out\[i\]\[1\]\);/.test(text)) return true;
    return false;
  }

  function buildPracticeList(filters) {
    const tries = [];
    const mode = filters.mode || "";
    const skill = filters.skill || "";
    const func = filters.func || "";

    if (mode || skill || func) tries.push({ mode, skill, func, notice: "" });
    if (mode && skill && func) tries.push({ skill, func, notice: "当前“模式 + 标签 + 接口”无题，已放宽为“标签 + 接口”。" });
    if (func) tries.push({ func, notice: "当前筛选无题，已放宽为“仅接口：" + func + "”。" });
    if (mode && skill) tries.push({ skill, notice: "当前“模式 + 技能”无题，已放宽为“仅技能：" + skill + "”。" });
    if (mode) tries.push({ mode, notice: "当前筛选过窄，已放宽为“仅模式”。" });
    tries.push({ notice: "当前筛选无题，已切换为“全部题库”。" });

    for (const item of tries) {
      const list = filterQuestions(item);
      if (list.length > 0) return { list, notice: item.notice || "" };
    }
    return { list: [], notice: "" };
  }

  function currentQuestion() {
    return app.practice.list[app.practice.index];
  }

  function resetDebugRuntime() {
    app.practice.debugSessionId = "";
    app.practice.debugSnapshot = null;
    app.practice.debugBusy = false;
    app.practice.debugError = "";
  }

  async function apiPost(path, payload) {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    return data;
  }

  async function checkDebugCapabilities() {
    if (!/^https?:$/.test(location.protocol)) {
      app.debugService = {
        checked: true,
        available: false,
        gcc: "",
        gdb: "",
        mode: "",
        message: "当前是离线 file 模式。要启用真单步调试，请双击 run-debug.bat。"
      };
      render();
      return;
    }

    try {
      const response = await fetch("/api/debug/capabilities", { cache: "no-store" });
      const data = await response.json();
      app.debugService = {
        checked: true,
        available: Boolean(data.available),
        gcc: data.gcc || "",
        gdb: data.gdb || "",
        mode: data.mode || "",
        message: data.available
          ? `已连接调试服务。gcc: ${data.gcc || "unknown"}`
          : "未检测到 gcc/gdb，请先安装或配置本地工具链。"
      };
    } catch (error) {
      app.debugService = {
        checked: true,
        available: false,
        gcc: "",
        gdb: "",
        mode: "",
        message: "未连接到调试服务。请用 run-debug.bat 打开当前页面。"
      };
    }

    render();
  }

  async function stopDebugSession(silent) {
    const sessionId = app.practice.debugSessionId;
    resetDebugRuntime();
    if (!sessionId || !/^https?:$/.test(location.protocol)) return;
    try {
      await apiPost("/api/debug/stop", { session_id: sessionId });
    } catch (error) {
      if (!silent) app.practice.debugError = error.message;
    }
  }

  function fillPracticeState(question) {
    app.practice.showAnswer = false;
    app.practice.startAt = Date.now();
    app.practice.code = question ? question.starter_code || "" : "";
    app.practice.showHintPanel = false;
    app.practice.judgeBusy = false;
    app.practice.judgeError = "";
    app.practice.judgeResult = null;
    if (question) {
      const freshDriver = buildDriverTemplate(question, question.starter_code || "");
      const cachedDriver = loadDriverCode(question.id, freshDriver);
      app.practice.driverCode = needsDriverRefresh(cachedDriver) ? freshDriver : cachedDriver;
      if (app.practice.driverCode !== cachedDriver) saveDriverCode(question.id, app.practice.driverCode);
    } else {
      app.practice.driverCode = "";
    }
    app.practice.showDriverEditor = false;
    resetDebugRuntime();
  }

  async function openPracticeByFilters() {
    await stopDebugSession(true);
    const result = buildPracticeList(app.filters);
    app.practice.list = result.list;
    app.practice.notice = result.notice;
    app.practice.index = 0;
    fillPracticeState(result.list[0]);
    app.route = "practice";
    render();
  }

  async function openPracticeById(questionId) {
    await stopDebugSession(true);
    const question = QUESTIONS.find((item) => item.id === questionId);
    app.practice.list = question ? [question] : [];
    app.practice.notice = "";
    app.practice.index = 0;
    fillPracticeState(question);
    app.route = "practice";
    render();
  }

  function renderTopbar() {
    return `
      <header class="topbar">
        <div class="brand">可信考试 Micro Drills（免 Node 便携版）</div>
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
        <p class="sub">题库总量 ${m.totalQuestions} 题。支持离线浏览，也支持通过本地 gcc + gdb 真单步调试。</p>
      </section>

      <section class="panel">
        <h3>训练模式</h3>
        <div class="row">
          <button class="${app.filters.mode === "quick" ? "primary" : ""}" onclick="AppActions.setMode('quick')">快速练习（微题 + 模板）</button>
          <button class="${app.filters.mode === "micro" ? "primary" : ""}" onclick="AppActions.setMode('micro')">仅微题</button>
          <button class="${app.filters.mode === "template" ? "primary" : ""}" onclick="AppActions.setMode('template')">模板速练</button>
          <button class="${app.filters.mode === "decompose" ? "primary" : ""}" onclick="AppActions.setMode('decompose')">长题拆解</button>
        </div>
      </section>

      <section class="panel">
        <h3>筛选</h3>
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
                    .map((name) => `<option value="${esc(name)}" ${app.filters.func === name ? "selected" : ""}>${esc(name)}</option>`)
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

  function renderDebugSnapshot(snapshot) {
    if (!snapshot) {
      return `<p class="sub">当前没有活动调试会话。代码编译通过后，点击“开始调试”会停在 main 断点。</p>`;
    }

    const frame = snapshot.frame || {};
    const locals = Array.isArray(snapshot.locals) ? snapshot.locals : [];
    const localsHtml = locals.length
      ? `<ul class="runtime-locals">${locals.map((item) => `<li><strong>${esc(item.name)}</strong> = ${esc(item.value)}</li>`).join("")}</ul>`
      : `<p class="sub">当前栈帧没有可见局部变量。</p>`;

    return `
      <div class="runtime-meta">
        <div class="card">
          <div class="runtime-label">状态</div>
          <div>${esc(snapshot.status || "unknown")}</div>
        </div>
        <div class="card">
          <div class="runtime-label">停止原因</div>
          <div>${esc(snapshot.reason || "")}</div>
        </div>
        <div class="card">
          <div class="runtime-label">当前位置</div>
          <div>${esc(frame.func || "unknown")} @ ${esc(frame.file || frame.fullname || "")}:${esc(frame.line || "")}</div>
        </div>
      </div>
      <div class="grid">
        <div class="card">
          <h4>局部变量</h4>
          ${localsHtml}
        </div>
        <div class="card">
          <h4>源码窗口</h4>
          <pre>${esc(snapshot.source_excerpt || "")}</pre>
        </div>
        <div class="card">
          <h4>程序输出</h4>
          <pre>${esc(snapshot.stdout || "")}</pre>
        </div>
      </div>
    `;
  }

  function renderPractice() {
    const question = currentQuestion();
    if (!question) {
      return `
        <section class="panel">
          <h2>练习</h2>
          <p>当前筛选条件下没有题目。</p>
        </section>
      `;
    }

    const notice = app.practice.notice ? `<p class="sub">${esc(app.practice.notice)}</p>` : "";
    const interfaceHints = getInterfaceHints(question);
    const helperPanel = app.practice.showHintPanel ? renderInterfaceHints(interfaceHints) : "";
    const judgePanel = renderJudgeResult();
    const submissionHistory = renderSubmissionHistory(question);
    const answer = app.practice.showAnswer
      ? `
        <div class="panel">
          <h3>参考答案</h3>
          <pre>${esc(question.answer_code || "")}</pre>
          <h3>讲解</h3>
          <p>${esc(question.explanation || "")}</p>
          <h3>常见错误</h3>
          <ul>
            ${(question.common_mistakes || []).map((item) => `<li>${esc(item)}</li>`).join("")}
          </ul>
          <div class="row">
            <button onclick="AppActions.submitPractice(true)">我答对了</button>
            <button onclick="AppActions.submitPractice(false)">我答错了</button>
          </div>
        </div>
      `
      : "";

    const debugStatus = app.debugService.available
      ? `调试服务已连接。${esc(app.debugService.mode || "python+gcc+gdb")}`
      : esc(app.debugService.message || "当前未连接真调试服务。");

    return `
      <section class="practice">
        <aside class="panel">
          ${notice}
          <h2>${esc(question.title)}</h2>
          <p>${esc(question.brief)}</p>
          <p><strong>模式：</strong>${esc(question.mode)}</p>
          <p><strong>难度：</strong>${esc(question.difficulty)}</p>
          <p><strong>预计耗时：</strong>${esc(question.expected_time_seconds)}s</p>
          <p><strong>输入示例：</strong>${esc(question.input_example)}</p>
          <p><strong>期望输出：</strong>${esc(question.expected_output)}</p>
          <p><strong>标签：</strong>${esc((question.skill_tags || []).join(" / "))}</p>
          <p><strong>进度：</strong>${app.practice.index + 1}/${app.practice.list.length}</p>
        </aside>

        <div class="grid">
          <section class="panel">
            <div class="editor-shell">
              <div class="editor-main">
                ${editorToolbar('code')}
                <textarea id="code-editor" class="editor" oninput="AppActions.updateCode(this.value)">${esc(app.practice.code)}</textarea>
                <div class="row">
                  <button onclick="AppActions.toggleInterfaceHints()">${app.practice.showHintPanel ? "收起接口提示" : "接口提示"}</button>
                  <button class="primary" onclick="AppActions.judgePractice()">一键判题</button>
                  <button onclick="AppActions.showAnswer()">查看答案</button>
                  <button onclick="AppActions.loadAnswerCode()">载入参考答案</button>
                  <button onclick="AppActions.nextPractice()">下一题</button>
                </div>
              </div>
              ${submissionHistory}
            </div>
          </section>


          ${helperPanel}

          ${judgePanel}

          <section class="runtime-panel">
            <div class="debug-header">
              <h3>真单步调试</h3>
              <span class="debug-badge">${app.debugService.available ? "已连接" : "未连接"}</span>
            </div>
            <p class="sub">${debugStatus}</p>
            ${
              app.debugService.available && (app.debugService.gcc || app.debugService.gdb)
                ? `<p class="sub">gcc: ${esc(app.debugService.gcc || "")}<br>gdb: ${esc(app.debugService.gdb || "")}</p>`
                : ""
            }
            <p class="sub">已自动生成样例驱动。通常直接点“开始调试”即可；只有样例不合适时，再展开高级模式修改。</p>
            <div class="row">
              <button onclick="AppActions.toggleDriverEditor()">${app.practice.showDriverEditor ? "收起高级驱动" : "高级：编辑驱动"}</button>
              <button onclick="AppActions.resetDriver()">重置自动驱动</button>
            </div>
            ${
              app.practice.showDriverEditor
                ? `${editorToolbar('driver')}<textarea id="driver-editor" class="debug-editor" oninput="AppActions.updateDriver(this.value)">${esc(
                    app.practice.driverCode || buildDriverTemplate(question, app.practice.code || question.starter_code || "")
                  )}</textarea>`
                : `<pre>已自动生成样例驱动，默认不需要你手写 main。如果想换样例、补复杂输入，再点“高级：编辑驱动”。</pre>`
            }
            <div class="row">
              <button class="primary" ${disabledAttr(!app.debugService.available || app.practice.debugBusy)} onclick="AppActions.debugStart()">开始调试</button>
              <button ${disabledAttr(!app.practice.debugSessionId || app.practice.debugBusy)} onclick="AppActions.debugStepInto()">Step Into</button>
              <button ${disabledAttr(!app.practice.debugSessionId || app.practice.debugBusy)} onclick="AppActions.debugStepOver()">Step Over</button>
              <button ${disabledAttr(!app.practice.debugSessionId || app.practice.debugBusy)} onclick="AppActions.debugContinue()">Continue</button>
              <button ${disabledAttr(!app.practice.debugSessionId || app.practice.debugBusy)} onclick="AppActions.debugStop()">停止</button>
            </div>
            ${app.practice.debugBusy ? `<p class="sub">正在请求 gdb...</p>` : ""}
            ${app.practice.debugError ? `<pre class="debug-error">${esc(app.practice.debugError)}</pre>` : ""}
            ${renderDebugSnapshot(app.practice.debugSnapshot)}
          </section>

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
            ${m.tags.map((tag) => `<option value="${esc(tag)}" ${app.bank.skill === tag ? "selected" : ""}>${esc(tag)}</option>`).join("")}
          </select>
          ${
            isInterfaceSkill
              ? `<select onchange="AppActions.bankSetFunc(this.value)">
                  <option value="">全部接口</option>
                  ${funcs
                    .map((name) => `<option value="${esc(name)}" ${app.bank.func === name ? "selected" : ""}>${esc(name)}</option>`)
                    .join("")}
                </select>`
              : ""
          }
          <select onchange="AppActions.bankSetDifficulty(this.value)">
            <option value="">全部难度</option>
            ${[1, 2, 3, 4, 5]
              .map((difficulty) => `<option value="${difficulty}" ${String(app.bank.difficulty) === String(difficulty) ? "selected" : ""}>难度 ${difficulty}</option>`)
              .join("")}
          </select>
        </div>
      </section>

      <section class="cards">
        ${list
          .map(
            (question) => `
          <article class="card">
            <h3>${esc(question.title)}</h3>
            <p>${esc(question.brief)}</p>
            <p>难度 ${esc(question.difficulty)} | ${esc(question.mode)}</p>
            <p>${esc((question.skill_tags || []).join(" / "))}</p>
            <button onclick="AppActions.openQ('${esc(question.id)}')">去练习</button>
          </article>
        `
          )
          .join("")}
      </section>
    `;
  }

  function renderWrongbook() {
    const submissions = loadSubmissions();
    const questionMap = new Map(QUESTIONS.map((question) => [question.id, question]));
    const latest = new Map();

    for (const item of submissions) {
      const prev = latest.get(item.question_id);
      if (!prev || item.submitted_at > prev.submitted_at) latest.set(item.question_id, item);
    }

    const wrongQuestions = [...latest.values()]
      .filter((item) => !item.is_correct)
      .map((item) => questionMap.get(item.question_id))
      .filter(Boolean);

    const weakStats = {};
    for (const item of submissions) {
      if (item.is_correct) continue;
      const question = questionMap.get(item.question_id);
      if (!question) continue;
      for (const tag of question.skill_tags || []) {
        weakStats[tag] = (weakStats[tag] || 0) + 1;
      }
    }

    const weakList = Object.entries(weakStats).sort((a, b) => b[1] - a[1]);

    return `
      <section class="grid two">
        <div class="panel">
          <h2>错题本</h2>
          <p>当前错题数：${wrongQuestions.length}</p>
          <div class="cards">
            ${wrongQuestions
              .map(
                (question) => `
              <article class="card">
                <h3>${esc(question.title)}</h3>
                <p>${esc(question.brief)}</p>
                <button onclick="AppActions.openQ('${esc(question.id)}')">重新练习</button>
              </article>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="panel">
          <h2>薄弱技能统计</h2>
          <ul>
            ${weakList.map(([tag, count]) => `<li>${esc(tag)}: ${count}</li>`).join("")}
          </ul>
        </div>
      </section>
    `;
  }

  function renderDecompose() {
    const m = meta();
    if (!app.decompose.source && m.sourceProblems.length > 0) {
      app.decompose.source = m.sourceProblems[0];
    }
    const list = filterQuestions({ source: app.decompose.source, mode: "decompose" }).sort(
      (a, b) => (a.step_order || 999) - (b.step_order || 999)
    );

    return `
      <section class="panel">
        <h2>长题拆解</h2>
        <div class="row">
          <select onchange="AppActions.setSource(this.value)">
            ${m.sourceProblems
              .map((source) => `<option value="${esc(source)}" ${app.decompose.source === source ? "selected" : ""}>${esc(source)}</option>`)
              .join("")}
          </select>
        </div>
      </section>

      <section class="cards">
        ${list
          .map(
            (question) => `
          <article class="card">
            <h3>Step ${esc(question.step_order || "-")}：${esc(question.title)}</h3>
            <p>${esc(question.brief)}</p>
            <button onclick="AppActions.openQ('${esc(question.id)}')">进入此步骤</button>
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
    bindEditorEnhancements();
  }

  function bindEditorEnhancements() {
    const bindings = [
      ['code-editor', 'code'],
      ['driver-editor', 'driver'],
    ];

    for (const [id, kind] of bindings) {
      const el = document.getElementById(id);
      if (!el || el.dataset.editorBound === '1') continue;
      el.addEventListener('keydown', (event) => {
        window.AppActions.handleEditorKeydown(event, kind);
      });
      el.dataset.editorBound = '1';
    }
  }

  async function runDebugCommand(path) {
    if (!app.practice.debugSessionId) return;
    app.practice.debugBusy = true;
    app.practice.debugError = "";
    render();
    try {
      const data = await apiPost(path, { session_id: app.practice.debugSessionId });
      app.practice.debugSessionId = data.session_id || "";
      app.practice.debugSnapshot = data.snapshot || null;
      if (data.snapshot && data.snapshot.status === "exited") {
        app.practice.debugSessionId = "";
      }
    } catch (error) {
      app.practice.debugError = error.message;
    } finally {
      app.practice.debugBusy = false;
      render();
    }
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
    async startPractice() {
      await openPracticeByFilters();
    },
    async openQ(questionId) {
      await openPracticeById(questionId);
    },
    updateCode(code) {
      app.practice.code = code;
      app.practice.judgeError = "";
      app.practice.judgeResult = null;
    },
    editorIndent(kind) {
      const textarea = getEditorElement(kind);
      if (!textarea) return;
      applyIndentToTextarea(kind, textarea, false);
    },
    editorOutdent(kind) {
      const textarea = getEditorElement(kind);
      if (!textarea) return;
      applyIndentToTextarea(kind, textarea, true);
    },
    editorFormat(kind) {
      const textarea = getEditorElement(kind);
      if (!textarea) return;
      const nextValue = formatCLikeCode(textarea.value);
      applyEditorValue(kind, textarea, nextValue, 0, nextValue.length);
    },
    handleEditorKeydown(event, kind) {
      if (handleEditorIndent(event, kind)) return;
      if (handleEditorEnter(event, kind)) return;
    },
    updateDriver(value) {
      app.practice.driverCode = value;
      const question = currentQuestion();
      if (question) saveDriverCode(question.id, value);
    },
    toggleInterfaceHints() {
      app.practice.showHintPanel = !app.practice.showHintPanel;
      render();
    },
    toggleDriverEditor() {
      app.practice.showDriverEditor = !app.practice.showDriverEditor;
      render();
    },
    resetDriver() {
      const question = currentQuestion();
      if (!question) return;
      app.practice.driverCode = buildDriverTemplate(question, app.practice.code || question.starter_code || "");
      saveDriverCode(question.id, app.practice.driverCode);
      render();
    },
    loadAnswerCode() {
      const question = currentQuestion();
      if (!question || !question.answer_code) return;
      app.practice.code = question.answer_code;
       app.practice.judgeError = "";
       app.practice.judgeResult = null;
      render();
    },
    showAnswer() {
      app.practice.showAnswer = true;
      render();
    },
    async nextPractice() {
      if (app.practice.index + 1 >= app.practice.list.length) {
        alert("已经是最后一题。");
        return;
      }
      await stopDebugSession(true);
      app.practice.index += 1;
      fillPracticeState(currentQuestion());
      render();
    },
    submitPractice(isCorrect) {
      const question = currentQuestion();
      if (!question) return;
      const duration = Math.max(1, Math.round((Date.now() - app.practice.startAt) / 1000));
      postSubmission(question.id, app.practice.code, isCorrect, duration, {
        source_type: "manual"
      });
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
    bankSetDifficulty(value) {
      app.bank.difficulty = value;
      render();
    },
    setSource(source) {
      app.decompose.source = source;
      render();
    },
    async judgePractice() {
      const question = currentQuestion();
      if (!question) return;
      const spec = buildJudgeSpec(question, app.practice.code);
      if (!spec) {
        app.practice.judgeError = "当前题暂未配置自动判题样例。";
        app.practice.judgeResult = null;
        render();
        return;
      }
      if (!/^https?:$/.test(location.protocol)) {
        app.practice.judgeError = "离线 file 模式不能执行本地判题，请用 run-debug.bat 打开。";
        app.practice.judgeResult = null;
        render();
        return;
      }
      app.practice.judgeBusy = true;
      app.practice.judgeError = "";
      app.practice.judgeResult = null;
      render();
      try {
        const data = await apiPost("/api/judge", {
          question_id: question.id,
          code: app.practice.code,
          driver_code: spec.driverCode,
          expected_output: spec.expectedOutput
        });
        app.practice.judgeResult = data;
        const duration = Math.max(1, Math.round((Date.now() - app.practice.startAt) / 1000));
        postSubmission(question.id, app.practice.code, Boolean(data.passed), duration, {
          source_type: "judge",
          compile_error: Boolean(data.compile_error),
          actual_output: data.actual_output || "",
          expected_output: data.expected_output || "",
          stderr: data.stderr || ""
        });
      } catch (error) {
        app.practice.judgeError = error.message;
      } finally {
        app.practice.judgeBusy = false;
        render();
      }
    },
    async debugStart() {
      const question = currentQuestion();
      if (!question) return;
      const freshDriver = buildDriverTemplate(question, app.practice.code || question.starter_code || "");
      if (needsDriverRefresh(app.practice.driverCode)) {
        app.practice.driverCode = freshDriver;
        saveDriverCode(question.id, app.practice.driverCode);
      }
      if (!app.debugService.checked) {
        await checkDebugCapabilities();
      }
      if (!app.debugService.available) {
        app.practice.debugError = app.debugService.message || "当前未连接真调试服务。";
        render();
        return;
      }

      await stopDebugSession(true);
      app.practice.debugBusy = true;
      app.practice.debugError = "";
      render();

      try {
        const data = await apiPost("/api/debug/start", {
          question_id: question.id,
          code: app.practice.code,
          driver_code: app.practice.driverCode || freshDriver
        });
        app.practice.debugSessionId = data.session_id || "";
        app.practice.debugSnapshot = data.snapshot || null;
      } catch (error) {
        app.practice.debugError = error.message;
      } finally {
        app.practice.debugBusy = false;
        render();
      }
    },
    async debugStepInto() {
      await runDebugCommand("/api/debug/step-into");
    },
    async debugStepOver() {
      await runDebugCommand("/api/debug/step-over");
    },
    async debugContinue() {
      await runDebugCommand("/api/debug/continue");
    },
    async debugStop() {
      await stopDebugSession(false);
      render();
    },
    loadSubmission(submissionId) {
      const item = loadSubmissions().find((entry) => entry.id === submissionId);
      if (!item) return;
      app.practice.code = item.code || "";
      app.practice.judgeError = "";
      app.practice.judgeResult = null;
      render();
    }
  };

  render();
  checkDebugCapabilities();
})();
