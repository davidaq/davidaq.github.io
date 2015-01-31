---
title: 安卓应用嵌入浏览器
category: technique share
layout: post
---
现如今的WEB技术，HTML+CSS+JS的功能性与灵活性极为迷人，而随着WEB的发展，很多手机应用也选择嵌入浏览器，用WEB技术实现UI。
为此，iOS提供了以Safari Mobile为核心的UIWebView，安卓也提供了WebKit核心WebView。
然而安卓的WebView在4.4系统版本以前都不是Chromium内核，功能少、性能差、还Bug重重。
然而做应用总不能只考虑最新的版本，总得考虑用户量最大的那部分。所以4.0~4.3的用户体验还是要顾及的。
然而WebView在老一点的系统版本上表现这么差，有什么办法呢？

其实WebView的替代品还是不少的。
比如有人以Chromium为基础做出了ChromeView，不过这个项目已经废弃了。
也有火狐团队在经营的GeckoView，不过手机火狐的性能只能算比原生WebView强一点点，而且不是WebKit体系，开发可能相对比较麻烦（Chrome及Safari都是WebKit体系的）。
还有更好的选择就是CocoonJS，不过这个主要常用来做游戏开发，还会在应用启动的时候显示CocoonJS的Logo，可能还不够理想。
那么最佳的选择就来了，由Intel赞助支持的Crosswalk Project，也是以Chromium为基础的可嵌入WEB浏览器及许多其他工具。
Crosswalk更新周期与Chromium同步，保证总是呈现最新的WEB功能特性。

嵌入浏览器可以保证即使更老的系统也能有良好的体验，然而嵌入一个浏览器也不是没有代价，他们都会扩大软件包的大小。
GeckoView会占用20M左右，Crosswalk更是会占用30M左右空间，所以在做技术选型的时候也要慎重。
