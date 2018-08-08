//app.js
const RongIMLib = require('./lib/RongIMLib.miniprogram-1.0.2.js');
const RongIMClient = RongIMLib.RongIMClient;

App({
  onLaunch: function () {
    
    RongIMLib.RongIMClient.init('pvxdm17jx4jpr');
    
    //如果有最新版本，则提示更新
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function(res){
      console.log(res);
    })
    updateManager.onUpdateReady(function(){
      wx.showModal({
        title:'更新提示',
        content:'新版本已经准备好，是否重启应用？',
        success:function(res){
          if(res.confirm){
            //新的版本已经下载好，调用applyUpdate应用新版本并重启
            updateManager.applyUpdate();
          }
        }
      })
    })
  },
  onHide:function(){
    //断开连接
    RongIMClient.getInstance().disconnect();
  },
  addListener:function(callback){
      this.callback = callback;
  },
  setChangedData:function(data){
      this.data =data;
      if(this.callback!=null){
        this.callback(data);
      }
  },
  globalData: {
    userInfo: null,
    auth:{},
    RongIMLib,
    RongIMClient,
    connectStatus:false
  }
})