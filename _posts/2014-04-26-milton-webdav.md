---
title: Milton WebDAV框架
category: 
    - technique
    - share
layout: post
---
WebDAV是个不错的用于文件分享的协议，相比传统FTP有很多优势，详细介绍参考[百度百科“WebDAV”](http://baike.baidu.com/link?url=bEvQF5zL1SP-K1hTJc6zciLc0DAnPPS_9yy9eWbMN_6lq3bxHe8R35vcfRtV6Dys)。

> WebDAV （Web-based Distributed Authoring and Versioning） 一种基于 HTTP 1.1协议的通信协议。
> 它扩展了HTTP 1.1，在GET、POST、HEAD等几个HTTP标准方法以外添加了一些新的方法，使应用程序可直接对Web Server直接读写，
> 并支持写文件锁定(Locking)及解锁(Unlock)，还可以支持文件的版本控制。

WebDAV的一大妙用就是可以在Windows与OS X下映射为网络磁盘，所以如果开发网盘，能支持WebDAV协议绝对能给用户提供很大的便利。
然而自己参考WebDAV的spec文档在服务端实现WebDAV协议实在是让人头痛欲裂，Milton WebDAV框架为你排忧解难。
