
var util = require('../../utils/util.js');
var app = getApp();
var { RongIMClient,RongIMLib } = app.globalData;


Page({
  /**
   * 页面的初始数据
   */
  data: {
     page:1,
     currentList:[],
     selectedType:'hotList',
     hidden:true,
     url:'https://www.51aso.cn/live/hot?',//热门主播地址
     scrollHeight: 0,
     time:0,
     isNone: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //判断用户缓存信息
    // var obj = wx.getStorageSync('user');
    // if(obj=='') {
    //   console.log('yanzheng');
    //   wx.navigateTo({
    //     url: '../auth/auth'
    //   })
      
    // }else{
    //   var uid = wx.getStorageSync('user').uid;
    //   //同步关注主播列表
    //   util.getFocus(uid);
    //   util.setRongyun();
    // }
    //同步礼物版本
    util.getEdition();
    //默认加载热门主播数据
    this.selectedTap(this.data.selectedType);

     var that = this;
     //设置scroll-view 的高度
    wx.getSystemInfo({
      success:function(res){
        that.setData({
          scrollHeight: res.windowHeight*2
        })
      }
    })
  },
  selectedTap:function(event){
    var that = this;
    if(event.currentTarget){
        this.setData({
           selectedType:event.currentTarget.dataset.type
        })
    }
    //如果点击为附近则获取用户地理位置
    if(this.data.selectedType=='hotList'){
       this.setData({
         url:'https://www.51aso.cn/live/hot?'
       })
       this.loadData(this.data.url, { page_remove: this.data.page,time:this.data.time},this);
    }else{
      this.setData({
        url:'https://www.51aso.cn/nearby/index?',

      })
      wx.getLocation({
        type: 'wgs84',
        success: function (res) {
          console.log(res)
          //后台加载数据
          var obj = {
            lat:res.latitude,
            lng:res.longitude
          }
          console.log(obj)
          that.loadData(that.data.url,obj,that);
        }
      })
    }
  },
  //由于附近和热门的数据格式差不多，特意放一起处理
  loadData:function(url,obj,that){
    util.getData(url,obj,function(res){
      console.log(res);
      if (res.data.stat == 200) {
        //console.log(res.data.list);
        //判断是否有数据
        if (res.data.list && res.data.list.length > 0) {
          //处理数据
          //判断数据是追加还是直接赋值
          if (that.data.page > 1) {
            //追加，加载更多
            var curList = that.data.currentList.concat(res.data.list);
            that.setData({
              currentList: curList,
              hidden: false,
              time: res.data.list[res.data.list.length - 1].time
            })
            
          } else {
            //赋值，刷新
            that.setData({
              currentList: res.data.list,
              hidden: false,
              time: res.data.list[res.data.list.length - 1].time
            })
          }
        } else {
          that.setData({
            isNone: true
          })
        }
      } else {
        //提示获取数据失败
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        })
      }
    },function(){
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      wx.hideLoading();
    })
  },
  detailTap:function(event){
    console.log(event);
    //将被选中主播信息存储到本地
    //将所有的id 换成 15082944 测试
    var that = this;
    console.log(app.globalData.connectStatus);
    // wx.request({
    //   url:'https://www.51aso.cn/home?u=15082944',
    //   method:'get',
    //   header:{
    //     'content-type':'application/json',
    //     'cookie': wx.getStorageSync('sessionid')
    //   },
    //   success:function(res){
    //     console.log(res);
    //     wx.setStorage({
    //       key: 'cur',
    //       data: res.data.userinfo//event.currentTarget.dataset.anchorobj
    //     });
    //     if (app.globalData.connectStatus) {
    //       wx.navigateTo({
    //         url: '../broadcast/broadcast'
    //       })
    //     }
    //   }
    // })

        wx.setStorage({
          key: 'cur',
          data: event.currentTarget.dataset.anchorobj
        });
        if (app.globalData.connectStatus) {
          wx.navigateTo({
            url: '../broadcast/broadcast'
          })
        }else{
          wx.showToast({
            title: '服务器未连接上，稍后再试',
            icon: 'none'
          })
        }
  },
  onPullDownRefresh:function(){
    wx.showNavigationBarLoading();
    this.setData({
      page: 1,
      currentList: [],
      hidden: true,
      time: 0,
      isNone:false
    })
    this.selectedTap(this.data.selectedType);
  },
  onReachBottom:function(){
    var that = this;
    if(this.data.currentList>20){
      that.setData({
        isNone: true
      })
    }else{
      if (this.data.currentList.length < 20 * this.data.page) {
        console.log(2);
        that.setData({
          isNone: true
        })
      } else {
        console.log(10);
        wx.showLoading({
          title: '玩命加载中'
        })
        this.setData({
          page: this.data.page + 1
        })
        this.selectedTap(this.data.selectedType);
      }
    }
  }
})