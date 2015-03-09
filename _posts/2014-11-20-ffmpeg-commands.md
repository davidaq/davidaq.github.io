---
title: FFmpeg实用命令
category: tutorial
layout: post
---
FFmpeg是一个开源免费跨平台的视频和音频流方案，属于自由软件。
别看这东西只有几十Mb，但却是个能格式转换、剪辑、播放几乎无所不能的命令行软件。
就如格式工厂，其核心也是FFmpeg。
在专业领域常被部署在服务端，用以做云端视频相关服务。
如七牛云存储就是利用FFmpeg来完成各种格式转换的。
其官方网址为：[FFmpeg.org](http://ffmpeg.org/)。
在那里可以下载到各种主流电脑平台的FFmpeg程序。

FFmpeg主要包含四个程序：

 - `ffmpeg`     主要用于对媒体文件的内容进行操作，如格式转换等，是最主要的部件
 - `ffplay`     简易播放器，虽然没有什么UI，但是能播放各种格式的视频
 - `ffprobe`    用于探查媒体文件的属性，如meta标签等，可以选择输出JSON或XML格式
 - `ffserver`   流媒体服务器，不可多得的免费流媒体服务器软件，可用于架设视频直播

FFmpeg除了提供可运行程序，还提供一套libav多媒体处理C库，可集成到别的软件当中提供多媒体文件解码、编码等功能。

本文主要列出一些比较常用的ffmpeg命令，不对其他三个程序赘述。
对于一些比较专业的命令，本文也不会过多叙述，因为那需要更多的多媒体文件基础知识才能理解。
另外注意，这里讲的是正统的FFmpeg，而不是Debian搞出来的分支LibAV，里面那个ffmpeg（Ubuntu内置的）。

#### 格式转换
ffmpeg最常用功能就是格式转换，在这里要特别提的是，音、视频文件格式有两个容器格式（如mov、flv)与编码格式（如H.264）。
很多人知道前者，却不知道后者，二者的关系与异同可在别处查到，不在此赘述。
简单的格式转换如下：

    ffmpeg -i input.flv output.mp4

上面的命令就把一个flv文件转换成了一个mp4文件，其中`-i xxx.xxx`指定的输入文件，单独写的文件名指定输出文件路径。

一般FFmpeg会根据文件格式选择最合适的容器格式与编码格式，也可以手动指定。
常见的用例是需要一个保留alpha通道的视频，通常会使用mov容器格式，png编码格式，但是FFmpeg会默认使用H.264编码格式（不支持透明）。
如此命令如下：

    ffmpeg -i input.flv -c:v png output.mov

想要知道自己的FFmpeg都支持哪些容器格式，使用命令`ffmpeg -formats`。
看都支持哪些编码格式，使用命令`ffmpeg -codecs`。

#### 尺寸变换
想把大而高清的视频，变成尺寸较小，文件大小也更小的视频也是个普遍用例。
下面这个命令就可以完成改变尺寸的任务，对图片文件也有效。

    ffmpeg -i input.mp4 -s 640x360 output.mp4

上面的命令由`-s 640x360`定义了输出视频的画面尺寸会是640x360。

#### 剪切
只想取视频的某一部分也有很方便的命令：

    ffmpeg -i input.mp4 -ss 5 -t 10 output.mp4

上面的命令`-ss 5`指定从输入视频第5秒开始截取，`-t 10`指明最多截取10秒。
但是上面的命令可能会比较慢，更好的命令如下：

    ffmpeg -ss 5 -i input.mp4 -t 10 -c:v copy -c:a copy output.mp4

上面的命令把`-ss 5`放到`-i`前面，与原来的区别是，这样会先跳转到第5秒在开始解码输入视频，而原来的会从开始解码，只是丢弃掉前5秒的结果。
而`-c:v copy -c:a copy`标示视频与音频的编码不发生改变，而是直接复制，这样会大大提升速度，因为这样就不需要完全解码视频（视频剪切也不需要完全解码）。

#### 图片序列与视频的互相转换
ffmpeg可以把一组图片转换成一个视频（可以把gif动画也当成一种视频格式），反之亦可。命令如下

    ffmpeg -i %04d.jpg output.mp4
    ffmpeg -i input.mp4 %04d.jpg

第一行命令是把0001.jpg、0002.jpg、0003.jpg等编码成output.mp4，第二行则是相反把input.mp4变成0001.jpg……。
`%04d.jpg`表示从1开始用0补全的4位整数为文件名的jpg文件序列。
如果想要序列文件名为hello_00001.png等等的话，就是`hello_%05d.png`

如果编码视频的时候还想加入声音，则如下这般添加一个输入文件：

    ffmpeg -i input.mp3 -i %04d.jpg output.mp4

#### 提取音乐中的封面图片
有些音乐文件包含专辑封面图片在里面，可以用如下命令简单取出。

    fmpeg -i input.mp3 cover.jpg


#### H264视频首位拼接
如果确定输入文件都是H264编码，且尺寸、帧率等都相同，先把源视频转换成用于直播的ts格式。
然后直接对多个ts文件进行文件级的拼接，然后在转换回到目标格式。这个过程中，不会发生格式转换，所以非常迅速。

    ffmpeg -i q.mp4 -c copy -bsf h264_mp4toannexb q.ts
    ffmpeg -i r.mp4 -c copy -bsf h264_mp4toannexb r.ts
    ffmpeg -i "concat:q.ts|r.ts" -c copy -bsf aac_adtstoasc qr.mp4
