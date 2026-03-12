import fs from "node:fs";

const path = "data/questions.json";
const questions = JSON.parse(fs.readFileSync(path, "utf8"));

const ifaceDefs = {
  qsort: {
    title: "接口速练：qsort 整数升序",
    brief: "为 int 数组编写比较函数并调用 qsort 升序排序。",
    input: "arr=[5,1,4,2]",
    output: "[1,2,4,5]",
    starter:
      "int cmp(const void *a, const void *b) {\n    /* TODO */\n}\n\nqsort(arr, n, sizeof(arr[0]), cmp);",
    answer:
      "int cmp(const void *a, const void *b) {\n    int x = *(const int *)a;\n    int y = *(const int *)b;\n    return (x > y) - (x < y);\n}"
  },
  bsearch: {
    title: "接口速练：bsearch 查找整数",
    brief: "在有序数组中使用 bsearch 查找目标值。",
    input: "arr=[1,3,5,8], target=5",
    output: "返回下标 2（找不到返回 -1）",
    starter:
      "int cmp_key(const void *key, const void *elem) {\n    /* TODO */\n}\n\nint find_idx(const int *arr, int n, int target) {\n    /* TODO */\n}",
    answer:
      "int cmp_key(const void *key, const void *elem) {\n    int k = *(const int *)key;\n    int e = *(const int *)elem;\n    return (k > e) - (k < e);\n}\n\nint find_idx(const int *arr, int n, int target) {\n    int *p = (int *)bsearch(&target, arr, (size_t)n, sizeof(int), cmp_key);\n    return p ? (int)(p - arr) : -1;\n}"
  },
  strcmp: {
    title: "接口速练：strcmp 比较",
    brief: "比较两个字符串字典序，返回值只看正负和 0。",
    input: "a=\"abc\", b=\"abd\"",
    output: "负数",
    starter: "int r = 0;\n/* TODO */",
    answer: "int r = strcmp(a, b);"
  },
  strcpy_s: {
    title: "接口速练：strcpy_s 安全拷贝",
    brief: "将 src 拷贝到 dst，并检查返回值。",
    input: "src=\"hello\"",
    output: "dst=\"hello\"",
    starter: "char dst[16] = {0};\n/* TODO */",
    answer: "errno_t rc = strcpy_s(dst, sizeof(dst), src);\nif (rc != 0) { /* handle */ }"
  },
  strncpy_s: {
    title: "接口速练：strncpy_s 限长拷贝",
    brief: "将 src 的前 n 个字符拷贝到 dst。",
    input: "src=\"network\", n=4",
    output: "dst=\"netw\"",
    starter: "char dst[16] = {0};\n/* TODO */",
    answer: "strncpy_s(dst, sizeof(dst), src, n);"
  },
  strstr: {
    title: "接口速练：strstr 子串定位",
    brief: "在日志中定位子串 \"ERROR\" 的首位置。",
    input: "line=\"[INFO]a[ERROR]b\"",
    output: "返回首位置下标",
    starter: "int pos = -1;\n/* TODO */",
    answer: "char *p = strstr(line, \"ERROR\");\nif (p) pos = (int)(p - line);"
  },
  strchr: {
    title: "接口速练：strchr 查首个字符",
    brief: "在字符串中定位首个 ',' 的位置。",
    input: "s=\"a,b,c\"",
    output: "下标 1",
    starter: "char *p = NULL;\n/* TODO */",
    answer: "char *p = strchr(s, ',');"
  },
  strrchr: {
    title: "接口速练：strrchr 查末个字符",
    brief: "在路径字符串中定位最后一个 '/'。",
    input: "s=\"/a/b/c.txt\"",
    output: "指向 \"/c.txt\"",
    starter: "char *p = NULL;\n/* TODO */",
    answer: "char *p = strrchr(s, '/');"
  },
  strtok_s: {
    title: "接口速练：strtok_s 分词",
    brief: "将 \"10,20,30\" 按逗号拆成三个 token。",
    input: "line=\"10,20,30\"",
    output: "[\"10\",\"20\",\"30\"]",
    starter:
      "char *ctx = NULL;\nchar *tok = strtok_s(line, \",\", &ctx);\nwhile (tok) {\n    /* TODO */\n    tok = strtok_s(NULL, \",\", &ctx);\n}",
    answer: "首次传原串，后续传 NULL，循环收集 token。"
  },
  strcat_s: {
    title: "接口速练：strcat_s 拼接字符串",
    brief: "把目录和文件名拼成完整路径。",
    input: "dir=\"/tmp\", file=\"/a.log\"",
    output: "\"/tmp/a.log\"",
    starter: "char out[64] = {0};\n/* TODO */",
    answer: "strcpy_s(out, sizeof(out), dir);\nstrcat_s(out, sizeof(out), file);"
  },
  sscanf_s: {
    title: "接口速练：sscanf_s 解析键值",
    brief: "从 \"id=17,mem=32\" 中解析 id 和 mem。",
    input: "line=\"id=17,mem=32\"",
    output: "id=17, mem=32",
    starter: "int id = 0, mem = 0;\n/* TODO */",
    answer: "if (sscanf_s(line, \"id=%d,mem=%d\", &id, &mem) != 2) { /* invalid */ }"
  },
  sprintf_s: {
    title: "接口速练：sprintf_s 格式化输出",
    brief: "将 id=3 格式化为 \"node-03\"。",
    input: "id=3",
    output: "node-03",
    starter: "char out[32] = {0};\n/* TODO */",
    answer: "sprintf_s(out, sizeof(out), \"node-%02d\", id);"
  },
  strtol: {
    title: "接口速练：strtol 进制转换",
    brief: "把 \"0x1f\" 转为十进制，并校验合法输入。",
    input: "text=\"0x1f\"",
    output: "31",
    starter: "char *end = NULL;\n/* TODO */",
    answer: "long v = strtol(text, &end, 0);\nif (end == text || *end != '\\0') { /* invalid */ }"
  },
  strtoll: {
    title: "接口速练：strtoll 64位转换",
    brief: "把长整数字符串转为 long long。",
    input: "text=\"922337203685477580\"",
    output: "long long 值",
    starter: "char *end = NULL;\n/* TODO */",
    answer: "long long v = strtoll(text, &end, 10);\nif (end == text || *end != '\\0') { /* invalid */ }"
  },
  bit_and: {
    title: "接口速练：按位与掩码判断",
    brief: "判断 flags 的第 n 位是否为 1。",
    input: "flags=10(1010b), n=1",
    output: "1",
    starter: "int on = 0;\n/* TODO */",
    answer: "int on = (flags & (1u << n)) != 0;"
  },
  bit_or: {
    title: "接口速练：按位或置位",
    brief: "将 flags 的第 n 位置 1。",
    input: "flags=0, n=3",
    output: "8",
    starter: "/* TODO */",
    answer: "flags |= (1u << n);"
  },
  bit_xor: {
    title: "接口速练：按位异或翻转",
    brief: "翻转 flags 的第 n 位。",
    input: "flags=8, n=3",
    output: "0",
    starter: "/* TODO */",
    answer: "flags ^= (1u << n);"
  },
  bit_not: {
    title: "接口速练：按位取反并截断",
    brief: "对 x 取反后仅保留低 8 位。",
    input: "x=0x0f",
    output: "0xf0",
    starter: "unsigned int y = 0;\n/* TODO */",
    answer: "unsigned int y = (~x) & 0xffu;"
  },
  left_shift: {
    title: "接口速练：左移乘幂",
    brief: "计算 x * 2^k。",
    input: "x=7, k=2",
    output: "28",
    starter: "int y = 0;\n/* TODO */",
    answer: "int y = x << k;"
  },
  right_shift: {
    title: "接口速练：右移除幂",
    brief: "对非负整数计算 x / 2^k。",
    input: "x=40, k=3",
    output: "5",
    starter: "int y = 0;\n/* TODO */",
    answer: "int y = x >> k;"
  }
};

const algoDefs = {
  array_enum: {
    title: "算法速练：数组枚举模板",
    brief: "遍历数组统计偶数个数。",
    input: "a=[1,2,3,4,6]",
    output: "3",
    starter: "int cnt_even(const int *a, int n) {\n    /* TODO */\n}",
    answer: "int cnt_even(const int *a, int n) {\n    int c = 0;\n    for (int i = 0; i < n; ++i) if ((a[i] & 1) == 0) ++c;\n    return c;\n}"
  },
  queue_basic: {
    title: "算法速练：队列基础操作",
    brief: "用环形数组实现 push/pop。",
    input: "cap=4, push 1,2,3, pop",
    output: "pop=1",
    starter: "int push(Q *q, int x) { /* TODO */ }\nint pop(Q *q, int *x) { /* TODO */ }",
    answer: "维护 head/tail/count，入队写 tail，出队读 head。"
  },
  stack_basic: {
    title: "算法速练：栈基础操作",
    brief: "判断括号串是否合法。",
    input: "s=\"([]){}\"",
    output: "true",
    starter: "int valid(const char *s) { /* TODO */ }",
    answer: "左括号入栈，右括号匹配栈顶，最后栈空即合法。"
  },
  linked_list: {
    title: "算法速练：链表指针操作",
    brief: "迭代反转单链表。",
    input: "1->2->3",
    output: "3->2->1",
    starter: "Node *reverse(Node *head) { /* TODO */ }",
    answer: "三指针 prev/cur/next 迭代反转。"
  },
  hash_map: {
    title: "算法速练：哈希/Map 频次统计",
    brief: "统计数组元素出现次数。",
    input: "[4,1,4,2]",
    output: "4:2,1:1,2:1",
    starter: "/* TODO: map[key]++ */",
    answer: "第一遍计数，第二遍按需求输出。"
  },
  tree_dfs: {
    title: "算法速练：树 DFS 模板",
    brief: "完成二叉树前序遍历。",
    input: "root=[1,2,3]",
    output: "[1,2,3]",
    starter: "void dfs(Node *x) { /* TODO */ }",
    answer: "if(!x) return; visit(x); dfs(x->left); dfs(x->right);"
  },
  graph_bfs: {
    title: "算法速练：图 BFS 模板",
    brief: "判断图中 s 与 t 是否连通。",
    input: "n=4, edges=[[0,1],[1,2]], s=0,t=2",
    output: "true",
    starter: "int connected(...) { /* TODO */ }",
    answer: "邻接表 + 队列 + visited，首次到达 t 即返回 true。"
  },
  sliding_window: {
    title: "算法速练：滑窗窗口维护",
    brief: "求和>=target 的最短子数组长度。",
    input: "a=[2,3,1,2,4,3], target=7",
    output: "2",
    starter: "int min_len(...) { /* TODO */ }",
    answer: "右指针扩张，满足后左指针收缩更新最优长度。"
  },
  two_pointers: {
    title: "算法速练：双指针收缩模板",
    brief: "有序数组原地去重并返回新长度。",
    input: "[1,1,2,2,3]",
    output: "3",
    starter: "int dedup(int *a, int n) { /* TODO */ }",
    answer: "fast 扫描，slow 写入新位置。"
  },
  prefix_sum: {
    title: "算法速练：前缀和区间查询",
    brief: "构建前缀和后 O(1) 回答区间和。",
    input: "a=[2,4,5,1], query=[1,3]",
    output: "10",
    starter: "void build(...){/*TODO*/}\nint sum(...){/*TODO*/}",
    answer: "pre[i+1]=pre[i]+a[i]，区间和=pre[r+1]-pre[l]。"
  },
  recursion: {
    title: "算法速练：递归终止条件",
    brief: "实现递归阶乘函数。",
    input: "n=5",
    output: "120",
    starter: "long long f(int n) { /* TODO */ }",
    answer: "return n<=1 ? 1 : (long long)n * f(n-1);"
  },
  backtracking: {
    title: "算法速练：回溯框架练习",
    brief: "输出 [1,2,3] 的全排列。",
    input: "[1,2,3]",
    output: "6 个排列",
    starter: "void dfs(...) { /* TODO: used[] + path */ }",
    answer: "做选择 -> 递归 -> 撤销选择。"
  },
  divide_conquer: {
    title: "算法速练：分治拆分与合并",
    brief: "实现归并排序核心 merge。",
    input: "[5,2,4,1]",
    output: "[1,2,4,5]",
    starter: "void merge_sort(...) { /* TODO */ }",
    answer: "递归分两半，merge 阶段双指针合并。"
  },
  binary_search: {
    title: "算法速练：二分边界查找",
    brief: "在有序数组中找第一个 >= target 的下标。",
    input: "a=[1,2,4,4,9], target=4",
    output: "2",
    starter: "int lower_bound(...) { /* TODO */ }",
    answer: "[l,r) 模板：while(l<r){...}"
  },
  greedy: {
    title: "算法速练：贪心局部最优选择",
    brief: "区间调度：选最多不重叠区间。",
    input: "[(1,3),(2,4),(3,5),(0,6)]",
    output: "2",
    starter: "int solve(...) { /* TODO */ }",
    answer: "按结束时间升序排序，贪心选择可接上的区间。"
  }
};

const vosDefs = {
  ext_vos_vosvector: {
    title: "VOS速练：VosVector 创建与插入",
    brief: "创建 VosVector 并 push [3,1,2]。",
    input: "arr=[3,1,2]",
    output: "vector 大小为 3",
    starter: "VosVector *vec = VOS_VectorCreate(sizeof(int), NULL);\n/* TODO */",
    answer: "for (int i = 0; i < 3; ++i) VOS_VectorPushBack(vec, &arr[i]);"
  },
  ext_vos_voslist: {
    title: "VOS速练：VosList 删除偶数",
    brief: "遍历 VosList 删除所有偶数元素。",
    input: "list=[1,2,3,4]",
    output: "list=[1,3]",
    starter: "/* TODO: 删除时注意先缓存 next */",
    answer: "遍历时先取 next，再按条件删除当前节点。"
  },
  ext_vos_vosmap: {
    title: "VOS速练：VosMap 基础读写",
    brief: "读取 key，不存在则写入默认值 0。",
    input: "key=\"latency\"",
    output: "map 中存在该 key",
    starter: "/* TODO: get -> put */",
    answer: "int *p=(int*)VOS_MapGet(map,key); if(!p){int z=0; VOS_MapPut(map,key,&z);}"
  },
  ext_vos_vosprique: {
    title: "VOS速练：VosPriQue 三重优先级",
    brief: "实现比较函数：剩余内存大优先，部署数少优先，id 小优先。",
    input: "A(left=64,vm=2,id=3), B(left=64,vm=1,id=8)",
    output: "B 优先",
    starter: "int MachineCmp(const void *a, const void *b) { /* TODO */ }",
    answer:
      "if (a->left != b->left) return b->left - a->left;\nif (a->vm != b->vm) return a->vm - b->vm;\nreturn a->id - b->id;"
  },
  ext_vos_voshash: {
    title: "VOS速练：VosHash 整数去重",
    brief: "用 VosHash 过滤重复整数。",
    input: "arr=[4,2,4,3,2]",
    output: "[4,2,3]",
    starter: "/* TODO: find + insert */",
    answer: "若 VOS_HashFind 为 NULL 则插入并写入结果。"
  },
  ext_vos_vosvectorsort: {
    title: "VOS速练：VosVector 排序",
    brief: "将 VosVector 中 int 升序排序。",
    input: "vec=[7,2,5]",
    output: "[2,5,7]",
    starter: "int cmp(const void *a,const void *b){/* TODO */}\n/* TODO: VOS_VectorSort */",
    answer: "cmp 返回三值比较；调用 VOS_VectorSort(vec, cmp)。"
  },
  ext_vos_vosmapfreq: {
    title: "VOS速练：VosMap 词频统计",
    brief: "统计字符串数组词频。",
    input: "[\"err\",\"warn\",\"err\"]",
    output: "err:2 warn:1",
    starter: "/* TODO: get 后 +1 或 put 1 */",
    answer: "不存在写 1，存在取值 +1 后回写。"
  },
  ext_vos_vospriquedispatch: {
    title: "VOS速练：VosPriQue 单次调度",
    brief: "取堆顶机器处理一个请求并回写优先队列。",
    input: "request=16",
    output: "返回分配机器 id 或 -1",
    starter: "/* TODO: top -> check -> pop/push */",
    answer: "top 查看后满足条件则 pop，再 push 更新后的机器状态。"
  }
};

for (const q of questions) {
  if (q.id.startsWith("ext_iface_")) {
    const fn = q.id.replace("ext_iface_", "");
    const d = ifaceDefs[fn];
    if (!d) continue;
    q.title = d.title;
    q.brief = d.brief;
    q.skill_tags = ["C接口", fn, "模板速练"];
    q.input_example = d.input;
    q.expected_output = d.output;
    q.starter_code = d.starter;
    q.answer_code = d.answer;
    q.explanation = `本题聚焦 ${fn} 的正确用法与边界处理。`;
    q.common_mistakes = ["参数顺序写反", "忽略返回值或边界条件"];
    q.mode = "template";
  }

  if (q.id.startsWith("ext_algo_")) {
    const key = q.id.replace("ext_algo_", "");
    const d = algoDefs[key];
    if (!d) continue;
    q.title = d.title;
    q.brief = d.brief;
    q.input_example = d.input;
    q.expected_output = d.output;
    q.starter_code = d.starter;
    q.answer_code = d.answer;
    q.explanation = "目标是在 1~3 分钟内回忆并写出可运行模板。";
    q.common_mistakes = ["边界条件遗漏", "状态更新顺序错误"];
    q.mode = "micro";
  }

  if (q.id.startsWith("ext_vos_")) {
    const d = vosDefs[q.id];
    if (!d) continue;
    const fn = (q.related_functions && q.related_functions[0]) || "VOS";
    q.title = d.title;
    q.brief = d.brief;
    q.skill_tags = ["VOS接口", fn, "容器"];
    q.input_example = d.input;
    q.expected_output = d.output;
    q.starter_code = d.starter;
    q.answer_code = d.answer;
    q.explanation = "重点训练 VOS 容器接口调用顺序和内存生命周期。";
    q.common_mistakes = ["传入悬挂指针", "忘记销毁或释放资源"];
    q.mode = "micro";
  }
}

fs.writeFileSync(path, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
console.log("hydrated ext questions");
