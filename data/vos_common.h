#ifndef VOS_COMMON_H
#define VOS_COMMON_H

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

/* **************************************************************************
* 公共错误码定义
************************************************************************** */

/**
 * @ingroup vos_common
 * 0x0 正确。
 */
#define VOS_OK 0u

/**
 * @ingroup vos_common
 * 0x1 错误。
 */
#define VOS_ERROR 1u

#ifdef VOS_DEBUG
    #define VOS_STATIC
    #ifndef VOS_PRINTF
        #define VOS_PRINTF printf
    #endif
#else
    #define VOS_STATIC static
    #ifndef VOS_PRINTF
        #define VOS_PRINTF(format, ...)
    #endif
#endif

/* **************************************************************************
* 公共钩子函数原型定义
************************************************************************** */

/**
 * @ingroup vos_common
 * @brief 比较函数原型
 * @par 描述：比较函数原型，用于排序场景。
 * @attention 注意：这里只定义了比较函数原型，由于不知道数据类型和长度，因此钩子函数需要业务自己实现。
 * @param data1 [IN] 数据1
 * @param data2 [IN] 数据2
 * @retval >0 升序排序
 * @retval =0 不做交换
 * @retval <0 降序排序
 */
typedef int32_t (*VosDataCmpFunc)(const void *data1, const void *data2);

/**
 * @ingroup vos_common
 * @brief 比较函数原型
 * @par 描述：比较函数原型，用于排序场景。
 * @attention 注意：这里只定义了比较函数原型，由于不知道数据类型和长度，因此钩子函数需要业务自己实现。
 * @param key1 [IN] key1
 * @param key2 [IN] key2
 * @retval >0 升序排序
 * @retval =0 不做交换
 * @retval <0 降序排序
 */
typedef int32_t (*VosKeyCmpFunc)(uintptr_t key1, uintptr_t key2);

/**
 * @ingroup vos_common
 * 默认整型比较函数
 * @details uintptr_t是cstl模块通用的存储数据类型，该入参主要是两个功能：
 * 功能一：存储用户数据的地址，那么对于这种情况，用户需要自己编写比较函数，选择自己需要的方式
 * 功能二：用户直接存储整数，且范围在当前机器位数下uintptr_t能够表示的范围中，那么此时用户可以
 * 使用此默认比较函数，它可以满足该范围的数据的比较需求，且比较结果从小到大升序，如果用户需要
 * 降序或者其它排序方式，也需要自定义比较函数，cstl不提供默认降序比较函数
 * 功能三：如果用户需要存储的数据较大，必须用无符号长整型才能存储，那么该函数会将无符号整数
 * 转化为有符号整数进行比较，此时排序结果不是预期的，建议用户自定义比较函数来解决这种情况的数据比较，
 * 即对于大数A = uintptr_t(-1) 和 大数 B = 1ULL<<50，目前的函数会认为A < B，实际上A是大于B的。
 * 由于C语言无模板功能不能处理所有情况，建议用户在阅读该说明之后，根据自己的需求定义合理的比较函数。
 */
int32_t VOS_IntCmpFunc(uintptr_t data1, uintptr_t data2);

/**
 * @ingroup vos_common
 * 默认字符串比较函数
 * @retval #(strcmp((char *)addr1, (char *)addr2))
 */
int32_t VOS_StrCmpFunc(uintptr_t addr1, uintptr_t addr2);

/**
 * @ingroup vos_common
 * @brief 用户数据拷贝函数原型
 * @attention 注意：源缓冲区长度需要调用者获取，由于不知道数据类型和长度，因此钩子函数需要业务自己实现。
 * @param src [IN] 源缓冲区
 * @retval 目标缓冲区，NULL表示失败。
 */
typedef void *(*VosDupFunc)(void *ptr);

/**
 * @ingroup vos_common
 * @brief 用户内存释放函数原型
 * @par 描述：资源释放函数原型，一般用于机制批量free内存时，内存中可能含有用户私有资源，这是需要用户自行释放
 * @param ptr [IN] 指向用户数据的指针
 * @retval 无
 */
typedef void (*VosFreeFunc)(void *ptr);

/**
 * @ingroup vos_common
 * @brief key和value函数原型对
 * @par 描述：key和value的拷贝及释放函数成对出现。
 */
typedef struct {
    VosDupFunc dupFunc;
    VosFreeFunc freeFunc;
} VosDupFreeFuncPair;

/**
 * @ingroup vos_common
 * @brief 该API通过结构的某个成员变量，得到这个结构的起始地址。
 * @par 描述：
 * 该API通过结构的某个成员变量，得到这个结构的起始地址。该API是一个特殊的宏，输入参数取决于宏的实现。
 * @attention
 * @param ptr [IN] 该参数表示结点某成员的地址。取值范围为数据类型。
 * @param type [IN] 该参数表示传入的成员所属的结点类型结构。取值范围为数据类型。
 * @param member [IN] 该参数表示结构中成员变量的名字。取值范围为数据类型。
 * @retval 与入参类型相同结构的地址。
 * @see 无。
 */
#define VOS_CONTAINER_OF(ptr, type, member) \
    ((type *)((char *)(ptr) - (uintptr_t)(&((type *)0)->member)))

static inline const char *VOS_CstlVersion(void)
{
    return "2.3(2021-03-04)";
}

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* VOS_COMMON_H */