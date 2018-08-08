// pages/me/charge/charge.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
     chargeList:[],
     tips:'',
     coins:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
      //加载钻石数据
      wx.request({
        url:'https://www.51aso.cn/pay/index',
        method: 'GET',
        header: { 
          'content-type': 'application/json',
          'cookie':wx.getStorageSync('sessionid')
         },
        success:function(res){
          console.log(res);
          if(res.data.stat==200){
            that.setData({
              chargeList: res.data.coins,
              tips: res.data.memo,
              coins:res.data.diamond
            })
            //并将其保存到本地
          }
        }
      })
  },
  onCharge:function(e){
    var context = this;
     var obj = e.currentTarget.dataset.obj;
     console.log(obj);
     //获取当前用户信息
     var user = wx.getStorageSync('userInfo')
     //调用充值接口
     //支付步骤：
      //1.本地生成订单
      var timeSt = Date.parse(new Date())/1000;
      var orderId= timeSt + user.uid;
      wx.request({
        url: 'https://www.51aso.cn/pay/wx_pay',
        method: 'post',
        data:{
           openid: user.openid,
           money: obj.money, 
           diamond: obj.diamond,
           orderid: orderId
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded',
          'cookie': wx.getStorageSync('sessionid')
        },
        success:function(res){
          if(res.statusCode==200){
            console.log(res);
            wx.requestPayment({
              timeStamp: ''+res.data.msg['timeStamp'],
              nonceStr: res.data.msg['nonceStr'],
              package: res.data.msg['package'],
              signType: 'MD5',
              paySign: res.data.msg['paySign'],
              success: function (res) {
                //钻石数字修改
                console.log(res);
                if(res.errMsg=='requestPayment:ok'){
                  var giveDiamond = parseInt(obj.memo.replace(/[^0-9]/ig, '') == '' ? 0 : obj.memo.replace(/[^0-9]/ig, ''));
                  var coins = parseInt(context.data.coins) + parseInt(obj.diamond) + giveDiamond;
                  context.setData({
                    coins: coins
                  })
                  wx.showToast({
                    title:'支付成功',
                    icon: 'none',
                    duration: 2000
                  })
                }
               
                if(res.errMsg=='requestPayment:fail cancel'){
                  wx.showToast({
                    title:'用户取消支付',
                    icon:'none',
                    duration: 2000
                  })
                }
              },
              complete: function (res) {

              },
              fail:function(res){
                console.log(res);
              }
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