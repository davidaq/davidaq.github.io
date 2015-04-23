/****
 * This is a proxy configuration that AQ uses and may share with friends
 ****/

function needProxy(host) {
    var plist = [
            '*facebook.com',
            '*google*',
            '*.yimg.com',
            '*.blogspot.com',
            '*stack*.com',
            '*sstatic*',
            '*bdsm*',
            '*bondage*',
            '*gravatar*',
            '*youtube*',
            '*github*',
        ];
    var wlist = [
            '*baidu*',
            '*163*',
            '*qq*',
            '*tencent*',
            '*csdn*',
            '*me-v*',
            '*ccme*',
            '*qingcloud*',
            '*jd.com',
            '*taobao*',
            '*upyun*',
            '*qiniu*',
            '*upai*',
            '*youku*',
            '*ali*',
        ];
    for(var k in plist) {
        if(shExpMatch(host, plist[k]))
            return true;
    }
    for(var k in wlist) {
        if(shExpMatch(host, wlist[k]))
            return false;
    }
    var ip = dnsResolve(host);
    if(isInNet(ip, '127.0.0.0', "255.0.0.0")) {
        return false;
    }
    if(isInNet(ip, '10.10.0.0', "255.255.0.0")) {
        return false;
    }
    if(isInNet(ip, '192.168.0.0', "255.255.0.0")) {
        return false;
    }
    if(isInNet(ip, '172.0.0.0', "255.0.0.0")) {
        return false;
    }
    if(isInNet(ip, '173.0.0.0', "255.0.0.0")) {
        return false;
    }
    return true;
}
function FindProxyForURL(url, host) {
    if(needProxy(host)) {
        return 'SOCKS waaa.me-v.cn:19747';
    }
    return 'DIRECT';
} 
