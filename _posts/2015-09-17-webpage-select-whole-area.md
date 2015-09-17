---
title: 在网页中实现区域全选
category: 
    - technique
    - tutorial
layout: post
---

微信是现如今国内移动互联网最主要的一个传播平台，不管是做APP还是做网站都希望能通过微信传播。
而尤其是APP，最终目标还是要用户通过微信打开自己的APP，更希望用户在微信里打开的网页能够
与自己APP进行一定程度的关联。然而微信却并不喜欢用户离开，所以把各种跳转的路子都封锁了。
这时腾讯的死对头阿里巴巴却又找到了一个天才般的突破口，那就是利用剪贴版这个微信难以或者说
根本无法劫持的系统功能。如此淘口令、支付宝红包口令就诞生了。用户在微信里复制一个口令，
再打开支付宝、淘宝，就可以直接打开相应的页面使用相应的功能了。这种想法很天才也很有效，
但是在实际网页开发中会遇到一些问题。目前在手机浏览器里是无法做到直接操作剪贴版的，
所以只能让用户自己选择然后复制。但是选择又会遇到问题：怎么才能让用户直接选满整个口令，
而是只选择了一部分，导致用户还得调整选择区域？

我在最近的项目中也遇到了这个问题，也找到了一点资料，不过都有一些过时，所以只好自己研究。
现在我把结果在此总结。我的目标只要实在微信里实现这个功能，至于其他的浏览器则不太过考虑。

微信的网页浏览器并不是单独开发的浏览器，而是系统带的WebView（iOS里是UIWebView），
都是webkit内核，所以我也只关注webkit内核。不过即使如此，安卓和iOS还是有区别的。甚至于，
刚出来的iOS9还跟之前的iOS7、8有区别，安卓4.4也是因为将WebView改成了Chromium内核，
所以跟之前的版本也会有所区别。

最终根据我的实验，发现以下可以影响选择区域的关键点：

- CSS中的`user-select`属性。很多人知道可以设置为`none`来禁止某些区域被选择，但是还有个属性
  `all`，他可以让这块区域只能被全部选择。这和我们的目标非常契合，但经过测试，只有PC上的
  safari、chrome等以及iOS8的safari支持。安卓的浏览器无法识别这个熟悉直接禁止该区域选择，
  而iOS9直接忽略属性还需要用户自己调整选择区域。
- `document.body.createTextRange()`以及`window.getSelection().addRange()`可以改变用户的选择区域，
  而一些浏览器会在发生选择的时候产生`selectionchange`事件。可以组合使用达到在发现用户开始选择时，
  直接改变选择区域。然而这种方法在安卓4.2及以下系统无效，甚至在个别4.3系统中也无效。不过iOS9的
  safari倒是可以被这种方法覆盖。
- 带有href属性的a标签在很多手机浏览器中都是会被整体选择的，但是在iOS中选择后却没有复制文本的选项，
  只有复制链接。不过iOS已经被前面的方法覆盖，所以无所谓了。

于是最终的组合就是这样的，为了方便，此处假设已加载jQuery：

    <div class="select-all">I want to be selected as a whole! Don't chomp me down</div>
    <style type="text/css"> .select-all {-webkit-user-select:all} </style>
    <script type="text/javascript">
    (function() {
        var u = navigator.userAgent;
        var ele = $('.select-all')[0];
        if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {
            // 此处将div转变成a
            var atag = $('<a href="/">' + $(ele).html() + '</a>');
            $.each(ele.attributes, function(i, attribute){
                atag.attr(attribute.nodeName, attribute.nodeValue);
            });
            $(atag).on('click', function(e) {
                // 阻止触发点击事件，防止链接被打开
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
            $(ele).replaceWith(atag);
        } else {
            var debounceMark = false; // 改变选区导致防止循环触发事件
            document.addEventListener("selectionchange", function() {
                if (debounceMark)
                    return;
                debounceMark = true;
                setTimeout(function() {
                    debounceMark = false;
                }, 20);
                if (document.body && document.body.createTextRange) {
                    var range = document.body.createTextRange();
                    range.moveToElementText(ele);
                    range.select();
                } else if (window.getSelection) {
                    var selection = window.getSelection();        
                    var range = document.createRange();
                    range.selectNodeContents(ele);
                    selection.removeAllRanges();
                    selection.addRange(range); 
                }
            }, false);
        }
    })();
    </script>

