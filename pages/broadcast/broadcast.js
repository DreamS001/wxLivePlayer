
var app = getApp();
let { messageList, RongIMClient, RongIMLib } = app.globalData;
let md = require("../../lib/md5.js");

Page({
  /**
   * 页面的初始数据
   */
  data: {
     item:{},
     focus:false,//用户是否已经关注主播
     isFocus:false,//输入框是否聚焦
     userId:'',
     infoList:[],
     inputLength:20,
     msg:'',
     isShow: false,
     curClass:'live',
     randomValue:parseInt(3*Math.random()+1),
     giftList:[],
     showGift: false,
     playerInfo:{},
     listWidth: 0,
     leftMove: 0 ,
     giftMessage:{},
     giftMsg:{},
     preMessage:{},
     nums:0,
     isChanging:false,
     id:0,
     count:0,
     curKey:'',
     mark:false,
     deviceWidth:0,
     selectedObj:0,
     localGifts:{},
     isLive: true,
     isGood:false,
     inputTime: 0,
     isOffice:false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    var context = this;

     //将本地存储的主播信息获取
    let obj = wx.getStorageSync('cur');
    this.setData({
      item:obj,
      userId: obj.uid,
      playerInfo: wx.getStorageSync('user')
    })

    //查看用户是否已经关注
    var focusList = wx.getStorageSync('focusList');
    if (focusList.indexOf(this.data.userId) != -1) {
      context.setData({
        focus: true
      })
    }

    //获取系统的可用宽度
    wx.getSystemInfo({
      success: function(res) {
        context.setData({
          deviceWidth: res.screenWidth
        })
      }
    })


    //获取进入房间后系统首推消息
    var data = {
       liveuid: this.data.userId,
       userid: wx.getStorageSync('obj').id
    }
    wx.request({
      url:'https://www.51aso.cn/live/enter',
      method:'get',
      data:data,
      header: {
        'content-type': 'application/json',
        'cookie': wx.getStorageSync('sessionid')
      },
      success:function(res){
        console.log(res);
        if(res.data.stat==200){
          if (res.data.is_live == 0) {
            context.setData({
              isLive: false
            })
            return;
          }
          var sysList = [];
          for (var i = 0; i < res.data.sys_msg.length; i++) {
            var obj = {
              msg: res.data.sys_msg[i],
              type: 'sysInfo'
            }
            sysList[i] = obj;
          }
          var obj = context.data.item;
          obj.total = res.data.total;
          context.setData({
            infoList: sysList,
            item:obj
          })
          app.addListener((changedData) => {
            context.handleMessage(changedData, context);
          })
        } 
      }
    })

    //加入聊天室
    let chatRoomId = this.data.userId;
    let count = 10;
    this.getInRoom(chatRoomId,this);
    

    //获取礼物列表
    var gift = wx.getStorageSync('gift');
    if(gift){
      this.setData({
        giftList: gift[0],
        listWidth: context.data.deviceWidth//listWidth: gift.length * context.data.deviceWidth
      })
    }
  },
  getInRoom: function (chatRoomId,context){
    RongIMClient.getInstance().joinChatRoom(chatRoomId, -1, {
      onSuccess: function () {
        // 加入聊天室成功。
        console.log('加入聊天室成功');
        //进入房间发送欢迎消息
        var content = {
          type: 'enter',
          data: {
            face: context.data.playerInfo.face,
            goodid: context.data.playerInfo.goodid,
            grade: context.data.playerInfo.grade,
            nickname: context.data.playerInfo.nickname,
            noble: context.data.playerInfo.noble,
            offical: 0,
            stat: 0,
            total: 9,
            type: 'enter',
            uid: context.data.playerInfo.uid,
            welcome_msg: "欢迎'" + context.data.playerInfo.nickname + "'进入直播间"
          }
        }
        var prototypes = ['data', 'type'];
        context.sendMsg(content, prototypes);
      },
      onError: function (error) {
        // 加入聊天室失败
        console.log('加入聊天室失败');
        this.getInRoom(chatRoomId);
      }
    });
  },
  netStatus(e){
    console.log(e);
  },
  statechange(e){
    console.log(e.detail.code);
  },
  //用户添加关注
  focusTap(){
    var that = this;
    var url='';
    //判断用户添加关注还是取消关注
    if(that.data.focus){
      //取消关注
      url ='https://www.51aso.cn/atten/del?u=';
    }else{
      //添加关注
      url = 'https://www.51aso.cn/atten/add?u=';
    }
    wx.request({
      url: url+that.data.userId,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'cookie': wx.getStorageSync('sessionid')
      },
      success: function (res) {
        if(res.data.stat==200){
          //2、本地存储增加
          var focus = wx.getStorageSync('focusList');
          if(that.data.focus){
             //取消关注
             focus = focus.replace(that.data.userId+',','');
            //将服务器返回的信息展示
            wx.showToast({
              title: '取消关注',
              icon: 'none',
              duration: 2000
            })
          }else{
            focus += that.data.userId + ',';
            //3、发送消息:关注
            //在聊天室内发送消息,发送前先将消息进行包装
            var content = {
              type: 'atten',
              data: {
                face: that.data.playerInfo.face,
                goodid: that.data.playerInfo.goodid,
                grade: that.data.playerInfo.grade,
                nickname: that.data.playerInfo.nickname,
                noble: that.data.playerInfo.noble,
                offical: 0,
                stat: 0,
                uid: that.data.playerInfo.uid,
                type: 'atten'
              }
            }
            var prototypes = ['data', 'type'];
            that.sendMsg(content, prototypes);
            wx.showToast({
              title: '添加关注',
              icon: 'none',
              duration: 2000
            })
          }
          
          wx.setStorageSync('focusList',focus);
         
          //1、关注状态更改
          that.setData({
            focus: !that.data.focus
          })

        }
       
      }
    })
  },
  //消息图标点击事件
  messageTap:function(){
      this.setData({
        isFocus: true,
        isShow:true,
        curClass:'liveInput'
      })
  },
  //礼物图片点击事件
  giftTap:function(){
    //获取最新的钻石数据
    var that = this;
    wx.request({
      url: 'https://www.51aso.cn/pay/index',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'cookie': wx.getStorageSync('sessionid')
      },
      success: function (res) {
        console.log(res);
        if (res.data.stat == 200) {
          var playerInfo = that.data.playerInfo;
          playerInfo.diamond = res.data.diamond;
          that.setData({
             playerInfo:playerInfo,
             showGift:true
          })
        }
      }
    })
  },
  //关闭图片点击事件
  closeTap:function(){
    //页面跳回主页
    wx.navigateBack({
      url:'../home/home'
    })
  },
  onInput:function(event){
     //判断输入文字的长度，更新提示可输入文字数量
     var context = this;
     context.setData({
       inputLength: 20 - event.detail.value.length
     })
  },
  onConfirm:function(event){
    //判断上次输入的时间戳是否存在
    if(this.data.time!=0&&event.detail.value!=''){
      var curTime = Date.parse(new Date());
      if(curTime-this.data.time<5000){
        wx.showToast({
          title: '输入聊天内容太频繁喽！',
          icon: 'none',
          duration: 1000
        })
        return;
      }
    }
    var context = this;
    if(event.detail.value==''){
       wx.showToast({
         title:'输入聊天内容不能为空',
         icon:'none',
         duration: 1000
       })
       return;
    }
    //记录下当前输入的时间戳
    context.setData({
      msg: '',
      time: Date.parse(new Date())
    })
    console.log(event.detail.value);
     //在聊天室内发送消息,发送前先将消息进行包装
       var content ={
          type:'chat',
          data:{
            chat_msg: event.detail.value,
            face: context.data.playerInfo.face,
            goodid: context.data.playerInfo.goodid,
            grade: context.data.playerInfo.grade,
            nickname: context.data.playerInfo.nickname,
            noble: context.data.playerInfo.noble,
            offical: 0,
            type: 'chat',
            uid: context.data.playerInfo.uid
          },
          user: {
            id: context.data.playerInfo.uid,
            icon: context.data.playerInfo.face,
            level: 0,
            name: context.data.playerInfo.nickname
          }
        }
      var prototypes = ['data', 'type','user'];
      this.sendMsg(content, prototypes,function(){
      });

  },
  onFocus:function(event){
    console.log(0);
     this.setData({
       isFocus: true
     })
  },
  onBlur(){
    this.setData({
      msg: '',
      isShow: false,
      curClass: 'live' 
    })
  },
  handleMessage:function(changedData,context){
    var noShowIMG = ['exit', 'gift', 'upgrade', 'noticeallroom', 'barrage', 'manager', 'remove-manager'];
    var curObj = {};
    if(changedData.messageDirection==1){
      if(!changedData.content.message){
        curObj = changedData.content;
      }else{
        curObj = changedData.content.message.content;
      }
    }
    if(changedData.messageDirection==2){
      switch (changedData.objectName) {
        //处理消息app:custom-queue
        case 'app:custom-queue':
          curObj = changedData.content.message.content.data.list[0];
          break;
        //处理消息app:custom-queue
        case 'app:custom':
          if(changedData.messageType=='UnMessage'){
            curObj = changedData.content;
          } else if (changedData.messageType =='UnknownMessage'){
            curObj = changedData.content.message.content;
          }
          break;
        case 'app:gift':
           curObj = changedData.content.message.content;
           break;
      }
    }
    if (noShowIMG.indexOf(curObj.type) == -1) {
      //插入到展示队列中
       // 处理等级
       if(curObj.data&&curObj.data.grade>-1){
         curObj.level = Math.floor((parseInt(curObj.data.grade) + 16) / 16);
       }
      //如果点亮心，处理图片
      if(curObj.type=='love'){
        context.setData({
          randomValue: parseInt(3 * Math.random() + 1)
        })
      }
      var list = context.data.infoList;
      if (list.length == 5) {
        list.shift();
      }
      list.push(curObj);
      //更新
      context.setData({
        infoList: list,
        preMessage:{}
      })
    }else{
      //渲染礼物:普通礼物
      if(curObj.type=='gift'&&curObj.data.gift_type==1){
        //思路整理：
        //首先礼物存储格式为： { 'u1g1':[{},{},{}],'u2g2':[{},{},{}]}
        //1、根据获取的礼物，将其存储到容器中
        var list = context.data.giftMessage;
        //如果插入时，数据为空
        var key = 'u'+curObj.data.uid+'g'+ curObj.data.gift_id;
        if(JSON.stringify(list)=='{}'){
          //空对象
          list[key]=[curObj.data];
        }else{
          //不是空对象，则判断该用户+礼物是否已经存在
          var isHas = false;
          for(var i in list){
            if(i==key){
              list[key].push(curObj.data);
              isHas = true;
              break;
            }
          }
          if(!isHas){
            //不存在
            list[key] = [curObj.data];
          }
        }
        //更新到giftMessage
        context.setData({
          giftMessage: list
        })
        if (!context.data.mark) {
          context.setData({
            mark: true
          })
          setTimeout(function () {
            this.Gift();
          }.bind(this), 300)
        }
        
      }
      //退出判断：主播消息
      if(curObj.type=='exit'){
        //console.log(changedData);
        if(changedData.senderUserId==changedData.targetId){
          //确认主播退出
          context.setData({
            isLive: false
          })
        }
      }
    }
  },
  Gift: function () {
    var context = this;
    var con = this.data.giftMessage;
    var firstKey = Object.keys(con)[0];
    //判断长度
    if (con[firstKey].length > 0) {
      //有值
      if (this.data.curKey == '') {
        this.setData({
          curKey: firstKey,
          preMessage: con[firstKey][0],
          nums: con[firstKey][0].gift_nums
        })
      } else {
        //停歇800ms
        var n = this.data.nums;
        this.sleep(800);
        this.setData({
          nums: n+1
        })
        console.log(context.data.nums);
      }
      con[firstKey].shift(); //移除第一个
      this.Gift();
    } else {
      console.log('间隔3s');
      var id = setTimeout(function () {
        //查看长度是否>0
        var obj = this.data.giftMessage;
        var key = this.data.curKey;
        if (obj[key].length == 0) {
          //没有新数据
          delete obj[key];
          this.setData({
            curKey: '',
            preMessage: {}//消失
          })
          console.log('消失');
          //查看giftMessage是否有数据
          if (JSON.stringify(context.data.giftMessage) != '{}') {
            this.Gift();
          } else {
            this.setData({
              mark: false
            })
          }
        } else {
          //新插入数据
          var n = this.data.nums +1;
          this.setData({
            nums: n,
            preMessage: obj[key][0]
          })
          console.log(this.data.nums);
          console.log(this.data.preMessage);
          obj[this.data.curKey].shift(); //移除第一个
          this.Gift();
        }
        clearTimeout(id);
      }.bind(this), 3000)
    }
  },
  sleep: function (numberMillis){
     console.log('睡眠');
     var now = new Date();
     var exitTime = now.getTime() + numberMillis;
     while(true){
       now = new Date();
       if(now.getTime()>exitTime){
         return;
       }
     }
  },
  onLeft(){
     //向左滑动
    var gift = wx.getStorageSync('gift');
     if(this.data.leftMove<gift.length-1){
       var right = (this.data.leftMove + 1);
       this.setData({
         leftMove: right,
         giftList: gift[right]
       })
     }else{
        wx.showToast({
          title: '已经是最后一张',
          icon:'none',
          duration: 2000
        })
     }
  },
  // 礼物列表向右滑动
  onRight() {
    //向右滑动
    var gift = wx.getStorageSync('gift');
    if (this.data.leftMove >0) {
      var left = (this.data.leftMove - 1);
      this.setData({
        leftMove: left,
        giftList: gift[left]
      })
    }else {
      wx.showToast({
        title: '已经是第一张',
        icon: 'none',
        duration: 1000
      })
    }
  },
  onLove:function(){
    this.onTap();
  },
  onTap:function(e){
    console.log(10);
    var context = this;
     if(this.data.showGift){
        this.setData({
          showGift: false
        })
     }
     this.setData({
       isShow: false,
       curClass: 'live'
     })
     //点亮心,进入房间发送欢迎消息
     if(!this.data.isGood&&!this.data.showGift){
       console.log(context.data.playerInfo);
       var content = {
         type: 'love',
         data: {
           face: context.data.playerInfo.face,
           goodid: context.data.playerInfo.goodid,
           grade: context.data.playerInfo.grade,
           love_pos: '1',
           nickname: context.data.playerInfo.nickname,
           noble: context.data.playerInfo.noble,
           offical: 0,
           type: 'love',
           uid: context.data.playerInfo.uid
         }
       }
       var prototypes = ['data', 'type'];
       context.sendMsg(content, prototypes,function(){
         context.setData({
           isGood: true
         })
       });
     }
  },
  onSelected:function(event){
      var obj = event.currentTarget.dataset.obj;
      if(this.data.selectedObj==0){
        //没有被选中的
        this.setData({
          selectedObj: obj
        })
      }else{
        if(this.data.selectedObj==obj){
          this.setData({
            selectedObj: 0
          })
        }else{
          this.setData({
            selectedObj: obj
          })
        }
      }
      console.log(this.data.selectedObj);
  },
  onSend:function(){
    var that = this;
    if(this.data.selectedId==0){
      wx.showToast({
        title:'请先选择礼物后再尝试',
        icon: 'none',
        duration: 2000
      })
    }else{
      //支付成功后回调
      var timeSt = Date.parse(new Date()) / 1000;
      wx.request({
        url: 'https://www.51aso.cn/gift/send',
        method: 'GET',
        data:{
           liveuid: that.data.userId,
           giftid:that.data.selectedObj.id,
           one_total:1,
           time:timeSt,
           token:md.hexMD5(that.data.playerInfo.uid + timeSt + 'saiquba')
        },
        header: {
          'content-type': 'application/json',
          'cookie': wx.getStorageSync('sessionid')
        },
        success:function(res){
          console.log(res);
          if(res.data.stat==200){
            //扣费成功
            //渲染礼物
            //做礼物数量处理
            //步骤： 1、是否存在，不存在创建，存在叠加
            var gList = that.data.localGifts;
            if (JSON.stringify(gList) == '{}') {
              //为空
              gList[that.data.selectedObj.id] = 1;
            } else {
              //遍历查看是否已经存在
              var flag = false;
              for (var i in gList) {
                if (i == that.data.selectedObj.id) {
                  //存在，原有值上叠加
                  flag = true;
                  gList[i] = gList[i] + 1;
                  break;
                }
              }
              if (!flag) {
                //不存在
                gList[that.data.selectedObj.id] = 1;
              }
            }
            //更新
            that.setData({
              localGifts: gList
            })
            //发送礼物消息
            var content = {
              type: 'gift',
              data: {
                chat_time: 0,
                face: that.data.playerInfo.face,
                gift_count: 0,
                gift_id: that.data.selectedObj.id,
                gift_name: that.data.selectedObj.name,
                gift_nums: that.data.localGifts[that.data.selectedObj.id],
                gift_type: 1,
                goodid: "0",
                grade: "0",
                isContinus: true,
                multiple: 0,
                nickname: that.data.playerInfo.nickname,
                noble: 0,
                offical: 0,
                packetid: 0,
                paint_id: 0,
                price: that.data.selectedObj.price,
                recv_diamond: 0,
                recv_uid: 0,
                stat: 0,
                type: 'gift',
                uid: that.data.playerInfo.uid
              }
            }
            var prototypes = ['data', 'type'];
            that.sendMsg(content, prototypes);
            //更改钻石
            var playerInfo = that.data.playerInfo;
            playerInfo.diamond = res.data.diamond;
            that.setData({
              playerInfo: playerInfo
            })
          }else{
            wx.showToast({
              title: res.data.msg,
              icon:'none',
              duration: 2000
            })
            return;
          }
        }
      })
    }
  },
  onShareAppMessage(options){
      return {
        title:'花间直播',
        desc:'这个妹子我喜欢，你呢？',
        path:'/pages/home/home'
      }
  },
  sendMsg:function(content,prototypes,callback){
    var context = this;
    //使用自定义消息
    var messageName = 'UnMessage';
    var objectName = 'app:custom';
    var messageTag = new RongIMLib.MessageTag(true, true);
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);
    //发送消息
    var conversationtype = RongIMLib.ConversationType.CHATROOM;
    var targetId = this.data.userId;
    var msg = new RongIMClient.RegisterMessage.UnMessage(content);
    RongIMClient.getInstance().sendMessage(conversationtype, targetId, msg, {
      onSuccess: function (message) {
        console.log(message);
        context.handleMessage(message, context);
        if(callback){
          callback();
        }
      },
      onError: function (errorCode, message) {
        console.log(message);
        var info = '';
        switch (errorCode) {
          case RongIMLib.ErrorCode.TIMEOUT:
            info = '超时';
            break;
          case RongIMLib.ErrorCode.UNKNOWN_ERROR:
            info = '未知错误';
            break;
          case RongIMLib.ErrorCode.REJECTED_BY_BLACKLIST:
            info = '在黑名单中，无法向对方发送消息';
            break;
          case RongIMLib.ErrorCode.NOT_IN_DISCUSSION:
            info = '不在讨论组中';
            break;
          case RongIMLib.ErrorCode.NOT_IN_GROUP:
            info = '不在群组中';
            break;
          case RongIMLib.ErrorCode.NOT_IN_CHATROOM:
            info = '不在聊天室中';
            break;
          default:
            info = 'x';
            break;
        }
        console.log('发送失败:' + info);
      }

    })
  },
  onBack:function(){
    wx.navigateBack({
      delta:1
    })
  },
  // 前往充值页面
  onCharge:function(){
     wx.navigateTo({
       url:'../me/charge/charge'
     })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
     //退出房间
    var chatRoomId = this.data.userId;
    RongIMClient.getInstance().quitChatRoom(chatRoomId,{
      onSuccess:function(){
        //退出聊天室
        console.log('退出成功'+chatRoomId);
      },
      onError:function(){
        //退出失败
        console.log('退出失败'+chatRoomId);
      }
    })
  }

});