---
title: PhantomJS在网页前端ui监控的应用
category: 
    - share
    - technique
layout: post
---

英语中phantom的意思是虚幻、幽灵。PhantomJS是一个“幽灵”浏览器，没有图形界面却具备一个完整浏览器的功能。
官方网站（phantomjs.org）上的介绍说PhantomJS是一个headless（无图形界面或纯命令环境）的可编程WebKit浏览器。
用法与时下流行的NodeJS颇为相似可以用于直接执行JS脚本，但是重点提供创建、销毁、与控制WebKit浏览器的API。

PhantomJS基于Qt以及其提供的WebKit，能轻松提供跨平台的支持，在Linux、OS X、Windows下都有预先编译好的版本。
在本文编著的时候最新的版本是v2.1，相比较于v1.x版本，在稳定性以及功能上都有极大的提升。
项目在GitHub维护，现在虽然还在不时地更新，但是实际开发已经不再活跃，日后是否还会有重大突破是个无法指望的事情。

PhantomJS作为一个可编程的浏览器，其最大的意义就是运行自动任务或批量任务。
在网络爬虫、定时任务、自动测试等领域都有其发挥作用的身影。而实现自动网页ui测试正是笔者近期的一个工作重点。


### 前端自动化测试和监控的意义

QA测试是软件开发活动当中不可忽视的一个重要环节，任何一个产品相提升其质量都需要在此大量投入。
而测试存在大量的重复操作，将其自动化可以有效地降低人力消耗同时提高速度，而定时自动化测试就构成了监控的核心。
监控的意义在于做到第一时间发现问题，在造成损失前进行报警。

目前服务端接口的监控已存在各种成熟强大的方案，通过调用接口、分析日志做到监测服务运行状态并收集性能和安全指标。
然而前端ui的自动测试与监控因为情况更为复杂，业界目前没有十分成熟的方案，但很多团队都在致力于推动这方面的发展。
只有直接对ui测试验证才能算是对产品的整体验证，更贴近用户的实际使用情况。
定时验证产品的整体流程可以及时地发现产品迭代有没有对已有功能造成破坏，只是对接口进行监控是无法覆盖到前端的。
PhantomJS也许无法100%模拟真实用户的终端，但是模拟产品的主要使用流程正合用，而且部署简单，不依赖复杂的架构。


### bdwm-orion介绍及其实现思路

我们百度外卖Numen自动测试平台已经推出一段时间了，近期刚上线了ui用例的支持。
我们为了支持这部分功能，开发了一个NodeJS小工具`bdwm-orion`，可通过npm安装。
它是一个命令行工具，用于执行事先编写好的JSON格式的用例脚本。
以NodeJS+PhantomJS为基础，提供了更加便捷的用例步骤书写方法，并在执行后生成一个报告，描述用例的执行结果以及错误信息。

它的输入如下所示：

    {
      "option": {
        "url": "http://waimai.baidu.com/waimai?qt=about",
        "ignore_page_error": true
      },
      "operation": [
        {
          "name": "点击链接",
          "action": "click",
          "target": ".footer-item.help a:eq(1)"
        },
        {
          "name": "断言当前网址",
          "action": "assert",
          "target": "document.location.href",
          "expect": "http://waimai.baidu.com/waimai?qt=helpusage"
        }
      ]
    }

然后会生成如下的报告：

    {
      "id": 0,
      "failed_res": [],
      "console_log": "",
      "console_error": "",
      "status": 0,
      "detail": [
        {
          "name": "点击输入框",
          "action": "click",
          "target": ".footer-item.help a:eq(1)",
          "status": 1
        },
        {
          "name": "输入搜索内容",
          "action": "input",
          "target": ".search input",
          "value": "下午茶",
          "status": 1
        },
      ]
    }

在内网wiki（http://wiki.baidu.com/pages/viewpage.action?pageId=196020744）
或npm（https://www.npmjs.com/package/bdwm-orion）可获取更详细的用法说明。

bdwm-orion通过`phantom`模块使用了PhantomJS提供的以下功能：

 - 创建虚拟浏览器窗口并设置诸如窗口大小、User Agent、cookie等属性
 - 在窗口中打开页面
 - 在打开的页面中执行JS脚本
 - 监听虚拟浏览器的网络请求
 - 捕获控制台输出
 - 抓取网页截图

bdwm-orion基本逻辑思路如下：

 - 首先根据配置文件初始化一个PhantomJS进程实例和窗口
 - 监听`console`输出、页面开始加载、页面加载完成、开始网络请求、网络请求成功、网络请求失败等事件
 - 在页面开始加载的时候注入一些JS库，如bluebird、jQuery
 - 通过各种网络事件记数当前尚未返回的请求
 - 在第一次页面加载完成时启动测试步骤的执行
 - 每执行一个步骤前先轮询等待所有未返回网络请求归0且保持一段时间，保证接口调用成功执行
 - 根据步骤的操作描述在页面中执行相应的JS代码，目前配置了点击、输入、提交、等待、断言等操作
 - 循环前两部直到所有步骤执行完成或者发生错误
 - 如果是因为发生错误而结束，截取网页屏幕
 - 将测试过程中收集到的所有信息包括base64编码的截屏图像组合成报告写入文件或者通过接口post给服务器
 

### PhantomJS的“坑”

PhantomJS功能虽然挺高端惊艳的，但是作为一个由只有几个人组成的小型开发社区维护的开源软件，其本身质量并不尽人意。
虽然2.x版本有很大的飞跃，但是“坑”还是很多。有一些只是需要做好配置，有的能弥补，更有的就只能忍了。

 - 基于Qt5的WebKit而非Chromiumn的开源WebKit引擎，对JS和CSS的支持比较落后
 - 对于网络请求只能收集非常有限的信息，只有url、statusCode以及发生错误时的一行错误信息，header、body等都无法获取
 - 没有原生支持Promise，可以自己注入Bluebird
 - 缺乏移动设备模拟的支持，不支持Touch事件，也不支持手机端的显示模式
 - 截图不能截取窗口可见内容而是截取整个页面
 - 截图的时候发现背景默认是黑色的而不是白色，需要在截图前先自己给body添加css
 - 虽然支持canvas但应该不完整，有时会出错，至今定位不了问题在哪里

### 那些替代品

PhantomJS是目前同类工具中存在时间比较久更加为人熟知的，存在其他替代方案但都各自有这样那样的问题。

 - Node-WebKit，由Intel发起的开源项目，十分值得期待，然而其定位并不是模拟浏览器做自动操作，而是用于开发以Web为界面的桌面应用
 - BerserkJS，国人开发的类似PhantomJS同样基于Qt Webkit但是提供一些额外的功能，需要自己编译，比较麻烦
 - Selenium，一套庞大完整的Web前端测试平台，部署复杂，缺乏移动端支持

