# 回溯 / DFS / 二分 覆盖矩阵

## 1. 回溯 9 型（已覆盖）
- 1) 子集（无重不可复选）: `bt_subset_unique_once`
- 2) 组合（无重不可复选）: `bt_comb_sum_unique_once`
- 3) 排列（无重不可复选）: `bt_perm_unique_once`
- 4) 子集（有重不可复选）: `bt_subset_dup_once`
- 5) 组合（有重不可复选）: `bt_comb_sum_dup_once`
- 6) 排列（有重不可复选）: `bt_perm_dup_once`
- 7) 子集（无重可复选）: `bt_subset_unique_repeat`
- 8) 组合（无重可复选）: `bt_comb_sum_unique_repeat`
- 9) 排列（无重可复选）: `bt_perm_unique_repeat`

说明：
- “不可复选”与“可复选”分别通过递归层参数 `i+1` 与 `i` 区分。
- “有重不可复选”均体现了排序后“同层去重”规则。

## 2. DFS 两种思维（已覆盖）
- 遍历思维：
  - `dfs_traversal_collect_leaves`（维护 path + 回溯恢复）
  - `dfs_traversal_component_count`（外层枚举起点 + 内层 flood）
- 分解思维：
  - `dfs_divide_tree_height`（返回子问题值）
  - `dfs_divide_balanced_tree`（返回高度/失败哨兵值）

## 3. 二分边界模板（已覆盖）
- 左闭右开 `[l,r)`:
  - `bs_lcro_first_ge`
  - `bs_lcro_first_gt`
- 左闭右闭 `[l,r]`:
  - `bs_lcrc_last_le`
  - `bs_lcrc_first_ge`
- 左开右闭 `(l,r]`:
  - `bs_locr_find_peak`
- 模板互转练习：
  - `bs_template_compare`

## 4. 当前规模
- 题库总量：85 题
- 本轮新增：19 题（回溯 9 + DFS 4 + 二分 6）
