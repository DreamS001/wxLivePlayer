// pages/focus/focus.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
     focusList:[],
     flag:false,
     page_remove:1,
     time:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
     //加载用户关注列表
     //获取当前用户的uid 
     var uid= wx.getStorageSync('user').uid;
     var that = this;
     wx.request({
       url:'https://www.51aso.cn/live/atten',
       method:'get',
       header: {
         'content-type': 'application/json',
         'cookie': wx.getStorageSync('sessionid')
       },
       data:{
         page_remove: that.data.page_remove,
         liveuid: uid,
         time: that.data.time
       },
       success:function(res){
         //获取关注列表
         console.log(res);
         if(res.statusCode==200){
           if(res.data.list.length>0){
             that.setData({
               focusList: res.data.list,
               flag:false
             })
           }else{
             that.setData({
               flag:true
             })
           }
         }
       }
     })
  }, 
  onBroadcast:function(event){
    wx.setStorage({
      key: 'cur',
      data: event.currentTarget.dataset.anchorobj
    });
    console.log(app.globalData.connectStatus);
    if(app.globalData.connectStatus){
      wx.navigateTo({
        url: '../broadcast/broadcast'
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})