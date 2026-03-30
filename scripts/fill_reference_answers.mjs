import fs from "node:fs";

const file = "data/questions.json";
const questions = JSON.parse(fs.readFileSync(file, "utf8"));

const answers = {
  ext_algo_queue_basic: `int push(Q *q, int x) {
    if (q->count == q->cap) return -1;
    q->data[q->tail] = x;
    q->tail = (q->tail + 1) % q->cap;
    q->count++;
    return 0;
}

int pop(Q *q, int *x) {
    if (q->count == 0) return -1;
    *x = q->data[q->head];
    q->head = (q->head + 1) % q->cap;
    q->count--;
    return 0;
}`,
  ext_algo_stack_basic: `int valid(const char *s) {
    char st[256];
    int top = 0;
    for (int i = 0; s[i] != '\\0'; ++i) {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            st[top++] = c;
            continue;
        }
        if (top == 0) return 0;
        char t = st[--top];
        if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{')) {
            return 0;
        }
    }
    return top == 0;
}`,
  ext_algo_linked_list: `Node *reverse(Node *head) {
    Node *prev = NULL;
    Node *cur = head;
    while (cur != NULL) {
        Node *next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}`,
  ext_algo_hash_map: `for (int i = 0; i < n; ++i) {
    int v = arr[i];
    freq[v] += 1;
}

for (int i = 0; i < n; ++i) {
    if (freq[arr[i]] == 1) {
        return arr[i];
    }
}`,
  ext_algo_tree_dfs: `void dfs(Node *x) {
    if (x == NULL) return;
    visit(x);
    dfs(x->left);
    dfs(x->right);
}`,
  ext_algo_graph_bfs: `int connected(int n, int start, int target) {
    int q[1024];
    int head = 0, tail = 0;
    int vis[256] = {0};
    q[tail++] = start;
    vis[start] = 1;
    while (head < tail) {
        int cur = q[head++];
        if (cur == target) return 1;
        for (int i = 0; i < deg[cur]; ++i) {
            int nxt = graph[cur][i];
            if (vis[nxt]) continue;
            vis[nxt] = 1;
            q[tail++] = nxt;
        }
    }
    return 0;
}`,
  ext_algo_sliding_window: `int min_len(int *a, int n, int target) {
    int sum = 0, left = 0, ans = n + 1;
    for (int right = 0; right < n; ++right) {
        sum += a[right];
        while (sum >= target) {
            int len = right - left + 1;
            if (len < ans) ans = len;
            sum -= a[left++];
        }
    }
    return ans == n + 1 ? 0 : ans;
}`,
  ext_algo_two_pointers: `int dedup(int *a, int n) {
    if (n == 0) return 0;
    int slow = 1;
    for (int fast = 1; fast < n; ++fast) {
        if (a[fast] != a[fast - 1]) {
            a[slow++] = a[fast];
        }
    }
    return slow;
}`,
  ext_algo_prefix_sum: `void build_prefix(int *a, int n, int *pre) {
    pre[0] = 0;
    for (int i = 0; i < n; ++i) {
        pre[i + 1] = pre[i] + a[i];
    }
}

int range_sum(int *pre, int l, int r) {
    return pre[r + 1] - pre[l];
}`,
  ext_algo_recursion: `long long f(int n) {
    if (n <= 1) return 1;
    return (long long)n * f(n - 1);
}`,
  ext_algo_backtracking: `void dfs(int *nums, int n) {
    if (path_size == n) {
        record_path();
        return;
    }
    for (int i = 0; i < n; ++i) {
        if (used[i]) continue;
        used[i] = 1;
        path[path_size++] = nums[i];
        dfs(nums, n);
        path_size--;
        used[i] = 0;
    }
}`,
  ext_algo_divide_conquer: `void merge_sort(int *a, int l, int r, int *tmp) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    merge_sort(a, l, m, tmp);
    merge_sort(a, m + 1, r, tmp);
    int i = l, j = m + 1, k = l;
    while (i <= m && j <= r) {
        tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    }
    while (i <= m) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];
    for (int p = l; p <= r; ++p) a[p] = tmp[p];
}`,
  ext_algo_binary_search: `int lower_bound(int *a, int n, int target) {
    int l = 0, r = n;
    while (l < r) {
        int m = l + (r - l) / 2;
        if (a[m] >= target) {
            r = m;
        } else {
            l = m + 1;
        }
    }
    return l;
}`,
  ext_algo_greedy: `int solve(Interval *a, int n) {
    qsort(a, n, sizeof(a[0]), cmp_end_asc);
    int ans = 0;
    int last_end = -1;
    for (int i = 0; i < n; ++i) {
        if (a[i].start >= last_end) {
            ans++;
            last_end = a[i].end;
        }
    }
    return ans;
}`,
  ext_vos_vosvector: `VosVector *vec = VOS_VectorCreate(sizeof(int), NULL);
for (int i = 0; i < n; ++i) {
    VOS_VectorPushBack(vec, &arr[i]);
}`,
  ext_vos_voslist: `VosListNode *node = VOS_ListFront(list);
while (node != NULL) {
    VosListNode *next = VOS_ListNext(node);
    int *value = (int *)VOS_ListData(node);
    if (value != NULL && (*value % 2) == 0) {
        VOS_ListErase(list, node);
    }
    node = next;
}`,
  ext_vos_vosmap: `int *value = (int *)VOS_MapGet(map, key);
if (value == NULL) {
    int zero = 0;
    VOS_MapPut(map, key, &zero);
}`,
  ext_vos_vosprique: `int MachineCmp(const void *pa, const void *pb) {
    const Machine *a = (const Machine *)pa;
    const Machine *b = (const Machine *)pb;
    if (a->left != b->left) return b->left - a->left;
    if (a->vm != b->vm) return a->vm - b->vm;
    return a->id - b->id;
}`,
  ext_vos_voshash: `int out_n = 0;
for (int i = 0; i < n; ++i) {
    if (VOS_HashFind(hash, &arr[i]) == NULL) {
        VOS_HashInsert(hash, &arr[i]);
        out[out_n++] = arr[i];
    }
}`,
  ext_vos_vosvectorsort: `int cmp_int(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);
}

VOS_VectorSort(vec, cmp_int);`,
  ext_vos_vosmapfreq: `for (int i = 0; i < n; ++i) {
    int *count = (int *)VOS_MapGet(map, words[i]);
    if (count == NULL) {
        int one = 1;
        VOS_MapPut(map, words[i], &one);
    } else {
        int next = *count + 1;
        VOS_MapPut(map, words[i], &next);
    }
}`,
  ext_vos_vospriquedispatch: `Machine *top = (Machine *)VOS_PriQueTop(pq);
if (top == NULL || top->left < request) return -1;

Machine next = *top;
next.left -= request;
next.vm += 1;

VOS_PriQuePop(pq);
VOS_PriQuePush(pq, (uintptr_t)&next);
return next.id;`
};

let updated = 0;
for (const question of questions) {
  const answer = answers[question.id];
  if (!answer) continue;
  question.answer_code = answer;
  updated++;
}

fs.writeFileSync(file, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
console.log(`updated ${updated} answers`);
