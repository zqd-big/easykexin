import json
import re
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "questions.json"
PORTABLE = ROOT / "portable" / "questions-data.js"

QUALIFIERS = {"const", "volatile", "static", "struct", "enum", "union", "unsigned", "signed", "long", "short"}
TYPE_WORDS = {
    "int",
    "char",
    "void",
    "size_t",
    "long",
    "short",
    "unsigned",
    "signed",
    "float",
    "double",
    "bool",
    "Node",
    "Q",
    "Machine",
    "User",
    "Interval",
    "Task",
    "PktNode",
    "ArpNode",
    "IntNode",
    "WordNode",
    "MacNode",
    "VosVector",
    "VosMap",
    "VosHash",
    "VosPriQue",
    "VosListNode",
}
FUNC_RE = re.compile(r"(?P<ret>\b[A-Za-z_][A-Za-z0-9_\s\*]*?)\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\((?P<params>[^;{}()]*)\)\s*\{", re.S)
GEN_COMMENT_RE = re.compile(
    r"^\s*//\s*(提示|输入示例|期望输出|接口契约|代码形态|return|[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*/[A-Za-z_][A-Za-z0-9_]*)："
)


def strip_generated_hints(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not GEN_COMMENT_RE.match(line)) + ("\n" if text.endswith("\n") else "")


def split_params(text: str) -> List[str]:
    text = text.strip()
    if not text or text == "void":
        return []
    return [item.strip() for item in text.split(",") if item.strip()]


def param_name(param: str) -> str:
    cleaned = re.sub(r"\[[^\]]*\]", " ", param)
    ids = re.findall(r"\b[A-Za-z_][A-Za-z0-9_]*\b", cleaned)
    candidates = [item for item in ids if item not in QUALIFIERS and item not in TYPE_WORDS]
    return candidates[-1] if candidates else (ids[-1] if ids else param.strip())


def short(text: str, limit: int = 92) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def comment_lines(prefix: str, text: str) -> List[str]:
    if not text:
        return []
    out = []
    for idx, line in enumerate(str(text).splitlines() or [""]):
        tag = prefix if idx == 0 else " " * len(prefix)
        out.append(f"// {tag}{line}")
    return out


def is_comparator(question: dict, fname: str) -> bool:
    lname = fname.lower()
    if "cmp" in lname or lname.endswith("compare") or lname.startswith("compare"):
        return True
    text = (question.get("title", "") + " " + question.get("brief", "")).lower()
    return "比较函数" in text and lname not in {"has_value", "find_idx", "solve"}


def describe_param(name: str, raw: str, question: dict, fname: str) -> str:
    low = name.lower()
    if is_comparator(question, fname) and low in {"a", "b", "pa", "pb", "key", "elem"}:
        if low == "key":
            return "bsearch 的查找键地址；先转成正确类型指针再取值。"
        if low == "elem":
            return "bsearch 当前数组元素地址；先转成正确类型指针再取值。"
        return "比较函数入参，实际指向数组元素；先转成正确类型指针再取值。"
    if low in {"vec", "vector", "list", "map", "hash", "pq"}:
        return "VOS/哈希容器句柄；通过对应接口访问，不要假设内部字段布局。"
    if low in {"line", "cmd", "text", "s", "str", "input", "buf", "pathname", "path"}:
        return "输入字符串；只读取内容，不要越界访问，若参数是 const 不要直接修改。"
    if low in {"tokens", "words"}:
        return "输入 token/字符串数组；按下标顺序遍历。"
    if low in {"arr", "a", "nums", "events", "traits", "communities", "pktids", "instructions"}:
        return "输入数组；配合 n/m 等长度参数使用。"
    if low in {"n", "m", "rows", "cols", "nodecount", "filesize", "tasknum", "relationssize", "instructionssize"}:
        return "输入规模/数组长度；循环边界必须严格使用该值。"
    if low == "k":
        return "数量或目标长度参数；按题意作为循环上限或限制条件。"
    if low in {"target", "remain", "limit", "value", "id", "ip", "pktid", "vlan_id", "to", "start", "end", "off", "len", "time", "msgnum"}:
        return "输入目标值/边界值；按题意参与判断或计算。"
    if low in {"out", "ans", "pre", "dist", "running", "cachenext", "nextpos", "subsum", "top"} or low.startswith("out"):
        return "输出/状态数组或指针；把结果写入这里，写入前注意容量和下标。"
    if low in {"max_n", "cap", "capacity", "cachedpktcap", "peripcap", "arpcap"}:
        return "容量限制参数；写入或缓存前必须检查，避免越界或超额。"
    if low in {"root", "head", "node", "x"}:
        return "当前节点/链表头/树根指针；使用前注意 NULL。"
    if low in {"left", "right", "l", "r", "a1", "a2", "b1", "b2"}:
        return "区间端点或比较对象；注意开闭区间和更新方向。"
    if "void *" in raw:
        return "通用指针参数；先转成题目要求的具体类型再访问。"
    if "*" in raw:
        return "指针参数；使用前确认指向有效对象，输出参数需要写回调用者提供的内存。"
    return "按题意传入的参数；注意边界条件。"


def describe_return(ret: str, fname: str, question: dict) -> str:
    contract = question.get("function_contract") or {}
    if contract.get("returns"):
        return contract["returns"]
    ret_clean = " ".join(ret.replace("*", " * ").split())
    lname = fname.lower()
    if ret_clean == "void":
        return "无返回值；通过输出参数、全局状态或打印/容器操作体现结果。"
    if is_comparator(question, fname):
        return "比较结果；通常负数表示第一个元素排前，正数表示第二个元素排前，0 表示相等。"
    if lname.startswith(("is_", "valid", "connected", "has_", "cover_", "can_", "overlap", "exists")):
        return "返回 1/true 表示满足条件，返回 0/false 表示不满足。"
    if lname.startswith(("find", "choose", "lower_bound")) or "find" in lname:
        return "返回找到的位置/编号；找不到时按题意返回 -1、0 或 NULL。"
    if lname.startswith(("parse", "split", "merge", "dedup", "expand", "flush")):
        return "返回写入输出数组的元素个数、解析出的结果数量或处理数量。"
    if "min" in lname or "max" in lname or "solve" in lname or "need" in lname:
        return "返回题目要求的计算结果。"
    if "*" in ret_clean:
        return "返回指针结果；找不到或无效时通常返回 NULL。"
    return "返回题目要求的结果值；注意和输出参数的分工。"


def find_body_end(text: str, open_brace_index: int) -> int:
    depth = 0
    in_str = None
    escaped = False
    idx = open_brace_index
    while idx < len(text):
        ch = text[idx]
        nxt = text[idx + 1] if idx + 1 < len(text) else ""
        if in_str:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == in_str:
                in_str = None
        else:
            if ch in {'"', "'"}:
                in_str = ch
            elif ch == "/" and nxt == "/":
                j = text.find("\n", idx)
                idx = len(text) if j == -1 else j
            elif ch == "/" and nxt == "*":
                j = text.find("*/", idx + 2)
                idx = len(text) if j == -1 else j + 1
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return idx + 1
        idx += 1
    return len(text)


def select_function_match(text: str):
    matches = list(FUNC_RE.finditer(text))
    if not matches:
        return None
    for match in matches:
        if "TODO" in text[match.end() : find_body_end(text, match.end() - 1)]:
            return match
    return matches[0]


def build_function_hint(question: dict, match) -> List[str]:
    fname = match.group("name")
    ret = match.group("ret").strip()
    params = split_params(match.group("params"))
    contract = question.get("function_contract") or {}
    lines = []
    lines.extend(comment_lines("提示：", short(question.get("brief") or question.get("title"))))
    if question.get("input_example"):
        lines.extend(comment_lines("输入示例：", short(question.get("input_example"), 110)))
    if question.get("expected_output"):
        lines.extend(comment_lines("期望输出：", short(question.get("expected_output"), 110)))
    if contract.get("summary"):
        lines.extend(comment_lines("接口契约：", contract["summary"]))
    desc_by_name = {item.get("name"): item.get("description") for item in contract.get("params", []) if isinstance(item, dict)}
    for raw in params:
        name = param_name(raw)
        desc = desc_by_name.get(name) or describe_param(name, raw, question, fname)
        lines.extend(comment_lines(f"{name}：", desc))
    lines.extend(comment_lines("return：", describe_return(ret, fname, question)))
    return lines


def build_snippet_hint(question: dict) -> List[str]:
    lines = []
    lines.extend(comment_lines("提示：", short(question.get("brief") or question.get("title"))))
    if question.get("input_example"):
        lines.extend(comment_lines("输入示例：", short(question.get("input_example"), 110)))
    if question.get("expected_output"):
        lines.extend(comment_lines("期望输出：", short(question.get("expected_output"), 110)))
    lines.append("// 代码形态：这是片段题，只补 TODO 附近逻辑，不要额外定义 main。")
    return lines


def already_manual_hint(starter: str) -> bool:
    return "// line:" in starter or "// tokens:" in starter or "// ranges/k:" in starter or "// a/n:" in starter


def add_hint_to_function(starter: str, lines: List[str], match) -> str:
    pos = match.end()
    after = pos
    if starter.startswith("\r\n", after):
        after += 2
    elif starter.startswith("\n", after):
        after += 1
    indent_match = re.match(r"[ \t]*", starter[after:])
    indent = indent_match.group(0) if indent_match else "    "
    if not indent:
        indent = "    "
    block = "\n".join(indent + line for line in lines)
    return starter[:pos] + "\n" + block + "\n" + starter[after:]


def add_hint_to_snippet(starter: str, lines: List[str]) -> str:
    return "\n".join(lines) + "\n" + starter.lstrip("\n")


def main() -> None:
    questions = json.loads(DATA.read_text(encoding="utf-8"))
    for question in questions:
        starter = strip_generated_hints(question.get("starter_code") or "")
        if already_manual_hint(starter):
            question["starter_code"] = starter
            continue
        match = select_function_match(starter)
        question["starter_code"] = add_hint_to_function(starter, build_function_hint(question, match), match) if match else add_hint_to_snippet(starter, build_snippet_hint(question))

    text = json.dumps(questions, ensure_ascii=False, indent=2) + "\n"
    DATA.write_text(text, encoding="utf-8")
    PORTABLE.write_text("window.QUESTIONS = " + json.dumps(questions, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"updated {len(questions)} questions")


if __name__ == "__main__":
    main()
