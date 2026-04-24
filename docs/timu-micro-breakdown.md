# timu.txt 长题微题拆解

本次从 `timu.txt` 拆出 65 道微题，覆盖 20 个长题来源。

| 长题来源 | 微题数量 | 微题 |
| --- | ---: | --- |
| `classic_best_route` | 3 | classic_route_bfs_tie_weight, classic_route_build_directed_adj, classic_route_answer_unreachable |
| `classic_code_indent` | 2 | classic_indent_positive_diffs, classic_indent_boundary_zero |
| `classic_community_delivery` | 3 | classic_deliver_can_limit, classic_deliver_binary_search, classic_deliver_more_workers_than_communities |
| `classic_db_cache` | 3 | classic_cache_next_pos, classic_cache_belady_evict, classic_cache_hit_update_next |
| `classic_delete_dirs` | 3 | classic_dir_parse_level_name, classic_dir_build_by_stack, classic_dir_postorder_delete |
| `classic_even_tree_split` | 3 | classic_tree_build_compact_level, classic_tree_subtree_sum, classic_tree_find_half |
| `classic_file_system` | 5 | classic_fs_node_children, classic_fs_split_path, classic_fs_change_dir_start, classic_fs_list_dirs_then_files, classic_fs_remove_subtree |
| `classic_least_committers` | 3 | classic_committer_file_masks, classic_committer_cover_check, classic_committer_enum_min_popcount |
| `classic_log_trait` | 3 | classic_log_forward_match, classic_log_backward_shrink, classic_log_update_best_window |
| `classic_mac_parse` | 3 | classic_mac_validate_window, classic_mac_normalize_key, classic_mac_scan_overlap |
| `classic_min_distance_sum` | 3 | classic_grid_multisource_bfs_init, classic_grid_bfs_skip_obstacle, classic_grid_sum_reachable_stores |
| `classic_mutex_programs` | 3 | classic_mutex_conflict_mask, classic_mutex_check_independent, classic_mutex_best_tie |
| `classic_private_line` | 3 | classic_line_normalize_edge, classic_line_occupy_ports, classic_line_diff_initial_current |
| `classic_scaling_system` | 3 | classic_scaling_deadline_batches, classic_scaling_drain_elapsed, classic_scaling_min_machine_by_deadline |
| `classic_server_idle` | 3 | classic_idle_server_running_count, classic_idle_batch_same_time_events, classic_idle_merge_adjacent |
| `classic_task_schedule` | 3 | classic_topo_dependency_direction, classic_topo_layer_minutes, classic_topo_zero_relations |
| `classic_tlv_parse` | 4 | classic_tlv_hex_pair_to_byte, classic_tlv_read_big_endian_len, classic_tlv_tag_nested_bit, classic_tlv_recursive_limit |
| `classic_version_range` | 4 | classic_version_parse_to_int, classic_version_greater_next, classic_version_tilde_bounds, classic_version_intersection |
| `classic_vlan_config` | 4 | classic_vlan_detect_undo, classic_vlan_expand_to_range, classic_vlan_skip_fixed_prefix, classic_vlan_format_min_ranges |
| `classic_write_buffer` | 4 | classic_wb_split_write, classic_wb_flush_one_fifo, classic_wb_read_overlap_flush_prefix, classic_wb_sync_all |

## 拆题原则

- 每道微题只保留一个明确考点，例如解析、状态更新、区间合并、BFS 初始化、二分可行性判断。
- 长业务背景不进入微题题干，题干只给最小输入和期望行为。
- 对容易写错的边界保留在 `common_mistakes` 中，例如 `Search 前必须 Sort`、`有向边不能反加`、`最短路径先比跳数再比权重`。
