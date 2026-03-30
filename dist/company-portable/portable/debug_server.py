import atexit
import json
import os
import queue
import re
import shutil
import subprocess
import tempfile
import threading
import time
import traceback
import uuid
import webbrowser
from http import HTTPStatus
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from socketserver import ThreadingMixIn
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 19081
SESSIONS = {}  # type: Dict[str, "DebugSession"]
SESSIONS_LOCK = threading.Lock()

os.chdir(str(ROOT))


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

PRELUDE = r"""
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdarg.h>
#include <errno.h>

#ifndef _TRUNCATE
#define _TRUNCATE ((size_t)-1)
#endif

typedef int errno_t;

static size_t md_strnlen(const char *src, size_t max_len) {
    size_t n = 0;
    if (src == NULL) return 0;
    while (n < max_len && src[n] != '\0') {
        ++n;
    }
    return n;
}

static char *md_strdup(const char *src) {
    size_t len = src == NULL ? 0 : strlen(src);
    char *dst = (char *)malloc(len + 1);
    if (dst == NULL) return NULL;
    if (len > 0) memcpy(dst, src, len);
    dst[len] = '\0';
    return dst;
}

#if !defined(__MINGW32__) && !defined(_MSC_VER)
static errno_t strcpy_s(char *dst, size_t cap, const char *src) {
    size_t len;
    if (dst == NULL || src == NULL || cap == 0) return EINVAL;
    len = strlen(src);
    if (len >= cap) {
        memcpy(dst, src, cap - 1);
        dst[cap - 1] = '\0';
        return ERANGE;
    }
    memcpy(dst, src, len + 1);
    return 0;
}

static errno_t strncpy_s(char *dst, size_t cap, const char *src, size_t count) {
    size_t copy_len;
    if (dst == NULL || src == NULL || cap == 0) return EINVAL;
    if (count == _TRUNCATE) {
        copy_len = md_strnlen(src, cap - 1);
    } else {
        copy_len = md_strnlen(src, count);
        if (copy_len >= cap) copy_len = cap - 1;
    }
    if (copy_len > 0) memcpy(dst, src, copy_len);
    dst[copy_len] = '\0';
    return 0;
}

static errno_t strcat_s(char *dst, size_t cap, const char *src) {
    size_t used;
    size_t left;
    size_t add;
    if (dst == NULL || src == NULL || cap == 0) return EINVAL;
    used = md_strnlen(dst, cap);
    if (used >= cap) {
        dst[cap - 1] = '\0';
        return ERANGE;
    }
    left = cap - used;
    add = strlen(src);
    if (add >= left) {
        if (left > 1) memcpy(dst + used, src, left - 1);
        dst[cap - 1] = '\0';
        return ERANGE;
    }
    memcpy(dst + used, src, add + 1);
    return 0;
}

static int sprintf_s(char *dst, size_t cap, const char *fmt, ...) {
    int n;
    va_list ap;
    if (dst == NULL || fmt == NULL || cap == 0) return -1;
    va_start(ap, fmt);
    n = vsnprintf(dst, cap, fmt, ap);
    va_end(ap);
    if (n < 0 || (size_t)n >= cap) {
        dst[cap - 1] = '\0';
        return -1;
    }
    return n;
}

static int sscanf_s(const char *buf, const char *fmt, ...) {
    int n;
    va_list ap;
    va_start(ap, fmt);
    n = vsscanf(buf, fmt, ap);
    va_end(ap);
    return n;
}

static char *strtok_s(char *str, const char *delim, char **context) {
    char *start;
    char *end;
    if (context == NULL || delim == NULL) return NULL;
    if (str != NULL) *context = str;
    if (*context == NULL) return NULL;

    start = *context + strspn(*context, delim);
    if (*start == '\0') {
        *context = NULL;
        return NULL;
    }

    end = start + strcspn(start, delim);
    if (*end == '\0') {
        *context = NULL;
    } else {
        *end = '\0';
        *context = end + 1;
    }
    return start;
}
#endif

typedef struct Node {
    int val;
    struct Node *left;
    struct Node *right;
    struct Node *next;
} Node;

typedef struct {
    int *data;
    int cap;
    int head;
    int tail;
    int count;
} Q;

static void dupFree(void *ptr) {
    (void)ptr;
}

typedef struct VosVector {
    unsigned char *data;
    size_t item_size;
    int size;
    int cap;
    void (*free_fn)(void *);
} VosVector;

static int md_vector_reserve(VosVector *vec, int need) {
    unsigned char *next;
    int cap;
    if (vec == NULL) return -1;
    if (vec->cap >= need) return 0;
    cap = vec->cap > 0 ? vec->cap : 8;
    while (cap < need) cap *= 2;
    next = (unsigned char *)realloc(vec->data, (size_t)cap * vec->item_size);
    if (next == NULL) return -1;
    vec->data = next;
    vec->cap = cap;
    return 0;
}

static VosVector *VOS_VectorCreate(size_t item_size, void (*free_fn)(void *)) {
    VosVector *vec = (VosVector *)calloc(1, sizeof(VosVector));
    if (vec == NULL) return NULL;
    vec->item_size = item_size == 0 ? sizeof(int) : item_size;
    vec->free_fn = free_fn;
    return vec;
}

static int VOS_VectorPushBack(VosVector *vec, const void *item) {
    unsigned char *slot;
    if (vec == NULL || item == NULL) return -1;
    if (md_vector_reserve(vec, vec->size + 1) != 0) return -1;
    slot = vec->data + (size_t)vec->size * vec->item_size;
    memcpy(slot, item, vec->item_size);
    vec->size += 1;
    return 0;
}

static void VOS_VectorSort(VosVector *vec, int (*cmp)(const void *, const void *)) {
    if (vec == NULL || cmp == NULL || vec->size <= 1) return;
    qsort(vec->data, (size_t)vec->size, vec->item_size, cmp);
}

typedef struct {
    char *key;
    uintptr_t raw;
    bool used;
} VosMapEntry;

typedef struct VosMap {
    VosMapEntry *entries;
    int size;
    int cap;
} VosMap;

static VosMap *md_VOS_MapCreate(void) {
    return (VosMap *)calloc(1, sizeof(VosMap));
}

#define VOS_MapCreate(...) md_VOS_MapCreate()

static int md_map_reserve(VosMap *map, int need) {
    VosMapEntry *next;
    int cap;
    if (map == NULL) return -1;
    if (map->cap >= need) return 0;
    cap = map->cap > 0 ? map->cap : 8;
    while (cap < need) cap *= 2;
    next = (VosMapEntry *)realloc(map->entries, (size_t)cap * sizeof(VosMapEntry));
    if (next == NULL) return -1;
    memset(next + map->cap, 0, (size_t)(cap - map->cap) * sizeof(VosMapEntry));
    map->entries = next;
    map->cap = cap;
    return 0;
}

static int md_map_find_index(VosMap *map, const char *key) {
    int i;
    if (map == NULL || key == NULL) return -1;
    for (i = 0; i < map->size; ++i) {
        if (map->entries[i].used && strcmp(map->entries[i].key, key) == 0) return i;
    }
    return -1;
}

static void *VOS_MapGet(VosMap *map, const char *key) {
    int idx = md_map_find_index(map, key);
    if (idx < 0) return NULL;
    return &map->entries[idx].raw;
}

static int VOS_MapPut(VosMap *map, const char *key, const void *value) {
    int idx;
    int temp = 0;
    if (map == NULL || key == NULL) return -1;
    idx = md_map_find_index(map, key);
    if (idx < 0) {
        if (md_map_reserve(map, map->size + 1) != 0) return -1;
        idx = map->size++;
        map->entries[idx].key = md_strdup(key);
        map->entries[idx].used = true;
    }
    if (value != NULL) memcpy(&temp, value, sizeof(int));
    map->entries[idx].raw = (uintptr_t)temp;
    return 0;
}

typedef struct VosHash {
    int *items;
    int size;
    int cap;
} VosHash;

static VosHash *md_VOS_HashCreate(void) {
    return (VosHash *)calloc(1, sizeof(VosHash));
}

#define VOS_HashCreate(...) md_VOS_HashCreate()

static int md_hash_reserve(VosHash *hash, int need) {
    int *next;
    int cap;
    if (hash == NULL) return -1;
    if (hash->cap >= need) return 0;
    cap = hash->cap > 0 ? hash->cap : 8;
    while (cap < need) cap *= 2;
    next = (int *)realloc(hash->items, (size_t)cap * sizeof(int));
    if (next == NULL) return -1;
    hash->items = next;
    hash->cap = cap;
    return 0;
}

static void *VOS_HashFind(VosHash *hash, const void *key) {
    int i;
    int needle = 0;
    if (hash == NULL || key == NULL) return NULL;
    memcpy(&needle, key, sizeof(int));
    for (i = 0; i < hash->size; ++i) {
        if (hash->items[i] == needle) return &hash->items[i];
    }
    return NULL;
}

static int VOS_HashInsert(VosHash *hash, const void *key) {
    int value = 0;
    if (hash == NULL || key == NULL) return -1;
    if (VOS_HashFind(hash, key) != NULL) return 0;
    if (md_hash_reserve(hash, hash->size + 1) != 0) return -1;
    memcpy(&value, key, sizeof(int));
    hash->items[hash->size++] = value;
    return 0;
}

typedef struct VosPriQue {
    uintptr_t *data;
    int size;
    int cap;
    int (*cmp)(const void *, const void *);
    void (*free_fn)(void *);
} VosPriQue;

static int md_prique_reserve(VosPriQue *pq, int need) {
    uintptr_t *next;
    int cap;
    if (pq == NULL) return -1;
    if (pq->cap >= need) return 0;
    cap = pq->cap > 0 ? pq->cap : 8;
    while (cap < need) cap *= 2;
    next = (uintptr_t *)realloc(pq->data, (size_t)cap * sizeof(uintptr_t));
    if (next == NULL) return -1;
    pq->data = next;
    pq->cap = cap;
    return 0;
}

static int md_prique_before(VosPriQue *pq, uintptr_t a, uintptr_t b) {
    if (pq != NULL && pq->cmp != NULL) return pq->cmp((const void *)a, (const void *)b) < 0;
    return a < b;
}

static void md_prique_swap(uintptr_t *a, uintptr_t *b) {
    uintptr_t tmp = *a;
    *a = *b;
    *b = tmp;
}

static VosPriQue *VOS_PriQueCreate(int (*cmp)(const void *, const void *), void *free_fn) {
    VosPriQue *pq = (VosPriQue *)calloc(1, sizeof(VosPriQue));
    if (pq == NULL) return NULL;
    pq->cmp = cmp;
    pq->free_fn = (void (*)(void *))free_fn;
    return pq;
}

static int VOS_PriQueSize(VosPriQue *pq) {
    return pq == NULL ? 0 : pq->size;
}

static int VOS_PriQuePush(VosPriQue *pq, uintptr_t item) {
    int idx;
    if (pq == NULL) return -1;
    if (md_prique_reserve(pq, pq->size + 1) != 0) return -1;
    idx = pq->size++;
    pq->data[idx] = item;
    while (idx > 0) {
        int parent = (idx - 1) / 2;
        if (!md_prique_before(pq, pq->data[idx], pq->data[parent])) break;
        md_prique_swap(&pq->data[idx], &pq->data[parent]);
        idx = parent;
    }
    return 0;
}

static void *VOS_PriQueTop(VosPriQue *pq) {
    if (pq == NULL || pq->size <= 0) return NULL;
    return (void *)pq->data[0];
}

static void VOS_PriQuePop(VosPriQue *pq) {
    int idx;
    if (pq == NULL || pq->size <= 0) return;
    pq->size -= 1;
    if (pq->size == 0) return;
    pq->data[0] = pq->data[pq->size];
    idx = 0;
    while (true) {
        int left = idx * 2 + 1;
        int right = left + 1;
        int best = idx;
        if (left < pq->size && md_prique_before(pq, pq->data[left], pq->data[best])) best = left;
        if (right < pq->size && md_prique_before(pq, pq->data[right], pq->data[best])) best = right;
        if (best == idx) break;
        md_prique_swap(&pq->data[idx], &pq->data[best]);
        idx = best;
    }
}

typedef struct VosListNode {
    void *data;
    struct VosListNode *next;
} VosListNode;

typedef struct VosList {
    VosListNode *head;
} VosList;

static VosListNode *VOS_ListFront(VosList *list) {
    return list == NULL ? NULL : list->head;
}

static VosListNode *VOS_ListNext(VosListNode *node) {
    return node == NULL ? NULL : node->next;
}

static void *VOS_ListData(VosListNode *node) {
    return node == NULL ? NULL : node->data;
}

static void VOS_ListErase(VosList *list, VosListNode *target) {
    VosListNode *prev = NULL;
    VosListNode *cur;
    if (list == NULL || target == NULL) return;
    cur = list->head;
    while (cur != NULL) {
        if (cur == target) {
            if (prev == NULL) list->head = cur->next;
            else prev->next = cur->next;
            free(cur);
            return;
        }
        prev = cur;
        cur = cur->next;
    }
}
"""


def resolve_tool(name):
    env_key = f"MICRO_DRILLS_{name.upper()}"
    candidates = [
        os.environ.get(env_key),
        str(ROOT / "toolchain" / "mingw64" / "bin" / f"{name}.exe"),
        str(ROOT.parent / "toolchain" / "mingw64" / "bin" / f"{name}.exe"),
        shutil.which(name),
        shutil.which(f"{name}.exe"),
        str(ROOT / "toolchain" / "bin" / f"{name}.exe"),
        str(ROOT.parent / "toolchain" / "bin" / f"{name}.exe"),
        f"C:/mingw64/bin/{name}.exe",
        f"D:/mingw64/bin/{name}.exe",
        f"C:/msys64/mingw64/bin/{name}.exe",
        f"D:/msys64/mingw64/bin/{name}.exe",
        f"C:/msys64/ucrt64/bin/{name}.exe",
        f"D:/msys64/ucrt64/bin/{name}.exe",
        f"D:/BaiduNetdiskDownload/mingw64/bin/{name}.exe",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(Path(candidate))
    return ""


def decode_mi_string(value):
    return bytes(value, "utf-8").decode("unicode_escape")


def parse_mi_frame(line):
    result = {}
    for key in ["func", "file", "fullname", "line", "addr"]:
        match = re.search(rf'{key}="([^"]*)"', line)
        if match:
            result[key] = decode_mi_string(match.group(1))
    return result


def parse_mi_locals(line):
    pairs = re.findall(r'name="([^"]+)"(?:,[^{}]*?)?value="([^"]*)"', line)
    return [{"name": decode_mi_string(name), "value": decode_mi_string(value)} for name, value in pairs]


def extract_target_output(lines):
    out = []
    for line in lines:
        if not line.startswith('@'):
            if line and not re.match(r'^[\^*=~&]', line):
                out.append(line)
                if not line.endswith("\n"):
                    out.append("\n")
            continue
        match = re.match(r'@"(.*)"', line)
        if match:
            out.append(decode_mi_string(match.group(1)))
    return "".join(out)


def read_source_excerpt(file_path, line_no, radius=3):
    if not file_path or line_no is None:
        return ""
    try:
        lines = Path(file_path).read_text(encoding="utf-8").splitlines()
    except OSError:
        return ""
    start = max(1, line_no - radius)
    end = min(len(lines), line_no + radius)
    excerpt = []
    for idx in range(start, end + 1):
        marker = ">>" if idx == line_no else "  "
        excerpt.append(f"{marker} {idx:03d} | {lines[idx - 1]}")
    return "\n".join(excerpt)


def looks_like_function_code(code):
    return bool(re.search(r"\b[A-Za-z_][A-Za-z0-9_\s\*]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\([^;{}]*\)\s*\{", code))


def wrap_main_body(body):
    body = (body or "").strip() or "return 0;"
    if "return" not in body:
        body += "\nreturn 0;"
    lines = [
        "setvbuf(stdout, NULL, _IONBF, 0);",
        "setvbuf(stderr, NULL, _IONBF, 0);",
        "",
    ]
    lines.extend(body.splitlines())
    indented = "\n".join(f"    {line}" for line in lines)
    return f"int main(void) {{\n{indented}\n}}\n"


def ensure_main_wrapper(code, driver_code):
    code = (code or "").strip()
    driver_code = (driver_code or "").strip()

    if re.search(r"\bint\s+main\s*\(", code):
        return f"{PRELUDE}\n{code}\n"

    if "/*__USER_GLOBAL__*/" in driver_code:
        return f"{PRELUDE}\n{driver_code.replace('/*__USER_GLOBAL__*/', code)}\n"

    if "/*__USER_SNIPPET__*/" in driver_code:
        return f"{PRELUDE}\n{driver_code.replace('/*__USER_SNIPPET__*/', code)}\n"

    if "/*__USER_CODE__*/" in driver_code:
        return f"{PRELUDE}\n\n{wrap_main_body(driver_code.replace('/*__USER_CODE__*/', code))}\n"

    if looks_like_function_code(code):
        return f"{PRELUDE}\n{code}\n\n{wrap_main_body(driver_code)}\n"

    body = code or driver_code
    return f"{PRELUDE}\n\n{wrap_main_body(body)}\n"


def mi_quote_path(path):
    return str(path).replace("\\", "/")


class DebugSession:
    def __init__(self, source_path, exe_path, temp_dir):
        gdb = resolve_tool("gdb")
        if not gdb:
            raise RuntimeError("未找到 gdb，无法启动单步调试。")
        self.source_path = source_path
        self.exe_path = exe_path
        self.temp_dir = temp_dir
        self.stdout_log = ""
        self.proc = subprocess.Popen(
            [gdb, "--interpreter=mi2", "-q"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            encoding="utf-8",
            universal_newlines=True,
            bufsize=1,
        )
        self._output_queue = queue.Queue()
        self._reader_thread = threading.Thread(target=self._reader_loop, daemon=True)
        self._reader_thread.start()
        self._read_until_prompt()
        self.send("-gdb-set mi-async off")
        self.send(f'-file-exec-and-symbols "{mi_quote_path(self.exe_path)}"')
        self.send("-break-insert main")

    def _reader_loop(self):
        if self.proc.stdout is None:
            self._output_queue.put(None)
            return
        try:
            while True:
                ch = self.proc.stdout.read(1)
                if ch == "":
                    self._output_queue.put(None)
                    break
                self._output_queue.put(ch)
        except Exception:
            self._output_queue.put(None)

    def _consume_until_prompt(self, require_stop):
        prompt = "(gdb) "
        lines = []
        buffer = ""
        saw_stop = False
        while True:
            try:
                chunk = self._output_queue.get(timeout=30)
            except queue.Empty:
                raise RuntimeError("gdb response timed out")
            if chunk is None:
                if buffer:
                    line = buffer.rstrip("\r\n")
                    if line:
                        lines.append(line)
                if lines:
                    break
                raise RuntimeError("gdb exited unexpectedly")

            buffer += chunk
            while True:
                newline_pos = buffer.find("\n")
                prompt_pos = buffer.find(prompt)

                if prompt_pos != -1 and (newline_pos == -1 or prompt_pos < newline_pos):
                    before = buffer[:prompt_pos].rstrip("\r")
                    if before:
                        lines.append(before)
                        if before.startswith("*stopped") or before.startswith("^error"):
                            saw_stop = True
                    buffer = buffer[prompt_pos + len(prompt):]
                    if require_stop and not saw_stop:
                        continue
                    self.stdout_log += extract_target_output(lines)
                    return lines

                if newline_pos == -1:
                    break

                line = buffer[:newline_pos].rstrip("\r")
                buffer = buffer[newline_pos + 1:]
                if line:
                    lines.append(line)
                    if line.startswith("*stopped") or line.startswith("^error"):
                        saw_stop = True
        self.stdout_log += extract_target_output(lines)
        return lines

    def _read_until_prompt(self):
        return self._consume_until_prompt(False)

    def send(self, command):
        if self.proc.stdin is None:
            raise RuntimeError("gdb stdin unavailable")
        self.proc.stdin.write(f"{command}\n")
        self.proc.stdin.flush()
        return self._read_until_prompt()

    def send_exec(self, command):
        if self.proc.stdin is None or self.proc.stdout is None:
            raise RuntimeError("gdb stdio unavailable")
        self.proc.stdin.write(f"{command}\n")
        self.proc.stdin.flush()
        return self._consume_until_prompt(True)

    def snapshot(self, stop_lines=None):
        if stop_lines:
            for line in stop_lines:
                if line.startswith("^error"):
                    message_match = re.search(r'msg="([^"]*)"', line)
                    message = decode_mi_string(message_match.group(1)) if message_match else line
                    return {"status": "error", "reason": message, "stdout": self.stdout_log}
                if '*stopped,reason="exited-normally"' in line:
                    return {"status": "exited", "reason": "程序执行结束", "stdout": self.stdout_log}

        frame_lines = self.send("-stack-info-frame")
        locals_lines = self.send("-stack-list-variables --simple-values")

        frame_line = next((line for line in frame_lines if line.startswith("^done")), "")
        locals_line = next((line for line in locals_lines if line.startswith("^done")), "")
        frame = parse_mi_frame(frame_line)
        line_no = int(frame["line"]) if frame.get("line", "").isdigit() else None

        reason = "breakpoint-hit"
        if stop_lines:
            for line in stop_lines:
                if line.startswith("*stopped"):
                    match = re.search(r'reason="([^"]+)"', line)
                    if match:
                        reason = decode_mi_string(match.group(1))

        return {
            "status": "stopped",
            "reason": reason,
            "frame": frame,
            "locals": parse_mi_locals(locals_line),
            "stdout": self.stdout_log,
            "source_excerpt": read_source_excerpt(frame.get("fullname") or frame.get("file"), line_no),
        }

    def run(self):
        return self.snapshot(self.send_exec("-exec-run"))

    def next(self):
        return self.snapshot(self.send_exec("-exec-next"))

    def step(self):
        return self.snapshot(self.send_exec("-exec-step"))

    def continue_run(self):
        return self.snapshot(self.send_exec("-exec-continue"))

    def stop(self):
        try:
            self.send("-gdb-exit")
        except Exception:
            pass
        try:
            self.proc.wait(timeout=1)
        except Exception:
            try:
                self.proc.kill()
            except Exception:
                pass
        cleanup_temp_dir(self.temp_dir)


def compile_debug_binary(code, driver_code):
    gcc = resolve_tool("gcc")
    if not gcc:
        raise RuntimeError("未找到 gcc，无法编译调试代码。")

    temp_dir = tempfile.TemporaryDirectory(prefix="micro-drills-debug-")
    temp_root = Path(temp_dir.name)
    source_path = temp_root / "main.c"
    exe_path = temp_root / "main.exe"
    source_path.write_text(ensure_main_wrapper(code, driver_code), encoding="utf-8")

    result = subprocess.run(
        [gcc, "-g", "-O0", "-std=c11", str(source_path), "-o", str(exe_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
        universal_newlines=True,
    )
    if result.returncode != 0:
        temp_dir.cleanup()
        message = ((result.stdout or "") + "\n" + (result.stderr or "")).strip()
        raise RuntimeError(message or "编译失败")

    return source_path, exe_path, temp_dir


def cleanup_temp_dir(temp_dir):
    if temp_dir is None:
        return
    for _ in range(10):
        try:
            temp_dir.cleanup()
            break
        except Exception:
            time.sleep(0.1)


def normalize_judge_text(text):
    return re.sub(r"\s+", "", str(text or ""))


def run_binary(exe_path):
    result = subprocess.run(
        [str(exe_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
        errors="replace",
        universal_newlines=True,
        timeout=5,
        cwd=str(Path(exe_path).parent),
    )
    return result.stdout or "", result.stderr or "", result.returncode


def cleanup_sessions():
    with SESSIONS_LOCK:
        sessions = list(SESSIONS.values())
        SESSIONS.clear()
    for session in sessions:
        session.stop()


atexit.register(cleanup_sessions)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _json_response(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            if parsed.path == "/api/debug/capabilities":
                gcc = resolve_tool("gcc")
                gdb = resolve_tool("gdb")
                self._json_response(
                    {
                        "available": bool(gcc and gdb),
                        "gcc": gcc,
                        "gdb": gdb,
                        "mode": "python+gcc+gdb",
                    }
                )
                return
            return super().do_GET()
        except Exception as exc:
            traceback.print_exc()
            try:
                self._json_response({"message": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            except Exception:
                pass

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            body = self._read_json()
            if parsed.path == "/api/judge":
                self.handle_judge(body)
                return
            if parsed.path == "/api/debug/start":
                self.handle_debug_start(body)
                return
            if parsed.path == "/api/debug/step-over":
                self.handle_debug_command(body, "next")
                return
            if parsed.path == "/api/debug/step-into":
                self.handle_debug_command(body, "step")
                return
            if parsed.path == "/api/debug/continue":
                self.handle_debug_command(body, "continue_run")
                return
            if parsed.path == "/api/debug/stop":
                self.handle_debug_stop(body)
                return
            self._json_response({"message": "not found"}, HTTPStatus.NOT_FOUND)
        except Exception as exc:
            traceback.print_exc()
            self._json_response({"message": str(exc)}, HTTPStatus.BAD_REQUEST)

    def handle_debug_start(self, body):
        code = str(body.get("code", ""))
        driver_code = str(body.get("driver_code", ""))
        if not code.strip():
            raise RuntimeError("调试代码为空。")

        source_path, exe_path, temp_dir = compile_debug_binary(code, driver_code)
        session = DebugSession(source_path, exe_path, temp_dir)
        snapshot = session.run()
        session_id = uuid.uuid4().hex
        with SESSIONS_LOCK:
            SESSIONS[session_id] = session
        self._json_response({"session_id": session_id, "snapshot": snapshot})

    def handle_judge(self, body):
        code = str(body.get("code", ""))
        driver_code = str(body.get("driver_code", ""))
        expected_output = str(body.get("expected_output", ""))
        if not code.strip() and not driver_code.strip():
            raise RuntimeError("判题代码为空。")

        temp_dir = None
        actual_output = ""
        stderr_output = ""
        return_code = -1
        compile_error = False
        try:
            try:
                _, exe_path, temp_dir = compile_debug_binary(code, driver_code)
                actual_output, stderr_output, return_code = run_binary(exe_path)
            except Exception as exc:
                compile_error = True
                stderr_output = str(exc)
        finally:
            cleanup_temp_dir(temp_dir)

        normalized_actual = normalize_judge_text(actual_output)
        normalized_expected = normalize_judge_text(expected_output)
        passed = (not compile_error) and return_code == 0 and normalized_actual == normalized_expected

        self._json_response(
            {
                "passed": passed,
                "compile_error": compile_error,
                "actual_output": actual_output,
                "expected_output": expected_output,
                "normalized_actual": normalized_actual,
                "normalized_expected": normalized_expected,
                "return_code": return_code,
                "stderr": stderr_output,
            }
        )

    def handle_debug_command(self, body, action):
        session_id = str(body.get("session_id", ""))
        with SESSIONS_LOCK:
            session = SESSIONS.get(session_id)
        if not session:
            raise RuntimeError("调试会话不存在，请重新开始。")

        snapshot = getattr(session, action)()
        if snapshot.get("status") == "exited":
            with SESSIONS_LOCK:
                SESSIONS.pop(session_id, None)
            session.stop()
        self._json_response({"session_id": session_id, "snapshot": snapshot})

    def handle_debug_stop(self, body):
        session_id = str(body.get("session_id", ""))
        with SESSIONS_LOCK:
            session = SESSIONS.pop(session_id, None)
        if session:
            session.stop()
        self._json_response({"ok": True})


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    url = f"http://{HOST}:{PORT}/index.html"
    print(f"Debug server running at {url}")
    if os.environ.get("MICRO_DRILLS_NO_BROWSER") != "1":
        try:
            webbrowser.open(url)
        except Exception:
            pass
    server.serve_forever()


if __name__ == "__main__":
    main()
