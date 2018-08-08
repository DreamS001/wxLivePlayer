var app = getApp();
var { RongIMClient, RongIMLib } = app.globalData;
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function getData(url,dataObj,process,process1){
  //将data对象拼接成字符串 data={start:1} 为 ?page=1&&id=2
  var queryString = '';
  for(var i in dataObj){
    queryString += i+'='+dataObj[i]+'&';
  }
  wx.request({
    url:url+queryString.substr(0,queryString.length-1),
    method:'GET',
    header: {
      'content-type': 'application/json',
      'cookie': wx.getStorageSync('sessionid')
    },
    success:function(res){
      process(res);
    },
    complete:function(){
      process1();
    }
  })
}


function postUserInfo(code, userInfo, mani) {
  wx.request({
    url: 'https://www.51aso.cn/index/wxlogin',
    method: 'post',
    header: {
      'content-type': 'application/x-www-form-urlencode'
    },
    data: { code:code, userinfo: userInfo },
    success: function (res) {
      //判断返回的数据中token是否为空
      if (res.data.stat == 200) {
        console.log(res.header['Set-Cookie']);
        var str = res.header['Set-Cookie'];
        console.log(getValue(res.header['Set-Cookie'], 'uid'));
        var cookieObj = {
          uid: getValue(res.header['Set-Cookie'], 'uid'),
          umd: getValue(res.header['Set-Cookie'], 'umd'),
          PHPSESSID: getValue(res.header['Set-Cookie'], 'PHPSESSID')
        }
        var arr = [];
        for (var key in cookieObj) {
          var str = key + "=" + cookieObj[key];
          arr.push(str);
        }
        wx.setStorageSync('sessionid', arr.join(';'));
        var app = getApp();
        //将用户uid存储到缓存user中
        var im_token='';
        console.log(1);
        console.log(res.data);
        if(res.data.userinfo.im_token){
          im_token = res.data.userinfo.im_token;
        }else{
          //再去请求新的token
          var res;
          do {
            res = getToken();
          }
          while(!res.im_token)
          console.log(2);
          console.log(res);
          im_token = res.im_token;
        }
        var obj = {
          id: res.data.userinfo.uid,
          name: res.data.userinfo.nickname,
          type: 1,
          token: im_token,
          portrait: res.data.userinfo.face
        }
        userInfo.uid = res.data.userinfo.uid;
        wx.setStorageSync('obj',obj);
        wx.setStorageSync('userInfo',res.data.userinfo);
        wx.setStorageSync('user',userInfo);
        mani();
      }
    },
    fail: function () {
      console.log('获取用户信息失败');
    }
  })
}
function getToken(){
  wx.request({
    url: 'https://www.51aso.cn/index/imtoken?ry=1',
    method: 'GET',
    header: {
      'content-type': 'application/json',
      'cookie': wx.getStorageSync('sessionid')
    },
    success: function (re) {
       return re;
    }
  })
}
function getEdition(){
  var context = this;
  wx.request({
    url:'https://www.51aso.cn/index/sync',
    method: 'GET',
    header: {
      'content-type': 'application/json',
      'cookie': wx.getStorageSync('sessionid')
    },
    success:function(res){
      //将礼物版本存储到本地
      if(res.statusCode==200){
        //将用户的最新信息存在到本地
        wx.setStorage({
          key:'user',
          data: res.data.userinfo
        })
        //首先判断本地是否存在一个giftTag,如果存在，则取出edition判断。否则直接存储
        var giftTag = wx.getStorageSync('giftTag');
        if (!giftTag) {
          //不存在，直接保存
          var obj = {
              edition: res.data.gift_version,
              isChanged: false
          }
          wx.setStorageSync('giftTag',obj);
        }else{
          //如果存在，
          if(giftTag.edition!=res.data.gift_version){
              giftTag.isChanged = true;
          } 
          giftTag.edition = res.data.gift_version;
        }
        //加载礼物
        loadGift();
      }
    }
  })
}
// 获取cookie中某个值
function getValue(cookie,key){
   var cookieValue = '';
   var search = key+'=';
   if(cookie.length>0){
     var offset = cookie.indexOf(search);
     if(offset!=-1){
       offset+=search.length;
      var end = cookie.indexOf(';',offset);
       if(end==-1){
         end = cookie.length;
       }
       cookieValue = cookie.substring(offset, end);
     }
   }
   return cookieValue;
}

//加载礼物并结构处理
function loadGift(){
  //点击加载礼物列表并保存到本地
  var context = this;
  var giftList = wx.getStorageSync('gift');
  var giftTag = wx.getStorageSync('giftTag');
  if (giftList && !giftTag.isChanged) {
    //保证本地存储了礼物列表并且礼物版本不变
    return;
  } else {
    //请求礼物列表
    wx.request({
      url: 'https://www.51aso.cn/gift/mall?v=160',
      method: 'get',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.stat == 200) {
          //礼物处理
          var arrList = [];
          var giftList = res.data.gifts;
          for (var i in giftList) {
            //只渲染普通礼物
            if(giftList[i].type==1){
              arrList.push(giftList[i]);
            }
          }
          arrList.sort(function (a, b) {
            return a.num - b.num
          })
          var arr = [];
          for (var i = 0, len = arrList.length; i < len; i += 8) {
            arr.push(arrList.slice(i, i + 8));
          }
          wx.setStorageSync('gift', arr);
        }
      }
    })
  }
}

//生成充值订单号
function createOrder(uid){
  var time = Date.parse(new Date())/1000;
  return time+uid;
}

//获取用户的关注列表
function getFocus(uid){
  var context = this;
  wx.request({
    url: 'https://www.51aso.cn/atten/sync?liveuid='+uid,
    method: 'GET',
    header: {
      'content-type': 'application/json',
      'cookie': wx.getStorageSync('sessionid')
    },
    success: function (res) {
      //将用户关注的信息存储到本地
      if(res.statusCode==200){
        //将信息存储到本地
        wx.setStorageSync('focusList',res.data.uids);
      }
    }
  })
}

function setRongyun(){
  //设置监听器后，再连接融云服务器
  RongIMClient.setConnectionStatusListener({
    onChanged: function (status) {
      switch (status) {
        case RongIMLib.ConnectionStatus.CONNECTED:
          console.log('链接成功');
          break;
        case RongIMLib.ConnectionStatus.CONNECTING:
          console.log('正在链接');
          break;
        case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
          console.log('其他设备登录');
          break;
        case RongIMLib.ConnectionStatus.DOMAIN_INCORRECT:
          console.log('域名不正确');
          break;
        case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
          console.log('网络不可用' + wx.getStorageSync('obj').token);
          var callback = {
            onSuccess: function (userId) {
              console.log("Reconnect successfully." + userId);
            },
            onTokenIncorrect: function () {
              console.log('token无效');
            },
            onError: function (errorCode) {
              console.log(errorcode);
            }
          };
          var config = {
            // 默认 false, true 启用自动重连，启用则为必选参数
            auto: true,
            // 重试频率 [100, 1000, 3000, 6000, 10000, 18000] 单位为毫秒，可选
            url: 'cdn.ronghub.com/RongIMLib-2.2.6.min.js',
            // 网络嗅探地址 [http(s)://]cdn.ronghub.com/RongIMLib-2.2.6.min.js 可选
            rate: [100, 1000, 3000, 6000, 10000]
          };
          RongIMClient.reconnect(callback, config);
          break;
      }
    }
  });
  // 消息监听器
  RongIMClient.setOnReceiveMessageListener({
    // 接收到的消息
    onReceived: function (message) {
      //判断接受到的消息是进入聊天室的消息
      var chatRoomId = wx.getStorageSync('cur').uid;
      if (chatRoomId && message.targetId == chatRoomId) {
        app.setChangedData(message);
      }
    }
  });

  RongIMClient.getInstance().disconnect();
  //连接服务器,但是保证用户登录情况下
  var token = wx.getStorageSync('obj').token;
  console.log(3);
  console.log(wx.getStorageSync('obj'));
  if (token) {
    RongIMClient.connect(token, {
      onSuccess: function (userId) {
        console.log("Connect successfully." + userId);
        //存储到全局中
        app.globalData.connectStatus = true;
        console.log(app.globalData.connectStatus);
      },
      onTokenIncorrect: function () {
        console.log('token无效');
      },
      onError: function (errorCode) {
        var info = '';
        switch (errorCode) {
          case RongIMLib.ErrorCode.TIMEOUT:
            info = '超时';
            break;
          case RongIMLib.ConnectionState.UNACCEPTABLE_PAROTOCOL_VERSION:
            info = '不可接受的协议版本';
            break;
          case RongIMLib.ConnectionState.IDENTIFIER_REJECTED:
            info = 'appkey不正确';
            break;
          case RongIMLib.ConnectionState.SERVER_UNAVAILABLE:
            info = '服务器不可用';
            break;
        }
        console.log(errorCode);
      }
    });
  }

}
module.exports = {
  formatTime: formatTime,
  getData:getData,
  postUserInfo:postUserInfo,
  getEdition,
  loadGift,
  getFocus,
  setRongyun
}
