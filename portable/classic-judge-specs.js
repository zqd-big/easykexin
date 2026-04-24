(function () {
  function fnName(code) {
    const m = String(code || '').match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\([^;{}]*\)\s*\{/);
    return m ? m[1] : '';
  }

  function spec(driverCode, expectedOutput) {
    return { driverCode, expectedOutput };
  }

  function lines(arr) {
    return arr.join('\n');
  }

  const noopMain = 'int main(void) {\n  /*__USER_SNIPPET__*/\n  return 0;\n}';

  window.buildClassicJudgeSpec = function buildClassicJudgeSpec(question, code) {
    const id = question && question.id ? question.id : '';
    if (!id.startsWith('classic_')) return null;
    const source = String(code || question.starter_code || '');
    const fn = fnName(source) || fnName(question.starter_code || '') || 'solve';

    switch (id) {
      case 'classic_vlan_detect_undo':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  printf("%d\\n", is_undo_cmd("undo port trunk allow-pass vlan 10"));','  printf("%d\\n", is_undo_cmd("port trunk allow-pass vlan 10"));','  return 0;','}']), '1\n0');
      case 'classic_vlan_expand_to_range':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int allow[4096] = {0};','  mark_range(allow, 20, 22, 1);','  printf("%d%d%d\\n", allow[20], allow[21], allow[22]);','  mark_range(allow, 21, 21, 0);','  printf("%d%d%d\\n", allow[20], allow[21], allow[22]);','  return 0;','}']), '111\n101');
      case 'classic_vlan_skip_fixed_prefix':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  const char *p = find_vlan_list("port trunk allow-pass vlan 10 20 to 30");','  printf("%s\\n", p == NULL ? "NULL" : p);','  return 0;','}']), '10 20 to 30');
      case 'classic_vlan_format_min_ranges':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  char out[128] = {0};','  append_range(out, sizeof(out), 9, 9);','  append_range(out, sizeof(out), 21, 22);','  append_range(out, sizeof(out), 24, 30);','  printf("%s\\n", out);','  return 0;','}']), '9 21 to 22 24 to 30');

      case 'classic_log_forward_match':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int events[] = {4, 8, 4, 3, 6, 6, 8};','  int traits[] = {4, 6, 8};','  printf("%d\\n", find_end(events, 7, traits, 3, 0));','  printf("%d\\n", find_end(events, 7, traits, 3, 3));','  return 0;','}']), '6\n-1');
      case 'classic_log_backward_shrink':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int events[] = {4, 8, 4, 3, 6, 6, 8};','  int traits[] = {4, 6, 8};','  printf("%d\\n", shrink_start(events, traits, 3, 6));','  return 0;','}']), '2');
      case 'classic_log_update_best_window':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int l = -1, r = -1;','  update_best(2, 6, &l, &r);','  update_best(0, 4, &l, &r);','  update_best(3, 5, &l, &r);','  printf("%d,%d\\n", l, r);','  return 0;','}']), '3,5');

      case 'classic_line_normalize_edge':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int a = 7, b = 2;','  normalize_pair(&a, &b);','  printf("%d,%d\\n", a, b);','  return 0;','}']), '2,7');
      case 'classic_line_occupy_ports':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int used[128] = {0};','  printf("%d\\n", try_add(used, 0, 1));','  printf("%d\\n", try_add(used, 1, 2));','  printf("%d%d%d\\n", used[0], used[1], used[2]);','  return 0;','}']), '1\n0\n110');
      case 'classic_line_diff_initial_current':
        return spec(lines(['typedef struct { char op; int a; int b; } Cmd;','int init[128][128]; int cur[128][128]; Cmd out_cmds[32]; int out_n = 0;','void add_cmd(char op, int a, int b) { out_cmds[out_n++] = (Cmd){op, a, b}; }','int main(void) {','  init[2][3] = init[4][5] = 1;','  cur[2][3] = cur[0][6] = cur[1][4] = 1;','  /*__USER_SNIPPET__*/','  for (int i = 0; i < out_n; ++i) printf("%c:%d-%d\\n", out_cmds[i].op, out_cmds[i].a, out_cmds[i].b);','  return 0;','}']), 'd:4-5\na:0-6\na:1-4');

      case 'classic_idle_server_running_count':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int running[8] = {0}; int working = 0;','  apply_delta(1, 1, running, &working);','  apply_delta(1, 1, running, &working);','  apply_delta(2, 1, running, &working);','  apply_delta(1, -1, running, &working);','  apply_delta(1, -1, running, &working);','  printf("%d\\n", working);','  return 0;','}']), '1');
      case 'classic_idle_batch_same_time_events':
        return spec(lines(['typedef struct { int time; int sid; int delta; } Event;','typedef struct { int l; int r; } Ival;','Event events[] = {{1,1,1},{1,1,1},{2,1,-1},{2,2,1},{3,1,-1},{3,2,-1}};','int m = 6, i = 0, serverNum = 3, running[8] = {0}, working = 0;','Ival ans[16]; int ansN = 0;','void apply_delta(int sid, int delta, int running[], int *working) { int before = running[sid]; running[sid] += delta; if (before == 0 && running[sid] > 0) ++*working; if (before > 0 && running[sid] == 0) --*working; }','void add_interval(int l, int r) { ans[ansN++] = (Ival){l, r}; }','int main(void) {','  /*__USER_SNIPPET__*/','  for (int k = 0; k < ansN; ++k) printf("[%d,%d]\\n", ans[k].l, ans[k].r);','  return 0;','}']), '[2,3]');
      case 'classic_idle_merge_adjacent':
        return spec(lines(['typedef struct { int startTime; int endTime; } Interval;','Interval ans[16]; int ansN = 0;','/*__USER_GLOBAL__*/','int main(void) {','  append_interval(1, 2);','  append_interval(2, 3);','  append_interval(5, 6);','  for (int i = 0; i < ansN; ++i) printf("[%d,%d]\\n", ans[i].startTime, ans[i].endTime);','  return 0;','}']), '[1,3]\n[5,6]');

      case 'classic_tlv_hex_pair_to_byte':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  printf("%d\\n", hex_byte("6f"));','  printf("%d\\n", hex_byte("0a"));','  return 0;','}']), '111\n10');
      case 'classic_tlv_read_big_endian_len':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  unsigned char b[] = {0, 0, 1, 2};','  printf("%d\\n", read_len(b));','  return 0;','}']), '258');
      case 'classic_tlv_tag_nested_bit':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  printf("%d\\n", is_nested(0x8001));','  printf("%d\\n", is_nested(0x0001));','  return 0;','}']), '1\n0');
      case 'classic_tlv_recursive_limit':
        return spec(lines(['int read_tag(int pos) { return pos == 0 ? 0x8001 : 0x0001; }','int read_len_at(int pos) { return pos == 2 ? 8 : 2; }','void emit_leaf(int level, int value, int len) { (void)value; (void)len; printf("%d:hi\\n", level); }','/*__USER_GLOBAL__*/','int main(void) {','  parse_range(0, 14, 0);','  return 0;','}']), '1:hi');

      case 'classic_dir_parse_level_name':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  char name[128] = {0};','  int level = parse_line("|-|-Cpp", name);','  printf("%d:%s\\n", level, name);','  return 0;','}']), '2:Cpp');
      case 'classic_dir_build_by_stack':
        return spec(lines(['typedef struct DirBuildNode { char name[32]; struct DirBuildNode *child[8]; int childNum; } DirBuildNode;','#define Node DirBuildNode','Node nodes[8]; int nodeN = 0; Node *stack[8];','Node *new_node(const char *name) { Node *n = &nodes[nodeN++]; memset(n, 0, sizeof(*n)); strcpy_s(n->name, sizeof(n->name), name); return n; }','void add_child(Node *p, Node *c) { p->child[p->childNum++] = c; }','void step(int level, const char *input) { char name[32]; strcpy_s(name, sizeof(name), input);','  /*__USER_SNIPPET__*/','}','int main(void) {','  memset(stack, 0, sizeof(stack));','  step(0, "A"); step(1, "B");','  printf("%s->%s\\n", stack[0]->name, stack[0]->child[0]->name);','  return 0;','}']), 'A->B');
      case 'classic_dir_postorder_delete':
        return spec(lines(['typedef struct DirDeleteNode { const char *name; struct DirDeleteNode *parent; struct DirDeleteNode *child[4]; int childNum; } DirDeleteNode;','#define Node DirDeleteNode','int deletedCount = 0;','int in_del_set(const char *name) { return strcmp(name, "B") == 0; }','/*__USER_GLOBAL__*/','int main(void) {','  Node b = {"B", NULL, {0}, 0};','  Node a = {"A", NULL, {&b}, 1}; b.parent = &a;','  dfs(&a);','  printf("%d\\n", deletedCount);','  return 0;','}']), '1');

      case 'classic_mac_validate_window':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  printf("%d\\n", is_mac_window("01-23-45-Fe-AA-bb"));','  printf("%d\\n", is_mac_window("00-11-aa-BB:FF-Ed"));','  return 0;','}']), '1\n0');
      case 'classic_mac_normalize_key':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  char key[32] = {0};','  normalize_mac("Aa:bB:12:CC:dd:ee", key);','  printf("%s\\n", key);','  return 0;','}']), 'aabb12ccddee');
      case 'classic_mac_scan_overlap':
        return spec(lines(['int seen = 0;','int is_mac_window(const char *s) { char sep=s[2]; if(sep!=\'-\'&&sep!=\':\') return 0; for(int i=0;i<17;++i){ if((i+1)%3==0){ if(s[i]!=sep) return 0; } else if(!isxdigit((unsigned char)s[i])) return 0;} return 1; }','void normalize_mac(const char *s, char *key) { int k=0; for(int i=0;i<17;++i) if(s[i]!=\'-\'&&s[i]!=\':\') key[k++]=(char)tolower((unsigned char)s[i]); key[k]=0; }','void add_to_set(const char *key) { (void)key; ++seen; }','int main(void) {','  const char *input = "01-02-03-04-05-06-07";','  /*__USER_SNIPPET__*/','  printf("%d\\n", seen);','  return 0;','}']), '2');

      case 'classic_mutex_conflict_mask':
        return spec(lines(['unsigned conflict[20];','/*__USER_GLOBAL__*/','int main(void) {','  add_mutex(1, 3);','  printf("%u %u\\n", (conflict[0] >> 2) & 1u, (conflict[2] >> 0) & 1u);','  return 0;','}']), '1 1');
      case 'classic_mutex_check_independent':
        return spec(lines(['int n = 3; unsigned conflict[20];','/*__USER_GLOBAL__*/','int main(void) {','  conflict[0] = 1u << 1; conflict[1] = 1u << 0;','  printf("%d\\n", is_ok((1u << 0) | (1u << 2)));','  printf("%d\\n", is_ok((1u << 0) | (1u << 1)));','  return 0;','}']), '1\n0');
      case 'classic_mutex_best_tie':
        return spec(lines(['int bestCnt = 0, bestSum = 9999;','int popcount(unsigned x) { int c=0; while(x){ c += x & 1u; x >>= 1; } return c; }','/*__USER_GLOBAL__*/','int main(void) {','  update_best(0x3, 12);','  update_best(0x5, 11);','  update_best(0x1, 1);','  printf("%d,%d\\n", bestCnt, bestSum);','  return 0;','}']), '2,11');

      case 'classic_indent_positive_diffs':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int a[] = {1, 2, 3, 2, 1};','  printf("%lld\\n", min_steps(a, 5));','  return 0;','}']), '3');
      case 'classic_indent_boundary_zero':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void) {','  int a[] = {4, 1};','  printf("%d\\n", first_contrib(a));','  return 0;','}']), '4');

      case 'classic_tree_build_compact_level':
        return spec(lines(['int pool[] = {9,13,12,-1,-1,2,8}; int n = 7; int left[16], right[16], q[16]; int head = 0, tail = 0, idx = 1;','int main(void) {','  for(int i=0;i<16;++i) left[i]=right[i]=-1; q[tail++] = 0;','  /*__USER_SNIPPET__*/','  printf("%d,%d\\n", left[2], right[2]);','  return 0;','}']), '5,6');
      case 'classic_tree_subtree_sum':
        return spec(lines(['int pool[] = {9,13,12,-1,-1,2,8}; int left[8] = {-1,-1,5,-1,-1,-1,-1,-1}; int right[8] = {-1,-1,6,-1,-1,-1,-1,-1}; long long subSum[8];','/*__USER_GLOBAL__*/','int main(void) {','  left[0]=1; right[0]=2;','  printf("%lld\\n", dfs_sum(0));','  printf("%lld\\n", subSum[2]);','  return 0;','}']), '44\n22');
      case 'classic_tree_find_half':
        return spec(lines(['long long subSum[8] = {44,13,22,0,0,2,8,0};','/*__USER_GLOBAL__*/','int main(void) {','  printf("%d\\n", find_cut(7, 44));','  printf("%d\\n", find_cut(7, 45));','  return 0;','}']), '2\n-1');

      case 'classic_grid_multisource_bfs_init':
        return spec(lines(['int dist[4][4]; typedef struct { int r,c; } P; P q[32]; int qt = 0; void push(int r,int c){ q[qt++] = (P){r,c}; }','/*__USER_GLOBAL__*/','int main(void) {','  int r0[]={0,1,1}; int r1[]={1,-1,1}; int *matrix[]={r0,r1};','  init_sources(matrix, 2, 3);','  printf("%d,%d\\n", dist[0][0], qt);','  return 0;','}']), '0,1');
      case 'classic_grid_bfs_skip_obstacle':
        return spec(lines(['int main(void) {','  int rows=2, cols=3, matrix[2][3]={{0,1,-1},{1,1,1}}, dist[2][3];','  for(int r=0;r<2;++r) for(int c=0;c<3;++c) dist[r][c]=-1; dist[0][0]=0;','  int tests[4][2]={{-1,0},{0,2},{0,0},{1,1}}; int ok=0;','  for(int t=0;t<4;++t){ int nr=tests[t][0], nc=tests[t][1];','    /*__USER_SNIPPET__*/','    ++ok;','  }','  printf("%d\\n", ok);','  return 0;','}']), '1');
      case 'classic_grid_sum_reachable_stores':
        return spec(lines(['int main(void) {','  int rows=2, cols=3; int r0[]={0,1,-1}; int r1[]={1,1,1}; int *matrix[]={r0,r1}; int dist[2][3]={{0,1,-1},{1,2,-1}};','  /*__USER_SNIPPET__*/','  printf("%d\\n", sum);','  return 0;','}']), '4');

      case 'classic_cache_next_pos':
        return spec(lines(['int main(void) {','  int dataIds[] = {1,2,1,3,2}; int n=5; int nextPos[5]; int last[1001]; for(int i=0;i<1001;++i) last[i]=9999;','  /*__USER_SNIPPET__*/','  for(int i=0;i<n;++i) printf(i?",%d":"%d", nextPos[i]); printf("\\n");','  return 0;','}']), '2,4,9999,9999,9999');
      case 'classic_cache_belady_evict':
        return spec(lines(['int cacheN = 3; int cacheNext[3] = {5, 99, 8};','/*__USER_GLOBAL__*/','int main(void) { printf("%d\\n", choose_victim()); return 0; }']), '1');
      case 'classic_cache_hit_update_next':
        return spec(lines(['int dbVisits=0; int cacheNext[4]={0}; void insert_or_evict(int id,int next){ (void)id; cacheNext[0]=next; }','int main(void){ int pos=0, i=2, nextPos[5]={0,0,7,0,0}, dataIds[5]={1,2,1,3,2};','  /*__USER_SNIPPET__*/','  printf("%d,%d\\n", dbVisits, cacheNext[0]);','  return 0;','}']), '0,7');

      case 'classic_route_bfs_tie_weight':
        return spec(lines(['int dist[4] = {0,1,0,0}; int cost[4] = {0,9,0,0}; int pushed = 0; void push(int v){ (void)v; ++pushed; }','int main(void){ int u=0, v=1, newCost=5;','  /*__USER_SNIPPET__*/','  printf("%d,%d,%d\\n", dist[1], cost[1], pushed);','  return 0;','}']), '1,5,1');
      case 'classic_route_build_directed_adj':
        return spec(lines(['typedef struct { int to,w,next; } Edge; Edge edges[16]; int head[8]; int edgeCnt=0;','/*__USER_GLOBAL__*/','int main(void){ for(int i=0;i<8;++i) head[i]=-1; add_edge(2,5,7); printf("%d,%d\\n", edges[head[2]].to, edges[head[2]].w); return 0; }']), '5,7');
      case 'classic_route_answer_unreachable':
        return spec(lines(['int main(void){ int dist[4]={0,1,-1,2}; int cost[4]={0,10,0,30}; int to=2; int ans[1]; int i=0;','  /*__USER_SNIPPET__*/','  printf("%d\\n", ans[0]);','  return 0;','}']), '-1');

      case 'classic_topo_dependency_direction':
        return spec(lines(['int indeg[8]; int edgeFrom=-1, edgeTo=-1; void add_edge(int u,int v){ edgeFrom=u; edgeTo=v; }','/*__USER_GLOBAL__*/','int main(void){ add_relation(1,2); printf("%d->%d indeg1=%d\\n", edgeFrom, edgeTo, indeg[1]); return 0; }']), '2->1 indeg1=1');
      case 'classic_topo_layer_minutes':
        return spec(lines(['typedef struct { int to,next; } E; E edges[8]; int head[8], indeg[8], q[8], h=0,t=0, minutes=0; int queue_not_empty(void){ return h<t; } int queue_size(void){ return t-h; } int pop(void){ return q[h++]; } void push(int x){ q[t++]=x; }','int main(void){ for(int i=0;i<8;++i) head[i]=-1; edges[0]=(E){1,-1}; head[0]=0; indeg[1]=1; push(0);','  /*__USER_SNIPPET__*/','  printf("%d\\n", minutes); return 0; }']), '2');
      case 'classic_topo_zero_relations':
        return spec(lines(['int solve(void){ int relationsSize=0, taskNum=3;','  /*__USER_SNIPPET__*/','  return -1; }','int main(void){ printf("%d\\n", solve()); return 0; }']), '1');

      case 'classic_version_parse_to_int':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void){ printf("%d\\n", version_value("1.2.3")); printf("%d\\n", version_value("1")); return 0; }']), '1002003\n1000000');
      case 'classic_version_greater_next':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void){ printf("%d\\n", next_version(1001999)); return 0; }']), '1002000');
      case 'classic_version_tilde_bounds':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void){ int l=0,r=0; parse_tilde(1,9,0,2,&l,&r); printf("%d,%d\\n", l,r); parse_tilde(1,0,0,1,&l,&r); printf("%d,%d\\n", l,r); return 0; }']), '1009000,1009999\n1000000,1999999');
      case 'classic_version_intersection':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void){ printf("%d\\n", has_intersection(1,5,5,9)); printf("%d\\n", has_intersection(1,4,5,9)); return 0; }']), '1\n0');

      case 'classic_deliver_can_limit':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void){ int a[]={40,10,20}; printf("%d\\n", can_finish(2,a,3,40)); printf("%d\\n", can_finish(2,a,3,35)); return 0; }']), '1\n0');
      case 'classic_deliver_binary_search':
        return spec(lines(['int can_finish(int num,const int *a,int n,int limit){ int used=1,sum=0; for(int i=0;i<n;++i){ if(a[i]>limit) return 0; if(sum+a[i]>limit){++used; sum=0;} sum+=a[i]; } return used<=num; }','int main(void){ int communities[]={40,10,20}; int n=3,num=2,l=40,r=70;','  /*__USER_SNIPPET__*/','  printf("%d\\n", l); return 0; }']), '40');
      case 'classic_deliver_more_workers_than_communities':
        return spec(lines(['int max_value(const int *a,int n){ int m=a[0]; for(int i=1;i<n;++i) if(a[i]>m)m=a[i]; return m; }','int solve(void){ int communities[]={40,10,20}; int n=3,num=5;','  /*__USER_SNIPPET__*/','  return -1; }','int main(void){ printf("%d\\n", solve()); return 0; }']), '40');

      case 'classic_scaling_deadline_batches':
        return spec(lines(['typedef struct { int deadline; int left; } Batch; Batch batches[8]; int tail=0;','/*__USER_GLOBAL__*/','int main(void){ add_batch(10,25); add_batch(11,0); printf("%d,%d,%d\\n", tail,batches[0].deadline,batches[0].left); return 0; }']), '1,15,25');
      case 'classic_scaling_drain_elapsed':
        return spec(lines(['typedef struct { int deadline; int left; } Batch; Batch batches[8]={{5,8},{6,10}}; int head=0, tail=2, machineNum=2, capability=3;','/*__USER_GLOBAL__*/','int main(void){ consume_elapsed(2); printf("%d,%d,%d\\n", head,batches[0].left,batches[1].left); return 0; }']), '1,0,6');
      case 'classic_scaling_min_machine_by_deadline':
        return spec(lines(['typedef struct { int deadline; int left; } Batch; Batch batches[8]={{15,10},{16,50}}; int head=0, tail=2, capability=5;','/*__USER_GLOBAL__*/','int main(void){ printf("%d\\n", need_machines(10)); return 0; }']), '2');

      case 'classic_fs_node_children':
        return spec(lines(['typedef struct FsLookupNode { const char *dirs[8]; int dirN; const char *files[8]; int fileN; } FsLookupNode;','#define Node FsLookupNode','const char *find_dir(Node *d,const char *n){ for(int i=0;i<d->dirN;++i) if(strcmp(d->dirs[i],n)==0) return d->dirs[i]; return NULL;} const char *find_file(Node *d,const char *n){ for(int i=0;i<d->fileN;++i) if(strcmp(d->files[i],n)==0) return d->files[i]; return NULL;}','/*__USER_GLOBAL__*/','int main(void){ Node d={{"dirb"},1,{"fileb"},1}; printf("%d%d%d\\n", exists(&d,"dirb"), exists(&d,"fileb"), exists(&d,"none")); return 0; }']), '110');
      case 'classic_fs_split_path':
        return spec(lines(['int cnt=0; void visit_component(const char *s){ printf(cnt++?",%s":"%s", s); }','int main(void){ char buf[]="/a/b/"; char *ctx=NULL;','  /*__USER_SNIPPET__*/','  printf("\\n"); return 0; }']), 'a,b');
      case 'classic_fs_change_dir_start':
        return spec(lines(['typedef struct FsPathNode { int id; } FsPathNode;','#define Node FsPathNode','typedef struct { Node *root; Node *cwd; } FS;','int main(void){ Node root={1}, cwd={2}; FS obj={&root,&cwd}; FS *sys=&obj; const char *pathName="/a";','  /*__USER_SNIPPET__*/','  printf("%d\\n", p->id); return 0; }']), '1');
      case 'classic_fs_list_dirs_then_files':
        return spec(lines(['char *dirs[]={"dirc","dirb"}; char *files[]={"fileb","filea"}; int dirN=2,fileN=2,k=0; char *out[8]; int cmp_str_ptr(const void*a,const void*b){ const char *x=*(char* const*)a; const char *y=*(char* const*)b; return strcmp(x,y); }','int main(void){','  /*__USER_SNIPPET__*/','  for(int i=0;i<k;++i) printf(i?",%s":"%s", out[i]); printf("\\n"); return 0; }']), 'dirb,dirc,filea,fileb');
      case 'classic_fs_remove_subtree':
        return spec(lines(['typedef struct FsFreeNode { char *name; struct FsFreeNode *dirs[8]; int dirN; char *files[8]; int fileN; } FsFreeNode;','#define Node FsFreeNode','/*__USER_GLOBAL__*/','int main(void){ Node *root=(Node*)calloc(1,sizeof(Node)); root->name=md_strdup("r"); Node *child=(Node*)calloc(1,sizeof(Node)); child->name=md_strdup("d"); child->files[child->fileN++]=md_strdup("f"); root->dirs[root->dirN++]=child; free_node(root); printf("freed\\n"); return 0; }']), 'freed');

      case 'classic_wb_split_write':
        return spec(lines(['typedef struct { int offset,len,value; } WriteReq; WriteReq q[8]; int qn=0; void push_req(WriteReq r){ q[qn++]=r; }','int main(void){ int offset=2,len=11,value=120;','  /*__USER_SNIPPET__*/','  for(int i=0;i<qn;++i) printf("%d:%d ", q[i].offset,q[i].len); printf("\\n"); return 0; }']), '2:8 10:3');
      case 'classic_wb_flush_one_fifo':
        return spec(lines(['typedef struct { int offset,len,value; } WriteReq; unsigned char data[16]; WriteReq q[8]={{1,3,255}}; int head=0, tail=1;','/*__USER_GLOBAL__*/','int main(void){ flush_one(); printf("%02X%02X%02X%02X\\n", data[0],data[1],data[2],data[3]); return 0; }']), '00FFFFFF');
      case 'classic_wb_read_overlap_flush_prefix':
        return spec(lines(['typedef struct { int offset,len,value; } WriteReq;','/*__USER_GLOBAL__*/','int main(void){ WriteReq r={2,8,120}; printf("%d\\n", overlap(r,11,1)); printf("%d\\n", overlap(r,9,1)); return 0; }']), '0\n1');
      case 'classic_wb_sync_all':
        return spec(lines(['int head=0, tail=3, flushed=0; void flush_one(void){ ++head; ++flushed; }','/*__USER_GLOBAL__*/','int main(void){ sync_all(); printf("%d,%d\\n", head, flushed); return 0; }']), '3,3');

      case 'classic_committer_file_masks':
        return spec(lines(['/*__USER_GLOBAL__*/','int main(void){ int a[]={5,2,3}; printf("%d\\n", file_mask(a,3)); return 0; }']), '44');
      case 'classic_committer_cover_check':
        return spec(lines(['int filesSize=3; int fileMask[3] = {1<<0, (1<<5)|(1<<2)|(1<<3), (1<<0)|(1<<5)};','/*__USER_GLOBAL__*/','int main(void){ printf("%d\\n", cover_all((1<<0)|(1<<5))); printf("%d\\n", cover_all(1<<0)); return 0; }']), '1\n0');
      case 'classic_committer_enum_min_popcount':
        return spec(lines(['int fileMask[3] = {1<<0, (1<<5)|(1<<2)|(1<<3), (1<<0)|(1<<5)}; int filesSize=3; int popcount(int x){ int c=0; while(x){ c+=x&1; x>>=1; } return c; } int cover_all(int choose){ for(int i=0;i<filesSize;++i) if((choose & fileMask[i])==0) return 0; return 1; }','int main(void){','  /*__USER_SNIPPET__*/','  printf("%d\\n", ans); return 0; }']), '2');
      default:
        return null;
    }
  };
})();
