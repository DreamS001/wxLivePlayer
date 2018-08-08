// pages/me/me.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
     isShow:false,
     userinfo:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var user = wx.getStorageSync('userInfo');
    console.log(user);
    this.setData({
      userinfo: user
    })
  },
  onTap:function(event){
      var type = event.currentTarget.dataset.type;
      if(type=='charge'){
        wx.navigateTo({
          url: './charge/charge'
        })
      }else if(type=='level'){
        wx.navigateTo({
          url:'./level/level'
        })
      }else if(type=='modal'){
         this.setData({
           isShow:!this.data.isShow
         })
      }
      
  },
  onShareAppMessage:function(options){
    if(options.from=='button'){
      //页面button转发按钮
      return {
        title: '这个平台我很喜欢，你呢？',
        path: '/pages/home/home',
        imageUrl:'/images/share.png'
      }
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
  
  }

  
})