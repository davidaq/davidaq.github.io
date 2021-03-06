---
title: LZ4超快压缩算法
category: technique
layout: post
---

现如今压缩算法多如牛毛，因为数据压缩在很多场合都扮演非常重要的角色。
不同的压缩算法都有不同的侧重点，于是也就会有最适合的场合。
前不久接触到一种让我使用起来不禁惊呼实在太快了的压缩算法：LZ4。

最近在做的渲染器当中有一个很关键的部分需要在内存里缓存大量的RGBA原始图片数据，然而因为目标设备是移动设备，所以内存使用的问题十分令人头痛。
问题在于，如果直接按原样保存在内存里，最终内存占用会超过移动设备所允许的范围，所以必须对这些缓存数据进行压缩。
在我们的用例当中，这个被缓存的数据会被经常调出来使用（经常的级别是每秒都需要被解压使用），所以速度尤为重要。
第一个闪过我脑中并且也付诸实施的是JPEG压缩，因为这是最出名的图片压缩算法，其速度与压缩率，以及其提供的有损压缩都十分出众。
于是我们的做法就是把图片的Alpha通道取出来用ZIP压缩，RGB部分用JPEG压缩。
这确实解决了移动设备上内存吃紧的问题，但是很遗憾的是这个压缩过程让我们的渲染速度降低了近乎一倍。
经过我们仔细测试，最终发现最耗时的还是JPEG图片解码的过程，而非曾经猜想会可能拖后腿的ZIP。
毕竟我们大部分的图也没有透明度，即使ZIP相对来说会慢也不会对我们有太多影响。
但最终面对移动设备内存容量的问题，我们妥协了一段时间。

但是我并没有放弃寻找一个更好的方案，压缩是肯定要压缩，但是用什么方式压缩既可以极快地解压缩，又可以提供比较可观的压缩率，是问题的关键。
我甚至试过了png(基于zip)、gzip、bzip、tiff（基于lzw）、纯huffman等这些早已证实不会比JPEG更好的的选项，但结果都不出意料，没一个能比JPEG表现得更好。
不过最后LZ4进入了我的视野，它号称是世界上最快的压缩算法，其开发者称在酷睿双核的测试机器上跑压缩，制约其速度已经不是CPU计算速度，而是内存的IO能力。
这已经真的称得上*实时的*压缩算法了。
在PC机器上单核压缩速度能达到400M/s，解压可达到1G/s，当真称的上速度之王。

我并没有系统地做过任何测试，无法用自己的数据来说话。不过很多人已经跑过测试，而官方给出的测试数据如下：

    测试环境：Core i5-3340M @2.7GHz，单线程
    压缩库名称          压缩率  压缩速度M/s  解压速度M/s
    LZ4 (r101)          2.084      422          1820
    LZO 2.06            2.106      414           600
    QuickLZ 1.5.1b6     2.237      373           420
    Snappy 1.1.0        2.091      323          1070
    LZF                 2.077      270           570
    zlib 1.2.8 -1       2.730       65           280
    LZ4 HC (r101)       2.720       25          2080
    zlib 1.2.8 -6       3.099       21           300

可以看出虽然压缩率稍显不足，但是速度真是无可匹敌。
而且LZ4十分容易集成到项目当中去，必要的核心代码就一个C文件与一个头文件。
在我们的项目当中用这个来代替JPEG后，虽然内存使用量比JPEG版本多了一些，但是在可接受范围内，但是大快人心的是，其占用的CPU时间真的是近乎可以忽略。
我们也终于找到了合适自己这种场合的压缩算法。

后来经过更多调研，发现这个压缩算法被广泛地用于许多备份系统、分布式计算系统等，在专业领域非常热门。
