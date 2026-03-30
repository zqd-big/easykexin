window.INTERFACE_HINTS = {
  qsort: {
    name: "qsort",
    signature: "void qsort(void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *));",
    summary: "通用排序函数。比较函数返回负数表示 a 在前，正数表示 b 在前，0 表示相等。",
    params: [
      { name: "base", meaning: "待排序数组首地址。" },
      { name: "nmemb", meaning: "元素个数。" },
      { name: "size", meaning: "单个元素字节数，通常写 sizeof(arr[0])。" },
      { name: "compar", meaning: "比较函数，签名固定为 const void * -> const void *。" }
    ],
    notes: [
      "比较函数里先把 void * 转成真实类型指针，再解引用。",
      "不要直接 return x - y 处理大整数，可能溢出。",
      "常见写法：return (x > y) - (x < y);"
    ]
  },
  bsearch: {
    name: "bsearch",
    signature: "void *bsearch(const void *key, const void *base, size_t nmemb, size_t size, int (*compar)(const void *, const void *));",
    summary: "二分查找。要求数组已经按 compar 对应的顺序排好序。",
    params: [
      { name: "key", meaning: "要查找的目标值地址。" },
      { name: "base", meaning: "有序数组首地址。" },
      { name: "nmemb", meaning: "元素个数。" },
      { name: "size", meaning: "单个元素字节数。" },
      { name: "compar", meaning: "比较函数，通常是 key-vs-element 风格。" }
    ],
    notes: [
      "返回值是元素地址，不是下标；需要自己做指针减法换算索引。",
      "查找前必须先保证数组有序。"
    ]
  },
  strcmp: {
    name: "strcmp",
    signature: "int strcmp(const char *lhs, const char *rhs);",
    summary: "按字典序比较两个以 \\0 结尾的字符串。",
    params: [
      { name: "lhs", meaning: "左侧字符串。" },
      { name: "rhs", meaning: "右侧字符串。" }
    ],
    notes: [
      "返回值小于 0 表示 lhs 更小，大于 0 表示 lhs 更大，0 表示相等。",
      "比较的是字符序，不是长度。"
    ]
  },
  strcpy_s: {
    name: "strcpy_s",
    signature: "errno_t strcpy_s(char *dst, size_t dstsz, const char *src);",
    summary: "安全拷贝整个字符串，自动写入结尾 \\0。",
    params: [
      { name: "dst", meaning: "目标缓冲区。" },
      { name: "dstsz", meaning: "目标缓冲区容量。" },
      { name: "src", meaning: "源字符串。" }
    ],
    notes: [
      "dstsz 传容量，不是 strlen。",
      "返回值非 0 表示失败。"
    ]
  },
  strncpy_s: {
    name: "strncpy_s",
    signature: "errno_t strncpy_s(char *dst, size_t dstsz, const char *src, size_t count);",
    summary: "安全限长拷贝，可配合 _TRUNCATE 截断。",
    params: [
      { name: "dst", meaning: "目标缓冲区。" },
      { name: "dstsz", meaning: "目标缓冲区容量。" },
      { name: "src", meaning: "源字符串。" },
      { name: "count", meaning: "最多复制多少字符；也可传 _TRUNCATE。" }
    ],
    notes: [
      "count 不是目标缓冲区容量。",
      "常见题里会用 _TRUNCATE 简化处理。"
    ]
  },
  strcat_s: {
    name: "strcat_s",
    signature: "errno_t strcat_s(char *dst, size_t dstsz, const char *src);",
    summary: "把 src 追加到 dst 末尾。",
    params: [
      { name: "dst", meaning: "目标字符串缓冲区，必须已经有合法的 \\0 结尾。" },
      { name: "dstsz", meaning: "目标缓冲区总容量。" },
      { name: "src", meaning: "要追加的源字符串。" }
    ],
    notes: [
      "通常先 strcpy_s，再 strcat_s。",
      "dstsz 仍然传总容量，不是剩余容量。"
    ]
  },
  strchr: {
    name: "strchr",
    signature: "char *strchr(const char *s, int ch);",
    summary: "查找字符第一次出现的位置。",
    params: [
      { name: "s", meaning: "待查找字符串。" },
      { name: "ch", meaning: "目标字符。" }
    ],
    notes: [
      "返回的是指针；求下标要做 p - s。",
      "找不到返回 NULL。"
    ]
  },
  strrchr: {
    name: "strrchr",
    signature: "char *strrchr(const char *s, int ch);",
    summary: "查找字符最后一次出现的位置。",
    params: [
      { name: "s", meaning: "待查找字符串。" },
      { name: "ch", meaning: "目标字符。" }
    ],
    notes: [
      "常用于取最后一个路径分隔符、最后一个点。"
    ]
  },
  strstr: {
    name: "strstr",
    signature: "char *strstr(const char *haystack, const char *needle);",
    summary: "查找子串第一次出现的位置。",
    params: [
      { name: "haystack", meaning: "主串。" },
      { name: "needle", meaning: "要查找的子串。" }
    ],
    notes: [
      "返回子串起始地址；求偏移用 p - haystack。",
      "找不到返回 NULL。"
    ]
  },
  strtok_s: {
    name: "strtok_s",
    signature: "char *strtok_s(char *str, const char *delim, char **context);",
    summary: "安全分词接口。首次传原串，后续传 NULL。",
    params: [
      { name: "str", meaning: "首次传待切分字符串；后续传 NULL。" },
      { name: "delim", meaning: "分隔符集合。" },
      { name: "context", meaning: "上下文指针，保存切分状态。" }
    ],
    notes: [
      "会原地改写字符串，把分隔符替换成 \\0。",
      "不要把字符串常量直接传给 strtok_s。"
    ]
  },
  sscanf_s: {
    name: "sscanf_s",
    signature: "int sscanf_s(const char *buffer, const char *format, ...);",
    summary: "按格式从字符串里解析字段。",
    params: [
      { name: "buffer", meaning: "输入字符串。" },
      { name: "format", meaning: "解析格式串。" },
      { name: "...", meaning: "输出变量地址；字符串类型参数还要补容量。" }
    ],
    notes: [
      "返回成功匹配的字段数，必须检查。",
      "解析字符串缓冲区时要额外传容量；纯 int 场景不用。"
    ]
  },
  sprintf_s: {
    name: "sprintf_s",
    signature: "int sprintf_s(char *buffer, size_t sizeOfBuffer, const char *format, ...);",
    summary: "安全格式化输出到字符串。",
    params: [
      { name: "buffer", meaning: "目标缓冲区。" },
      { name: "sizeOfBuffer", meaning: "缓冲区容量。" },
      { name: "format", meaning: "格式串。" },
      { name: "...", meaning: "格式化参数。" }
    ],
    notes: [
      "返回写入的字符数，失败返回负数。",
      "常见题会配合 %02d、%lld 等格式。"
    ]
  },
  strtol: {
    name: "strtol",
    signature: "long strtol(const char *nptr, char **endptr, int base);",
    summary: "把字符串转成长整型，可判断解析停止位置。",
    params: [
      { name: "nptr", meaning: "待转换字符串。" },
      { name: "endptr", meaning: "输出解析停止位置；可传 NULL。" },
      { name: "base", meaning: "进制，常见 10、16，也可传 0 自动识别。" }
    ],
    notes: [
      "判断是否成功，不能只看返回值，要看 endptr 是否前进。",
      "遇到非数字会在第一个非法字符处停止。"
    ]
  },
  strtoll: {
    name: "strtoll",
    signature: "long long strtoll(const char *nptr, char **endptr, int base);",
    summary: "长整型 64 位版本的字符串转数值接口。",
    params: [
      { name: "nptr", meaning: "待转换字符串。" },
      { name: "endptr", meaning: "输出解析停止位置。" },
      { name: "base", meaning: "进制。" }
    ],
    notes: [
      "大数题优先用 strtoll，避免 int 溢出。"
    ]
  },
  atoi: {
    name: "atoi",
    signature: "int atoi(const char *str);",
    summary: "快速把字符串转成 int，但不能告诉你解析停在哪里。",
    params: [
      { name: "str", meaning: "待转换字符串。" }
    ],
    notes: [
      "考试里更推荐 strtol / strtoll，因为更稳。"
    ]
  },
  vosvector: {
    name: "VosVector",
    signature: "VosVector *VOS_VectorCreate(size_t itemSize, void (*freeFn)(void *)); / int VOS_VectorPushBack(VosVector *vec, const void *item); / void VOS_VectorSort(VosVector *vec, int (*cmp)(const void *, const void *));",
    summary: "顺序容器，常用来存放一批同类型元素，并支持排序。",
    params: [
      { name: "itemSize", meaning: "元素字节数，通常是 sizeof(T)。" },
      { name: "freeFn", meaning: "元素释放函数；存纯值时常传 NULL。" },
      { name: "item", meaning: "要插入元素的地址，不是元素值本身。" }
    ],
    notes: [
      "PushBack 传的是元素地址。",
      "Sort 的比较函数合同和 qsort 基本一致。"
    ]
  },
  vosmap: {
    name: "VosMap",
    signature: "VosMap *VOS_MapCreate(...); / void *VOS_MapGet(VosMap *map, const char *key); / int VOS_MapPut(VosMap *map, const char *key, const void *value);",
    summary: "键值映射容器，题里常用于计数、去重、查表。",
    params: [
      { name: "map", meaning: "Map 容器实例。" },
      { name: "key", meaning: "键，常见为字符串。" },
      { name: "value", meaning: "值地址；题里常存 int 计数。" }
    ],
    notes: [
      "先 Get，再决定是初始化还是更新。",
      "注意 key/value 的生命周期，别传悬挂地址。"
    ]
  },
  voshash: {
    name: "VosHash",
    signature: "VosHash *VOS_HashCreate(...); / void *VOS_HashFind(VosHash *hash, const void *key); / int VOS_HashInsert(VosHash *hash, const void *key);",
    summary: "哈希集合/哈希表常用接口，题里多用于去重。",
    params: [
      { name: "hash", meaning: "Hash 容器实例。" },
      { name: "key", meaning: "键地址，常见为 int *。" }
    ],
    notes: [
      "Find 返回非 NULL 说明已存在。",
      "题里常见模式：没找到就插入并写结果。"
    ]
  },
  vosprique: {
    name: "VosPriQue",
    signature: "VosPriQue *VOS_PriQueCreate(int (*cmp)(const void *, const void *), void *freeFn); / int VOS_PriQuePush(VosPriQue *pq, uintptr_t item); / void *VOS_PriQueTop(VosPriQue *pq); / void VOS_PriQuePop(VosPriQue *pq);",
    summary: "优先队列容器，常用于 TopK、调度、三重优先级排序。",
    params: [
      { name: "cmp", meaning: "比较函数，决定堆顶优先级。" },
      { name: "item", meaning: "入队元素，很多题会存指针或 uintptr_t。" },
      { name: "pq", meaning: "优先队列实例。" }
    ],
    notes: [
      "先把比较规则写清楚：谁优先、返回方向是什么。",
      "如果存指针，要确认被指向对象的生命周期足够长。"
    ]
  }
};
