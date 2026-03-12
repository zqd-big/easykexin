import fs from "node:fs";

const file = "data/questions.json";
const questions = JSON.parse(fs.readFileSync(file, "utf8"));

const algoNameMap = {
  array_enum: "数组枚举模板",
  queue_basic: "队列基础操作",
  stack_basic: "栈基础操作",
  linked_list: "链表指针操作",
  hash_map: "哈希/Map 频次统计",
  tree_dfs: "树 DFS 模板",
  graph_bfs: "图 BFS 模板",
  sliding_window: "滑窗窗口维护",
  two_pointers: "双指针收缩模板",
  prefix_sum: "前缀和区间查询",
  recursion: "递归终止条件练习",
  backtracking: "回溯框架练习",
  divide_conquer: "分治拆分与合并",
  binary_search: "二分边界查找",
  greedy: "贪心局部最优选择"
};

const extVosFnMap = {
  ext_vos_vosvector: "VosVector",
  ext_vos_voslist: "VosList",
  ext_vos_vosmap: "VosMap",
  ext_vos_vosprique: "VosPriQue",
  ext_vos_voshash: "VosHash",
  ext_vos_vosvectorsort: "VosVectorSort",
  ext_vos_vosmapfreq: "VosMapFreq",
  ext_vos_vospriquedispatch: "VosPriQueDispatch"
};

const detailedFix = {
  bt_subset_unique_once: {
    title: "回溯9型-子集（无重不可复选）",
    brief: "nums 元素唯一、每个元素最多使用一次，输出全部子集。",
    skill_tags: ["回溯", "子集", "无重不可复选"],
    input_example: "nums=[1,2,3]",
    expected_output: "[[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]",
    starter_code: "void dfs(int *nums,int n,int idx){ /* TODO */ }",
    explanation: "子集题在进入节点时即可收集答案。",
    common_mistakes: ["漏收集空集", "idx 不前进导致重复"]
  },
  bt_comb_sum_unique_once: {
    title: "回溯9型-组合求和（无重不可复选）",
    brief: "nums 元素唯一、每个元素最多使用一次，求和为 target 的组合。",
    skill_tags: ["回溯", "组合", "无重不可复选"],
    input_example: "nums=[2,3,6,7], target=7",
    expected_output: "[[7]]",
    starter_code: "void dfs(int *nums,int n,int idx,int remain){ /* TODO */ }",
    explanation: "不可复选的关键是递归参数传 i+1。",
    common_mistakes: ["把 i+1 写成 i", "remain<0 不剪枝"]
  },
  bt_perm_unique_once: {
    title: "回溯9型-排列（无重不可复选）",
    brief: "nums 元素唯一、每个元素最多使用一次，输出全排列。",
    skill_tags: ["回溯", "排列", "无重不可复选"],
    input_example: "nums=[1,2,3]",
    expected_output: "6 个排列",
    starter_code: "void dfs(int *nums,int n){ /* TODO: used[] */ }",
    explanation: "排列使用 used[]，而不是 start 下标。",
    common_mistakes: ["回溯时没恢复 used", "把排列写成组合"]
  },
  bt_subset_dup_once: {
    title: "回溯9型-子集（有重不可复选）",
    brief: "nums 可重复、每个元素最多使用一次，输出去重子集。",
    skill_tags: ["回溯", "子集", "有重不可复选", "去重"],
    input_example: "nums=[1,2,2]",
    expected_output: "[[],[1],[2],[1,2],[2,2],[1,2,2]]",
    starter_code: "// TODO: 先排序，再做同层去重",
    explanation: "去重条件是 i>idx 且 nums[i]==nums[i-1]。",
    common_mistakes: ["写成 i>0 导致跨层误杀", "忘记先排序"]
  },
  bt_comb_sum_dup_once: {
    title: "回溯9型-组合求和（有重不可复选）",
    brief: "nums 可重复、每个元素最多使用一次，输出去重组合和。",
    skill_tags: ["回溯", "组合", "有重不可复选", "去重"],
    input_example: "nums=[2,5,2,1,2], target=7",
    expected_output: "[[1,2,2,2],[2,5]]",
    starter_code: "// TODO: sort + 同层去重 + i+1 递归",
    explanation: "这是最典型的“排序+去重+不可复选”组合题。",
    common_mistakes: ["去重条件层级写错", "递归错误传 i"]
  },
  bt_perm_dup_once: {
    title: "回溯9型-排列（有重不可复选）",
    brief: "nums 可重复、每个元素最多使用一次，输出去重排列。",
    skill_tags: ["回溯", "排列", "有重不可复选", "去重"],
    input_example: "nums=[1,1,2]",
    expected_output: "[[1,1,2],[1,2,1],[2,1,1]]",
    starter_code: "// TODO: sort + used[] + 同层剪枝",
    explanation: "排列去重条件依赖“前一个相同值是否已被使用”。",
    common_mistakes: ["去重条件写反", "未排序导致去重失效"]
  },
  bt_subset_unique_repeat: {
    title: "回溯9型-子集（无重可复选）",
    brief: "nums 元素唯一、允许重复选，生成长度<=k 的子集序列。",
    skill_tags: ["回溯", "子集", "无重可复选"],
    input_example: "nums=[2,3], k=3",
    expected_output: "如 [2,2]、[2,3]、[3,3] 等",
    starter_code: "// TODO: 可复选时下一层仍从 i 开始",
    explanation: "可复选与不可复选只差递归参数 i / i+1。",
    common_mistakes: ["写成 i+1 导致不可复选", "未限制长度上界"]
  },
  bt_comb_sum_unique_repeat: {
    title: "回溯9型-组合求和（无重可复选）",
    brief: "nums 元素唯一、允许重复选，求和为 target 的组合。",
    skill_tags: ["回溯", "组合", "无重可复选"],
    input_example: "nums=[2,3,6,7], target=7",
    expected_output: "[[2,2,3],[7]]",
    starter_code: "// TODO: 递归参数传 i，并做 remain 剪枝",
    explanation: "这是可复选组合模板：dfs(i, remain-a[i])。",
    common_mistakes: ["写成 i+1", "排序后仍未利用 break 剪枝"]
  },
  bt_perm_unique_repeat: {
    title: "回溯9型-排列（无重可复选）",
    brief: "nums 元素唯一、允许重复选，输出长度 k 的排列序列。",
    skill_tags: ["回溯", "排列", "无重可复选"],
    input_example: "nums=[1,2], k=3",
    expected_output: "8 个长度为 3 的序列",
    starter_code: "// TODO: 每层均可从 0..n-1 选择",
    explanation: "可复选排列不需要 used[]。",
    common_mistakes: ["错误引入 used[]", "终止条件写错"]
  },
  dfs_traversal_collect_leaves: {
    title: "DFS-遍历思维：收集叶子路径",
    brief: "维护 path，从 root 到 leaf 收集全部路径。",
    skill_tags: ["DFS", "遍历思维", "树"],
    input_example: "二叉树 root",
    expected_output: "所有根到叶路径",
    explanation: "遍历思维强调过程状态维护与回溯恢复。",
    common_mistakes: ["忘记 path_pop()", "叶子判定时机错误"]
  },
  dfs_traversal_component_count: {
    title: "DFS-遍历思维：连通块计数",
    brief: "在网格中用 DFS 染色，统计连通块数量。",
    skill_tags: ["DFS", "遍历思维", "图"],
    input_example: "grid 0/1",
    expected_output: "连通块个数",
    explanation: "典型模式是“外层枚举起点 + 内层 DFS 扩展”。",
    common_mistakes: ["没有及时标记访问", "边界判断不完整"]
  },
  dfs_divide_tree_height: {
    title: "DFS-分解思维：树高度",
    brief: "返回子问题结果：height(root)=max(hL,hR)+1。",
    skill_tags: ["DFS", "分解思维", "树"],
    input_example: "二叉树 root",
    expected_output: "最大深度",
    explanation: "分解思维关注函数返回值，不依赖全局路径状态。",
    common_mistakes: ["空节点返回值写错", "混用遍历式全局变量"]
  },
  dfs_divide_balanced_tree: {
    title: "DFS-分解思维：平衡二叉树判断",
    brief: "递归返回子树高度（或 -1），判断整树是否平衡。",
    skill_tags: ["DFS", "分解思维", "树"],
    input_example: "二叉树 root",
    expected_output: "true/false",
    starter_code: "int check(Node *x){ /* 返回高度或 -1 */ }",
    explanation: "核心是“分解 + 失败哨兵值”模式。",
    common_mistakes: ["发现 -1 后没立即返回", "混用遍历式写法"]
  },
  bs_lcro_first_ge: {
    title: "二分边界-左闭右开 [l,r) 找第一个 >= target",
    brief: "实现 lower_bound，区间不变量采用 [l,r)。",
    skill_tags: ["二分", "左闭右开", "边界"],
    explanation: "区间收缩到 l==r 时，答案落在 l。",
    common_mistakes: ["r 初始化为 n-1", "while 条件写成 <="]
  },
  bs_lcro_first_gt: {
    title: "二分边界-左闭右开 [l,r) 找第一个 > target",
    brief: "实现 upper_bound，区间不变量采用 [l,r)。",
    skill_tags: ["二分", "左闭右开", "边界"],
    explanation: "与 lower_bound 仅判定条件不同。",
    common_mistakes: ["误用 >= 条件", "边界更新方向写反"]
  },
  bs_lcrc_last_le: {
    title: "二分边界-左闭右闭 [l,r] 找最后一个 <= target",
    brief: "返回最后一个 <=target 的下标，不存在返回 -1。",
    skill_tags: ["二分", "左闭右闭", "边界"],
    explanation: "闭区间写法常用 ans 记录当前可行解。",
    common_mistakes: ["遗漏 ans 默认值", "while 条件写错"]
  },
  bs_lcrc_first_ge: {
    title: "二分边界-左闭右闭 [l,r] 找第一个 >= target",
    brief: "返回第一个 >=target 的下标，不存在返回 n。",
    skill_tags: ["二分", "左闭右闭", "边界"],
    explanation: "本质仍是 lower_bound，只是区间模型不同。",
    common_mistakes: ["没设置 ans=n", "r 更新为 m 导致死循环"]
  },
  bs_locr_find_peak: {
    title: "二分边界-左开右闭 (l,r] 峰值查找",
    brief: "使用 (l,r] 模板在山峰数组中定位峰顶。",
    skill_tags: ["二分", "左开右闭", "边界"],
    explanation: "该模板适合“答案必在右闭区间”的题型。",
    common_mistakes: ["m+1 越界", "循环条件误写"]
  },
  bs_template_compare: {
    title: "二分模板对照：三种区间写法互转",
    brief: "对比 [l,r)、[l,r]、(l,r] 三种写法并补全边界更新。",
    skill_tags: ["二分", "模板题", "边界"],
    input_example: "模板填空题",
    expected_output: "三种模板都能正确终止",
    starter_code: "// TODO: 补全每种模板的 while 条件和更新语句",
    answer_code: "[l,r): while(l<r)\n[l,r]: while(l<=r)\n(l,r]: while(l+1<r)\n并配套使用正确的 l/r 更新。",
    explanation: "重点是维护区间不变量，而不是死记代码。",
    common_mistakes: ["混用不同模板的更新规则", "退出条件与区间模型不匹配"]
  }
};

for (const q of questions) {
  if (q.id.startsWith("ext_iface_")) {
    const fn = q.id.replace("ext_iface_", "");
    q.title = `接口速练：${fn}`;
    q.brief = `围绕 ${fn} 完成 1 分钟微题。`;
    q.skill_tags = ["C接口", fn, "模板速练"];
    q.input_example = "见题干";
    q.expected_output = "见题干";
    q.starter_code = "/* TODO: 按题意实现 */";
    q.answer_code = "/* 参考实现：调用目标接口并处理边界 */";
    q.explanation = "重点训练接口签名、参数顺序与边界处理。";
    q.common_mistakes = ["参数顺序写反", "返回值与边界未校验"];
    q.mode = "template";
  }

  if (q.id.startsWith("ext_algo_")) {
    const key = q.id.replace("ext_algo_", "");
    const name = algoNameMap[key] ?? key;
    q.title = `算法速练：${name}`;
    q.brief = `补全“${name}”的核心代码。`;
    q.input_example = "见题干";
    q.expected_output = "见题干";
    q.starter_code = "/* TODO: 完成核心逻辑 */";
    q.answer_code = "/* 参考实现：最小可用模板 */";
    q.explanation = "目标是在短时间内写出正确模板与边界。";
    q.common_mistakes = ["边界条件遗漏", "状态更新顺序错误"];
  }

  if (q.id.startsWith("ext_vos_")) {
    const fn = extVosFnMap[q.id] ?? q.id.replace("ext_vos_", "");
    q.title = `VOS速练：${fn}`;
    q.brief = `使用 ${fn} 完成指定容器操作。`;
    q.skill_tags = ["VOS接口", fn, "容器"];
    q.input_example = "见题干";
    q.expected_output = "见题干";
    q.starter_code = "/* TODO: 使用 VOS 接口完成任务 */";
    q.answer_code = "/* 参考实现：创建容器、执行操作、释放资源 */";
    q.explanation = "重点在指针生命周期与资源释放时机。";
    q.common_mistakes = ["传入悬挂指针", "忘记 destroy/free"];
  }

  const fix = detailedFix[q.id];
  if (fix) {
    Object.assign(q, fix);
  }
}

fs.writeFileSync(file, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
console.log(`normalized: ${questions.length} questions`);
