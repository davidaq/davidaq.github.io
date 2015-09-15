---
title: C语言malloc遭遇内存严重碎片化
category: technique
layout: post
---

前些时日要在安卓与iOS平台上实现一个类似GIF的动态图片格式的解析与生成。
为了不用写两份代码，而且感觉逻辑结构不复杂，果断选择使用C语言，连C++都不想用。
标准C语言依然是那么干净纯洁，虽然相比较于C++缺乏一些强大的特性，但是它结构简单，
只具备必要的特性，就像写Lua代码一样让人感觉一切都在掌握中，这种感觉很好。
然而美妙的世界很快就打破了，尽管我很谨慎又巧妙地对待指针，没有一丝的泄露，
但是最终我遭遇了malloc地狱，它由快变慢，直到最后在经过漫长的沉默后给我了NULL。

事情详细点的经过是这样的，众所周知在C/C++中堆内存的使用是需要非常谨慎的，
过早的释放、不释放以及多次释放都会导致不可预知的严重错误，也是基于这个理由，
大部分开发者对这基础语言敬而远之，新的编程语言也都隐藏了内存管理与指针的概念。
但是对于一些图形处理算法来说，能直接访问内存实现起来会比较方便，
并且想要尽量不重写代码跨越iOS与安卓，C/C++也是不可避免。逃不掉要与指针打交道，
于是我仿照早期Objective-C早期手动计数的设计，制作了一个简单的指针管理框架
（在本文最后附上代码）。这小东西用起来颇为方便，我还顺带把析构函数给加上了，
最后也证明效果不错，只需稍加留意就不会出现任何内存泄露，也不会过度释放。
由于太方便了，所以我开始大肆使用它，很迅速地就把我需要完成的功能做好了。
在PC机上运行良好，性能等各方面都没有问题，然而移植到手机上的时候开始出问题了。

放到iPhone上测试，运行没过一会儿就发出内存警告并强制退出了。一开始我很疑惑，
因为在Xcode的监控上来看，就算最高的时候我也只占用了十几MB的内存，根本不算高。
但是Xcode上出现的日志信息却是实实在在地告诉我内存即将耗尽。我的第一反应是，
Xcode坏了，于是拔掉了数据线，让程序脱离调试环境运行，但程序依然崩溃了。
我也很崩溃，想不清楚为什么会这样。我单步调试，最终发现，当iPhone发出警告后，
我程序中的malloc函数居然在卡死了一会儿之后返回了0（NULL）。
这确实是内存耗尽的表现，但是我确认我的程序从逻辑上讲不会同时占用那么高的内存，
监控数据也告诉我确实没占用那么多。

稍作调查，我才恍然大悟，原来是太过于频繁地占用大片连续的堆内存，然后又不确定地释放，
导致系统堆内存碎片化（Memory Fragmentation）严重，我之前对此有所耳闻却从来没有放在心上，
直到这次太过肆意地使用堆内存，才知道这问题原来如此可怕。网上有不少人讨论这个问题，
比如更换一个更先进的malloc实现。其原理大多是规整分配内存的大小，然后释放的时候不立刻归还给系统，
而是缓存在一个池子中，等后面再分配给类似大小的内存申请。这样就可以尽量避免内存最后变得坑坑洼洼，
很难获得大片连续的内存。这些版本中有不少佼佼者，如大名鼎鼎的dlmalloc、jemalloc等。
然而很多资深工程师却认为，换个malloc版本也许能缓解一下，但是真正能理解并能准确把我释放和复用时机的，
只有开发者本人。所以我最后老老实实地优化了自己的代码，能复用的内存尽量复用。

最后问题解决了，程序持续运行几个小时也不会有任何不良表现。然而这次教训让我更加崇敬先人的伟大，
像带有GC机制的很多语言除了规整与复用内存分配，还会在适当的时机通过移动已分配的内存片段，
整理内存碎片，说着容易却需要克服很多困难。一个优秀的编程语言不光要看语言本身语法的设计，
还要看其运行环境的技术先进性。

下附我的指针管理代码：

==== mem.h

    #ifndef HEADER_MEM_H
    #define HEADER_MEM_H
    
    // convient macro for creating objects
    #define NEW(type, owner) (type*)Mrelease(Mretain(owner, Malloc(sizeof(type))))
    #define NEW_ARRAY(type, count, owner) (type*)Mrelease(Mretain(owner, Malloc(sizeof(type) * count)))
    
    // allocate a reference counted pointer
    // counter will start with 1
    #define Malloc meplus_Malloc
    void* Malloc(size_t size);
    
    // attach destruct function on pointer
    // called after pointer reference count drops to 0
    // and before the pointer memory is actully freed
    typedef void (*DestructFunction)(void*);
    #define Mdestruct meplus_Mdestruct
    void* Mdestruct(void* ptr, DestructFunction);
    
    // tag pointer with another pointer
    // return pointer for convience
    #define Mtag meplus_Mtag
    void* Mtag(void* ptr, void* tag);
    
    // retrieve tag of pointer
    #define Mtagof meplus_Mtagof
    void* Mtagof(const void* ptr);
    
    // increase the counter of the referenced pointer
    // if owner provided, pointer will be released when owner is destroyed
    // return pointer for convience
    #define Mretain meplus_Mretain
    void* Mretain(void* owner, void* ptr);
    
    // decrease the counter of the referenced pointer
    // if the counter drops to 0, the pointer will be freed
    // the destruct function will be called first if it exists
    #define Mrelease meplus_Mrelease
    void* Mrelease(void* ptr);
    
    #endif


==== mem.c:
    
    #include <stdio.h>
    #include <stdint.h>
    #include <stdlib.h>
    #include <string.h>
    #include <pthread.h>
    
    typedef struct MemOwnage {
        unsigned char cursor;
        void** stackfront;
        void** stackend;
    } MemOwnage;
    
    typedef struct MemInfo {
        DestructFunction destructor;
        unsigned int counter;
        MemOwnage* own;
        void* tag;
    } MemInfo;
    
    #define MemOwnageBufferSize 10
    
    #ifdef MEMORY_PROFILE
    static int memCount = 0;
    #endif
    
    #ifdef PTHREAD_LOCK
    static pthread_mutex_t* lock = NULL;
    #define LOCK pthread_mutex_lock(lock);
    #define UNLOCK pthread_mutex_unlock(lock);
    #define LOCK_INIT if(!lock) {lock = malloc(sizeof(pthread_mutex_t));pthread_mutex_init(lock, NULL);}
    #else
    #define LOCK
    #define UNLOCK
    #endif
    
    void* Malloc(size_t size) {
        LOCK_INIT
    #ifdef MEMORY_PROFILE
        LOCK
        memCount++;
        UNLOCK
    #endif
        static const size_t ptrSize = sizeof(DestructFunction);
        static const size_t ptrSizeMask = sizeof(DestructFunction) - 1;
        size += sizeof(MemInfo);
        size += ptrSize - (size & ptrSizeMask);
        void* mem = malloc(size);
        if(mem == NULL) {
            return NULL;
        }
        MemInfo* info = (MemInfo*)mem;
        info->destructor = NULL;
        info->counter = 11; // pad 10 to guard from wrapping, i.e. 11 represents 1
        info->own = NULL;
        info->tag = NULL;
        return mem + sizeof(MemInfo);
    }
    
    void* Mdestruct(void* ptr, DestructFunction destructor) {
        if(!ptr) return NULL;
        MemInfo* info = (MemInfo*)(ptr - sizeof(MemInfo));
        info->destructor = destructor;
        return ptr;
    }
    
    void* Mtag(void* ptr, void* tag) {
        if(!ptr) return NULL;
        MemInfo* info = (MemInfo*)(ptr - sizeof(MemInfo));
        info->tag = tag;
        return ptr;
    }
    
    void* Mtagof(const void* ptr) {
        if(!ptr) return NULL;
        MemInfo* info = (MemInfo*)(ptr - sizeof(MemInfo));
        return info->tag;
    }
    
    void* Mretain(void* owner, void* ptr) {
        if(!ptr) return NULL;
        LOCK
        MemInfo* info = (MemInfo*)(ptr - sizeof(MemInfo));
        info->counter++;
        if(owner) {
            info = (MemInfo*)(owner - sizeof(MemInfo));
            MemOwnage* own;
            if(!info->own) {
                own = info->own = (MemOwnage*)malloc(sizeof(MemOwnage));
                own->cursor = 0;
                own->stackfront = (void**)malloc((MemOwnageBufferSize + 1) * sizeof(void*));
                own->stackend = own->stackfront;
                own->stackend[MemOwnageBufferSize] = 0;
            } else {
                own = info->own;
            }
            if(own->cursor >= MemOwnageBufferSize) {
                void** nstack = (void**)malloc((MemOwnageBufferSize + 1) * sizeof(void*));
                own->stackend[MemOwnageBufferSize] = nstack;
                nstack[MemOwnageBufferSize] = 0;
                own->stackend = nstack;
                own->cursor = 0;
            }
            own->stackend[own->cursor++] = ptr;
        }
        UNLOCK
        return ptr;
    }
    
    void* Mrelease(void* ptr) {
        if(!ptr) return NULL;
        LOCK
        void* mem = ptr - sizeof(MemInfo);
        MemInfo* info = (MemInfo*)mem;
        info->counter--;
        BOOL destroy = info->counter < 11;
        UNLOCK
        if(destroy) {
    #ifdef MEMORY_PROFILE
            LOCK
            memCount--;
            printf("mem: %d\n", memCount);
            UNLOCK
    #endif
            if(info->destructor) {
                info->destructor(ptr);
            }
            MemOwnage* own = info->own;
            free(mem);
            if(own) {
                void** ptr = own->stackfront;
                while(ptr) {
                    void** next = (void**)ptr[MemOwnageBufferSize];
                    for(int i = 0, c = next ? MemOwnageBufferSize : own->cursor; i < c; i++) {
                        Mrelease(ptr[i]);
                    }
                    free(ptr);
                    ptr = next;
                }
                free(own);
            }
            return NULL;
        }
        return ptr;
    }


