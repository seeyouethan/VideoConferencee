//RtcMulti部分

var connection = new RTCMultiConnection();

connection.extra={"uid":window.uid}

connection.socketURL = 'https://rtc.cnki.net/';//https://www.385073012.cn/

connection.socketMessageEvent = 'video-conference-demo-group01';

//判断是否有摄像头,如果有摄像头，则添加如下变量
    
navigator.getUserMedia({
      video: true,
      audio:true
  }, function(stream) {
        //有摄像头
    connection.session = {
          data:true,
          video: false,
          audio:false
      };
      connection.mediaConstraints={
          video:false,
          audio:false
      }
      SetHasCamera(true);
  }, function(error) {
    //无摄像头
      SetHasCamera(false);
      connection.mediaConstraints = {
          screen: false,
          audio: false,
          oneway: false
      };
      connection.session = {
          data:true,
          audio: false,
          screen: false,
      };
  });



setTimeout(function(){

    connection.bandwidth = {
        audio: 256,
        video: 512,
        screen: 512 //kbp/s
     };
     connection.processSdp = function (sdp) {
        sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, connection.bandwidth, !!connection.session.screen);
        sdp = BandwidthHandler.setVideoBitrates(sdp, {
              min: connection.bandwidth.video,
              max: connection.bandwidth.video
        });
        sdp = BandwidthHandler.setOpusAttributes(sdp);
        sdp = BandwidthHandler.setOpusAttributes(sdp, {
              'stereo': 1,
              //'sprop-stereo': 1,
              'maxaveragebitrate': connection.bandwidth.audio * 1000 * 8,
              'maxplaybackrate': connection.bandwidth.audio * 1000 * 8,
              //'cbr': 1,
              //'useinbandfec': 1,
              // 'usedtx': 1,
              'maxptime': 3
        });
        return sdp;
     };      
     
     connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
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
     connection.onstream = function (event) {
        console.log(event.userid + " enter room");
        var existing = document.getElementById(event.streamid);
        if (existing && existing.parentNode) {
              existing.parentNode.removeChild(existing);
        }
        event.mediaElement.removeAttribute('src');
        event.mediaElement.removeAttribute('srcObject');
        event.mediaElement.muted = true;
        event.mediaElement.volume = 0;
     
        var video = document.createElement('video');
     
        try {
              video.setAttributeNode(document.createAttribute('autoplay'));
              video.setAttributeNode(document.createAttribute('playsinline'));
        } catch (e) {
              video.setAttribute('autoplay', true);
              video.setAttribute('playsinline', true);
        }
     
        var width = connection.videosContainer.clientWidth;
        if (event.type === 'local') {
              connection.videosContainer = document.getElementById('videos-container');
              //自己的视频
              video.volume = 0;
              try {
                 video.setAttributeNode(document.createAttribute('muted'));
              } catch (e) {
                 video.setAttribute('muted', true);
              }
        } else {
              //其他成员的视频
              //connection.videosContainer = document.getElementById('videos-container-sub');
              width = connection.videosContainer.clientWidth/3 - 16;
     
     
     
              var ele = $("#videos-container-sub div[data-uid='" + event.userid + "']");
              if (ele.length > 0) {
                 ele.remove();
                 UserOffline(event.userid);
              }
     
     
        }
        video.srcObject = event.stream;
     
        var configOnMutedL,configOnUnMutedL

        if (event.type === 'local') {            
            configOnMutedL = onMutedL;
            configOnUnMutedL = onUnMutedL;
        }
        var mediaElement = getHTMLMediaElement(video, {
              title: getTrueNameByUserid(event.userid),
              buttons: ['mute-audio', 'mute-video', 'mute-desk', 'full-screen'],
              width: width,
              showOnMouseEnter: false,
              uid:event.userid,
              onUnMuted : configOnUnMutedL,
              onMuted : configOnMutedL,

        });
        if (event.type === 'local') {
            
            $(mediaElement).prependTo($("#videos-container"));

        }else{
            connection.videosContainer.appendChild(mediaElement);

        }

     
        setTimeout(function () {
              mediaElement.media.play();
        }, 5000);
     
        mediaElement.id = event.streamid;
     
        // to keep room-id in cache
        localStorage.setItem(connection.socketMessageEvent, connection.sessionid);
        UserOnline(event.userid);
     
     
     };

     connection.onmessage = function(event) {      
           alert(event);      
            console.log(event.data);
            
      };
     
     
     
     connection.onstreamended = function (event) {
        console.log(event.userid + " exit room");
        var mediaElement = document.getElementById(event.streamid);
        if (mediaElement) {
              mediaElement.parentNode.removeChild(mediaElement);
              UserOffline(event.userid);
        }
     };
     
     connection.onMediaError = function (e) {
        if (e.message === 'Concurrent mic process limit.') {
     
              var mediaElement = document.getElementById(e.streamid);
              if (mediaElement) {
                 mediaElement.parentNode.removeChild(mediaElement);
     
              }
              if (DetectRTC.audioInputDevices.length <= 1) {
                 alert('Please select external microphone. Check github issue number 483.');
                 return;
              }
     
              var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
              connection.mediaConstraints.audio = {
                 deviceId: secondaryMic
              };
     
              connection.join(connection.sessionid);
        } else {
              var mediaElement = document.getElementById(e.streamid);
              if (mediaElement) {
                 mediaElement.parentNode.removeChild(mediaElement);
                 
              }
        }
        UserOffline(e.userid);
     
     };

     

     
     // ......................................................
     // ......................Handling Room-ID................
     // ......................................................
     
     
     connection.openOrJoin(window.groupid, function (isRoomExist, roomid, error) {
      //      debugger;
        if (error) {
              if(error==="Room full"){
                  //房间人数满了 maxParticipantsAllowed这个值
              alert("房间人数满了: "+error);
              }else{
                  alert("Error: "+error);
              }
              
        }
        if (connection.isInitiator === true) {
            // you opened the room
            var count=connection.getAllParticipants().length;
            //alert(count);
        } else {
            // you joined it
            var count=connection.getAllParticipants().length;
            //alert(count);
        }

     });
},1000);








function getTrueNameByUserid(uid) {
   var ele = $(".member-ul li[data-uid='" + uid + "']");
   if (ele.length !== 0) {
         return ele.attr("title");
   }
   return "";
}



function onUnMutedL(type){
      connection.attachStreams[0].unmute(type);
      
}

function onMutedL(type){
      connection.attachStreams[0].mute(type);
}


