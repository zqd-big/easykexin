import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "questions.json"
PORTABLE_DATA_PATH = ROOT / "portable" / "questions-data.js"
HINTS_PATH = ROOT / "portable" / "interface-hints.js"


def patch_question(by_id, qid, **updates):
    by_id[qid].update(updates)


def main():
    questions = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    by_id = {q["id"]: q for q in questions}

    patch_question(
        by_id,
        "tpl_vosvector_push_sort",
        title="VosVector 插入与排序",
        brief="使用 VOS_VectorCreate 创建 int Vector，把 arr 中元素 PushBack 后调用 VOS_VectorSort 升序排序。",
        starter_code="VosVector *vec = VOS_VectorCreate(sizeof(int));\n// TODO: push arr[0..n) 后调用 VOS_VectorSort(vec, cmp_int)",
        answer_code=(
            "VosVector *vec = VOS_VectorCreate(sizeof(int));\n"
            "for (int i = 0; i < n; ++i) {\n"
            "    VOS_VectorPushBack(vec, &arr[i]);\n"
            "}\n"
            "VOS_VectorSort(vec, cmp_int);"
        ),
        explanation="真实头文件中 VOS_VectorCreate 只有 itemSize 一个参数；PushBack 会拷贝 data 指向的元素内容；读取结果应使用 VOS_VectorAt / VOS_VectorSize，不要访问内部字段。",
        common_mistakes=[
            "把 VOS_VectorCreate 写成两个参数",
            "PushBack 传值而不是传元素地址",
            "直接访问 vec->size 或 vec->data",
            "比较函数返回方向写反",
        ],
        related_functions=[
            "VOS_VectorCreate",
            "VOS_VectorPushBack",
            "VOS_VectorSort",
            "VOS_VectorSize",
            "VOS_VectorAt",
        ],
    )

    patch_question(
        by_id,
        "ext_vos_vosvector",
        title="VOS速练：VosVector 创建与插入",
        brief="创建 int 类型 VosVector，把数组 [3,1,2] 逐个插入，最后 Size 应为 3。",
        starter_code="VosVector *vec = VOS_VectorCreate(sizeof(int));\n/* TODO: push arr[0..n) */",
        answer_code=(
            "VosVector *vec = VOS_VectorCreate(sizeof(int));\n"
            "for (int i = 0; i < n; ++i) {\n"
            "    VOS_VectorPushBack(vec, &arr[i]);\n"
            "}"
        ),
        explanation="VOS_VectorCreate 的参数是单个元素大小；VOS_VectorPushBack 接收元素地址，并把该地址指向的内容拷贝进容器。",
        common_mistakes=[
            "误写成 VOS_VectorCreate(sizeof(int), NULL)",
            "PushBack 传 arr[i] 而不是 &arr[i]",
            "用内部字段判断 size",
        ],
        related_functions=["VOS_VectorCreate", "VOS_VectorPushBack", "VOS_VectorSize"],
    )

    patch_question(
        by_id,
        "ext_vos_vosvectorsort",
        title="VOS速练：VosVector 排序",
        brief="给出 int 比较函数，调用 VOS_VectorSort 将 VosVector 升序排序。",
        starter_code=(
            "int cmp_int(const void *a, const void *b) {\n"
            "    /* TODO */\n"
            "}\n"
            "/* TODO: VOS_VectorSort(vec, cmp_int) */"
        ),
        answer_code=(
            "int cmp_int(const void *a, const void *b) {\n"
            "    int x = *(const int *)a;\n"
            "    int y = *(const int *)b;\n"
            "    return (x > y) - (x < y);\n"
            "}\n\n"
            "VOS_VectorSort(vec, cmp_int);"
        ),
        explanation="VOS_VectorSort 的比较函数形态和 qsort 一致：参数是元素地址，升序时 x<y 返回负数。",
        common_mistakes=[
            "比较函数把 const void * 当成 int 直接比较",
            "升序返回方向写反",
            "排序前没有把元素 push 进 vector",
        ],
        related_functions=["VOS_VectorSort", "VOS_VectorCreate", "VOS_VectorPushBack"],
    )

    new_questions = [
        {
            "id": "vos_vector_size_after_push",
            "title": "VosVector-插入后获取 Size",
            "brief": "创建 int Vector，把 arr[0..n) 插入后，用 VOS_VectorSize 输出元素个数。",
            "skill_tags": ["VOS接口", "VosVector", "容器基础"],
            "source_problem": "vos_vector_header_drills",
            "difficulty": 1,
            "expected_time_seconds": 60,
            "input_example": "arr=[4,8,15]",
            "expected_output": "size=3",
            "starter_code": "VosVector *vec = VOS_VectorCreate(sizeof(int));\nfor (int i = 0; i < n; ++i) {\n    /* TODO */\n}",
            "answer_code": "VosVector *vec = VOS_VectorCreate(sizeof(int));\nfor (int i = 0; i < n; ++i) {\n    VOS_VectorPushBack(vec, &arr[i]);\n}",
            "explanation": "VOS_VectorPushBack 会复制 data 指向的元素内容；Size 用 VOS_VectorSize 查询。",
            "common_mistakes": [
                "Create 多传 freeFunc 参数",
                "PushBack 传 arr[i] 值",
                "用 vec->size 访问不透明结构",
            ],
            "related_functions": ["VOS_VectorCreate", "VOS_VectorPushBack", "VOS_VectorSize"],
            "language": "C",
            "mode": "micro",
            "step_order": None,
        },
        {
            "id": "vos_vector_at_read_second",
            "title": "VosVector-使用 At 读取元素",
            "brief": "Vector 中已有 [4,8,15]，用 VOS_VectorAt 读取下标 1 的元素并打印。",
            "skill_tags": ["VOS接口", "VosVector", "随机访问"],
            "source_problem": "vos_vector_header_drills",
            "difficulty": 1,
            "expected_time_seconds": 60,
            "input_example": "vec=[4,8,15], index=1",
            "expected_output": "8",
            "starter_code": "int *p = (int *)VOS_VectorAt(vec, 1);\n/* TODO: 判空并输出 */",
            "answer_code": "int *p = (int *)VOS_VectorAt(vec, 1);\nif (p != NULL) {\n    printf(\"%d\\n\", *p);\n}",
            "explanation": "VOS_VectorAt 返回元素所在地址；index 必须小于 VOS_VectorSize。返回值可能为 NULL。",
            "common_mistakes": ["忘记判空", "把返回值当成 int 而不是 int *", "下标越界"],
            "related_functions": ["VOS_VectorAt", "VOS_VectorSize"],
            "language": "C",
            "mode": "micro",
            "step_order": None,
        },
        {
            "id": "vos_vector_erase_shift",
            "title": "VosVector-Erase 后元素前移",
            "brief": "Vector 中已有 [3,1,2]，删除下标 1，输出剩余元素 [3,2]。",
            "skill_tags": ["VOS接口", "VosVector", "删除"],
            "source_problem": "vos_vector_header_drills",
            "difficulty": 2,
            "expected_time_seconds": 90,
            "input_example": "vec=[3,1,2], erase index=1",
            "expected_output": "[3,2]",
            "starter_code": "/* TODO: 删除下标 1 */",
            "answer_code": "VOS_VectorErase(vec, 1);",
            "explanation": "VOS_VectorErase 删除指定下标，后续元素会前移，不会留下空洞。成功返回 VOS_OK。",
            "common_mistakes": ["误以为删除后有空洞", "删除前不检查 index < Size", "把返回值当成被删元素"],
            "related_functions": ["VOS_VectorErase", "VOS_VectorAt", "VOS_VectorSize"],
            "language": "C",
            "mode": "micro",
            "step_order": None,
        },
        {
            "id": "vos_vector_sort_then_search",
            "title": "VosVector-排序后 Search",
            "brief": "实现 has_value：先排序 Vector，再用 VOS_VectorSearch 判断 target 是否存在。",
            "skill_tags": ["VOS接口", "VosVector", "排序", "查找"],
            "source_problem": "vos_vector_header_drills",
            "difficulty": 3,
            "expected_time_seconds": 120,
            "input_example": "vec=[7,2,5], target=5",
            "expected_output": "found",
            "starter_code": (
                "int cmp_int(const void *a, const void *b) {\n"
                "    int x = *(const int *)a;\n"
                "    int y = *(const int *)b;\n"
                "    return (x > y) - (x < y);\n"
                "}\n\n"
                "int has_value(VosVector *vec, int target) {\n"
                "    /* TODO */\n"
                "    return 0;\n"
                "}"
            ),
            "answer_code": (
                "int cmp_int(const void *a, const void *b) {\n"
                "    int x = *(const int *)a;\n"
                "    int y = *(const int *)b;\n"
                "    return (x > y) - (x < y);\n"
                "}\n\n"
                "int has_value(VosVector *vec, int target) {\n"
                "    VOS_VectorSort(vec, cmp_int);\n"
                "    return VOS_VectorSearch(vec, &target, cmp_int) != NULL;\n"
                "}"
            ),
            "explanation": "头文件明确要求 Search 前必须先 Sort，否则查找结果没有意义。Search 的 data 参数也要传目标值地址。",
            "common_mistakes": ["Search 前没有排序", "target 传值而不是 &target", "Sort 和 Search 使用了不一致的比较函数"],
            "related_functions": ["VOS_VectorSort", "VOS_VectorSearch"],
            "language": "C",
            "mode": "micro",
            "step_order": None,
        },
        {
            "id": "vos_vector_destroy_freefunc",
            "title": "VosVector-Destroy 释放元素资源",
            "brief": "Vector 存的是 char*，写 freeFunc 释放每个字符串指针。",
            "skill_tags": ["VOS接口", "VosVector", "资源释放"],
            "source_problem": "vos_vector_header_drills",
            "difficulty": 3,
            "expected_time_seconds": 120,
            "input_example": "vec=[\"aa\",\"bb\"]",
            "expected_output": "destroyed",
            "starter_code": "void free_string_item(void *item) {\n    /* TODO */\n}",
            "answer_code": "void free_string_item(void *item) {\n    char **p = (char **)item;\n    free(*p);\n}",
            "explanation": "Vector 保存的是 char* 这个元素本身，因此 freeFunc 收到的是元素地址，即 char**。Destroy 会遍历元素调用 freeFunc 后释放容器。",
            "common_mistakes": ["把 item 直接当 char* free", "Destroy 传 NULL 导致字符串资源泄漏", "释放后继续使用元素指针"],
            "related_functions": ["VOS_VectorDestroy", "VOS_VectorClear"],
            "language": "C",
            "mode": "micro",
            "step_order": None,
        },
    ]

    for item in new_questions:
        if item["id"] in by_id:
            by_id[item["id"]].update(item)
        else:
            questions.append(item)
            by_id[item["id"]] = item

    DATA_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PORTABLE_DATA_PATH.write_text(
        "window.QUESTIONS = " + json.dumps(questions, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )

    hints = HINTS_PATH.read_text(encoding="utf-8")
    start = hints.index("  vosvector: {")
    end = hints.index("  vosmap: {", start)
    replacement = '''  vosvector: {
    name: "VosVector",
    signature: "VOS_VectorCreate(size_t itemSize); / VOS_VectorPushBack(VosVector *vector, const void *data); / VOS_VectorAt(const VosVector *vector, size_t index); / VOS_VectorSize(const VosVector *vector); / VOS_VectorErase(VosVector *vector, size_t index); / VOS_VectorSort(VosVector *vector, VosDataCmpFunc cmpFunc); / VOS_VectorSearch(const VosVector *vector, const void *data, VosDataCmpFunc cmpFunc); / VOS_VectorDestroy(VosVector *vector, VosFreeFunc freeFunc);",
    summary: "顺序容器，元素按 itemSize 拷贝存储；真实头文件里 Vector 控制块是不透明结构，使用时不要访问内部字段。",
    params: [
      { name: "itemSize", meaning: "单个元素的字节数，例如 sizeof(int)。" },
      { name: "data", meaning: "待插入元素的地址，PushBack 会拷贝 data 指向的内容。" },
      { name: "index", meaning: "元素下标，必须小于 VOS_VectorSize(vector)。" },
      { name: "cmpFunc", meaning: "比较函数，形态类似 qsort；Sort 和 Search 要使用同一排序规则。" },
      { name: "freeFunc", meaning: "Clear/Destroy 时释放元素内部资源；存纯值可传 NULL。" }
    ],
    notes: [
      "VOS_VectorCreate 只有一个参数，不是 VOS_VectorCreate(sizeof(T), NULL)。",
      "VOS_VectorAt 返回元素地址，失败返回 NULL。",
      "VOS_VectorErase 会让后续元素前移，不会留下空洞。",
      "调用 VOS_VectorSearch 前必须先调用 VOS_VectorSort。",
      "如果元素里保存指针，Destroy/Clear 时要传 freeFunc 释放元素内部资源。"
    ]
  },
'''
    HINTS_PATH.write_text(hints[:start] + replacement + hints[end:], encoding="utf-8")


if __name__ == "__main__":
    main()
