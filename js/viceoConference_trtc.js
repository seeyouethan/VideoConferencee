//RtcMulti部分

var connection = new RTCMultiConnection();
connection.userid = window.uid;
connection.socketURL = 'https://rtc.cnki.net/';
connection.socketMessageEvent = 'video-conference-demo-group01';
//判断是否有摄像头,如果有摄像头，则添加如下变量


connection.session = {
      data: true
};

connection.iceServers = [
      {
            "urls": "stun:www.385073012.cn:3478",
      },
      {
            "urls": "turn:www.385073012.cn:3478",
            "username": "cnki",//可选
            "credential": "123456"//可选
      }];

connection.videosContainer = document.getElementById('videos-container');

connection.onmessage = function (event) {
      Toast.notify(event.data);
};



connection.onopen = function (event) {
      Toast.notify(event.userid);
      UserOnline(event.userid);
};
connection.onclose = function (event) {
      Toast.notify(event.userid);
      UserOffline(event.userid);
};


connection.openOrJoin(window.groupid, function (isRoomExist, roomid, error) {
      UserOnline(window.uid);

      fun1();

      window.setInterval(function () {
            console.log("定时任务-----------")
            connection.socket.emit('', '1');
      }, 10000);


});







function getTrueNameByUserid(uid) {
      var ele = $(".member-ul li[data-uid='" + uid + "']");
      if (ele.length !== 0) {
            return ele.attr("title");
      }
      return "";
}



function onUnMutedL(type) {
      connection.attachStreams[0].unmute(type);

}

function onMutedL(type) {
      connection.attachStreams[0].mute(type);
}




