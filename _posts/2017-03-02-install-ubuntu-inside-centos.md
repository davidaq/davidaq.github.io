---
title: 如何在CentOS里安装Ubuntu
category: 
    - tutorial
    - technique
layout: post
---

背景
===

看到标题就会有人问为啥要干这种事，直接装Ubuntu系统不就好了。这件事是有背景的，一切要从公司的前端自动化测试项目想要从PhantomJS切换成Chrome说起。为何要用Chrome代替PhantomJS不是这里讨论的主题，但是要先澄清的是，我们所需要的Chrome不是普通的Chrome，而是能像PhantomJS一样运行在Linux服务器上的Chrome。

本文介绍的就是如何在已有的CentOS系统里安装一个Ubuntu（不是虚拟机，不是虚拟机，不是虚拟机）。

Chrome安装困难重重
=================

GUI支持
-------

PhantomJS的一大特色是headless（无图形界面），而Chrome虽然一直有headless计划，但是雷声大雨点小，一直没有什么实质性进展。

Linux最主流的图形系统标准是X11，在这个标准里，显示设备会通过驱动程序以X Server的形式为GUI程序提供图像显示功能。说人话就是：不插显示器就无法启动GUI程序。当然这个问题不大，毕竟在无界面的服务器上跑一些GUI程序的场景还是挺多的，所以诞生xvfb这种虚拟显示设备的工具。只要通过“xvfb run”命令启动图形程序就可以了，关于xvfb也不在这里多说。

CentOS支持
--------

真正让我遇到障碍的是安装Chrome本身。Chrome对Linux系统的支持只有Ubuntu和Fedora两个普通用户量最大的系统有最全面的支持，然而我们公司的线下docker测试环境只有CentOS这一个选择。按照官方的说法，其他Linux发行版“理论上”也是可以运行Chrome的，但是他们的QA团队不会做针对这些平台的测试，所以不保证可以正常使用。

当然我也不是那么容易死心的，Chrome多少也提供了一点关于怎么在CentOS安装的说明，一些第三方资料也表明这件事是可以实现的。所以我也按照所有能找到的线索一一尝试了一遍，其中包括用谷歌yum源，其他第三方yum源，还有自己从源码编译等等。但最终只在某云自己申请的一台Centos7的机器上成功安装了，公司支持的Centos 6.3是一次都没成功。

Chroot：Docker的今世前生
=======================

Docker是工程化领域的当红明星，他解决的核心问题就是在一个宿主机器上开辟出多个虚拟的环境，这些虚拟的环境之间相对隔离各自运行的进程互不干扰。相比较于虚拟机，这些虚拟环境之间共享更多的系统资源（通常会共享使用宿主机的Linux内核和硬件驱动），所以启动迅速，资源占用量也小很多。

回到最初的话题，我所需要的是在公司的虚拟机上跑Chrome，经过尝试，必须要先给机器装上Ubuntu。那么大部分人最容易想到的方案就是安装虚拟机，不过首先虚拟机里安装虚拟机也不简单，其次虚拟机资源占用量大且维护困难。那么我们还剩什么选择？

Linux上最早用于隔离使用环境的就是chroot指令了。这个指令功能很特别，命令的全名叫“change root”，字面意思就是改变根目录，稍微了解Linux系统的同学应该都知道，Linux的文件系统不像Windows有盘符，而是全部都是在一个目录树当中，包括ls、find、grep等各种常用命令的可执行文件都在/bin、/usr/bin、/usr/local/bin等目录下。通常chroot只是用来营造一个访问受限的系统环境（jail），比如我们relay机器就只有ssh等极少数的命令，ls、cat等常用命令全都不能用，因为这些命令可执行文件在chroot后的环境里根本找不到。一个如Centos或Ubuntu的Linux发行版其实也是以Linux内核为基础用各种可执行文件、链接库及其他资源文件构成的，如果把这些文件替换掉也就等于替换掉了发行版本。
讲到这里聪明的小伙伴一定已经知道我的意图了：把Ubuntu系统的文件复制到一个文件夹里，然后用chroot改变当前的系统根目录，是不是就进入Ubuntu环境了？告诉你，还真是这样的，而且这也是早期一种同一台机器跑不同环境的常见做法。

这种做法相比较于Docker更加轻量级，只需要：

 - 把目标发行版的系统文件复制到某个目录（如/ubuntu）
 - chroot到该目录下（如chroot /ubuntu）

不过要注意的是，chroot之后的系统环境和宿主环境共享所有的系统资源，IP、端口、进程编号等都是共用的，在chroot里启动的进程可以在外面kill掉。所以说这并不是虚拟化出来了一个独立系统，环境之间的干扰会很严重，但是对于我的需求来说，足够了。

之后我参照一份说明文档在公司的CentOS虚拟机上成功地安装了一个chroot版ubuntu，然后用apt-get install google-chrome-stable，一切都非常顺利。

Chroot版Ubuntu详细安装步骤
=========================

Ubuntu其实很贴心的专门做了安装包来支持chroot系统安装。为方便也许有其他同学对Ubuntu系统有比较迫切的需求，这里提供简要安装说明。

搜索关键词：debootstrap，我参考的链接：https://help.ubuntu.com/lts/installation-guide/powerpc/apds04.html。以下说明我的实际操作步骤。

下方说明中的“xenial”为ubuntu版本代号，可以替换成别的版本。

Step1. 创建施工目录
------------------

```
$ sudo -i
$ mkdir /ubuntu
$ cd /ubuntu
Step2.下载并解压系统安装包
$ wget http://ports.ubuntu.com/ubuntu-ports/pool/main/d/debootstrap/debootstrap_1.0.81ubuntu3_all.deb
$ ar -x debootstrap_1.0.81ubuntu3_all.deb
$ cd /
$ tar xvfz /ubuntu/data.tar.gz
```

Step3.运行安装包
---------------

```
$ /usr/sbin/debootstrap --arch i386 xenial /ubuntu
Step4.进入Chroot环境
$ LANG="zh_CN.UTF-8" chroot /ubuntu /bin/bash
```

Step5.配置apt安装镜像
--------------------

```
$ cat > /etc/apt/sources.list
deb http://mirror.bjtu.edu.cn/ubuntu xenial main
deb-src http://mirror.bjtu.edu.cn/ubuntu xenial main
deb http://mirror.bjtu.edu.cn/ubuntu xenial universe
deb-src http://mirror.bjtu.edu.cn/ubuntu xenial universe
deb http://mirror.bjtu.edu.cn/ubuntu xenial multiverse
deb-src http://mirror.bjtu.edu.cn/ubuntu xenial multiverse
deb http://mirror.bjtu.edu.cn/ubuntu xenial-security multiverse
deb-src http://mirror.bjtu.edu.cn/ubuntu xenial-security multiverse
[Ctrl]+D结束
$ apt-get update
```

cat命令可以用vim或其他文本编辑方式替代。

Step6.共享宿主系统的设备环境
--------------------------

```
$ mkdir -p /dev/pts
$ mount -n -t devpts none /dev/pts -o mode=0622
$ mkdir -p /dev/shm
$ mount -n -t tmpfs tmpfs /dev/shm
$ apt-get install makedev
$ mount none /proc -t proc
$ cd /dev
$ MAKEDEV generic
```

Finish
------

之后可以就可以把这里当做Ubuntu系统来用了，可以[Ctrl]+D退出chroot环境，如果想再回来可以重复step4，记得全程都必须是root权限操作。
在这个Ubuntu环境，除了安装chrome，我还成功地安装了百度开源深度学习框架PaddlePaddle。安装PaddlePaddle的时候需要用trusty版本的apt库。
