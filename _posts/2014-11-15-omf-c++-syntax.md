---
title: 你不知道的C++黑暗代码界
category: 
    - technique
    - share
layout: post
---

C++算是个老当益壮的编程语言，虽然老但是依然活跃于各种类型的项目，在很多场合下甚至是唯一的选择。
然而相比于新生代的编程语言，C++的语法之糟糕真的是臭名昭之，
有时候会发现奇特的语法居然能用，有时候花几个小时最后才发现看起来没啥问题的代码是错的。
下面来看看我都收集到了些啥，说不定就有你不知道的东西：

### 指针的[]运算符
    
    int a[] = {1, 2, 3, 4, 5, 6};
    int b = a[3];
    int c = *(a + 3);
    int d = 3[a];
    int e = 0[a + 3];

看到上面的代码，熟知C++的小伙伴们一定觉得a、b、c的值显而易见。但是看到d、e你有没有觉得这特么写的是啥？这也能编译得过？

事实上这段代码是绝对合法的C++代码，而且b、c、d、e的值最后是一样的。
其实C++默认（没有被重载过）的[]运算符与指针取值运算等价，`a[b]`与`*(a+b)`是一样的意思。

不过我称呼这个是个语法炸弹，因为它虽然能编译，但是会给不知道的人带来极大的阅读障碍。可以有效用来坑队友。


### 逗号运算符

    int wtf_shit_is_this(int a, int b) {
        int c = 3, d;
        d = a + 3, b + 1, c - 2;
        if(a += c, a > b)
            return b, d;
        else
            return a, c;
    }
    ...
    x = wtf_shit_is_this(1, 2);

这特么又是啥？知道x最后等于几吗？答案是4。
如果有人问你C/C++运算优先等级最低的运算符是什么，你会知道吗？答案是“,”，所谓逗号运算符。
在上面的代码当中前两行与最后一行的逗号是我们常见的写法，但他们并不是逗号运算符，中间的那几行才是。
逗号运算符是个二元运算符，其默认表现是直接返回后者，所以`a,b`的运算结果是b。

但是因为逗号具备最低运算优先级，所以“=”赋值运算会在“,”之先执行，所以上面代码的d最后结果是`a + 3`。
不过如果改写成`d = (a + 3, b + 1, c - 2);`，d就会是`c - 2`。
返回的时候，并没有其他运算符与“,”发生竞争，所以直接返回了d。

如同众多的C++运算符一样，逗号运算符也可以重载。比如下面的用法会不会让你眼前一亮？

    enum Place {new_york, washington, ...};
    pair<Place, Place> operator , (Place p1, Place p2)
    {
        return make_pair(p1, p2);
    }
    map< pair<Place, Place>, double> distance;
    ...
    distance[new_york, washington] = 100;


### 前往运算符
    
    int a = 10;
    while(a --> 0) { // a goes to 0
        printf("%d ", a);
    }

上面会代码会输出10 9 8 7 6 5 4 3 2 1，也许你猜到如此，但你知道这个前往运算符吗？
还有“运行至”运算符：

    int a = 10;
    while(a -->> 0) { // a runs to 0
        printf("%d ", a);
    }

你会发现输出结果是一样的，这是两个神奇的运算符，哈哈，我不多讲，自己去寻找答案吧少年。


### 代码嵌入个广告？

    int a = 0;
    http://davidaq.com
    a++;
    printf("%d", a);

上面的东西真的没问题吗？放心，编译器告诉你这代码没问题，程序会顺利的输出1。
上面`http:`被识别为一个标签，通过goto可以转移到这里，而//后面的东西只是注释而已。


### 最后来点有意思的代码

下面的这些东西在特定场合都是合法的C++代码，懂英文的小伙伴们看完会不会心一笑？

    long long ago; // in a galaxy far far away
    unsigned long contract;
    unsigned check;
    auto mobile;
    short pants;
    short sighted;
    double kill;
    float away;
    class dismissed;
    struct dumb by[sizeof pants];
    throw up;
    goto hell;

