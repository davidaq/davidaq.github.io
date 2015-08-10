---
title: Shell控制台输出颜色表
category: 
    - technique
    - share
layout: post
---
在Linux/Unix操作系统的控制台，通过特殊的输出格式可以改变输出文字的字体，彩色的输出非常有助于调试程序，区分日志输出的重要程度。
最基本的用法就是在控制台中用`echo -e "\033[...m"`的方式改变接下来的输出格式，`...`代表字体代码，可以改变文字颜色、背景色，已经突出程度。

下面的代码可以输出一张字体表：

    #!/bin/bash
    T='Text'

    echo -e "         --       40       41       42       43       44       45       46       47 ";
    for FGs in '   0' '   1' '  30' '1;30' '  31' '1;31' '  32' '1;32' '  33' '1;33' '  34' '1;34' '  35' '1;35' '  36' '1;36' '  37' '1;37';
        do FG=${FGs// /}m 
        echo -en " $FGs \033[$FG  $T  "
        for BG in 40m 41m 42m 43m 44m 45m 46m 47m;
            do echo -en "$EINS \033[$FG\033[$BG  $T \033[0m\033[$BG \033[0m";
        done
        echo;
    done
    echo -e "\033[0m"

输出结果如下图所示：

<img src="/res/2015-08-10-shell-console-color-table.png" style="max-width:100%"/>
