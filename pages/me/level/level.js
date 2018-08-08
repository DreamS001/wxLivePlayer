// pages/me/level/level.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
     level: 0,
     exp:0,
     icon: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var context = this;
    wx.request({
      url: 'https://www.51aso.cn/profile/mygrade',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'cookie': wx.getStorageSync('sessionid')
      },
      success: function (res) {
        console.log(res.data);
        if(res.statusCode==200){
          //获取等级和经验值
          var reg1 = /当前等级:(\d+)/;
          var reg2 = /距离升级还差:(\d+)/;
          var reg3 = /送出<span>(\d+)/;
          var nums1 = res.data.match(reg1);
          var nums2 = res.data.match(reg2);
          var nums3 = res.data.match(reg3);
          console.log(nums3);
          context.setData({
            level: nums1[1],
            exp :nums2[1],
            icon:nums3[1]
          })
        }
      }
    })
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