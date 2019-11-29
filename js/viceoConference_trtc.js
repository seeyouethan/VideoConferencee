//RtcMulti部分
DoConnection =function(config) {


      var connection = new RTCMultiConnection();
      
      
      
      connection.userid = window.uid;
      
      //connection.extra = { "uid": window.uid }//将oaokcs中的用户id值存放到extra中
      
      connection.socketURL = 'https://rtc.cnki.net/';//https://www.385073012.cn/  
           
      connection.socketMessageEvent = 'video-conference-demo-group01';
      
      connection.AppID = 'okcs-im';
      connection.StartDate = '2019-10-11 15:26:22';
      connection.UserName = 'okcs-im';
      
      
      
      
      connection.session = {
          data: true,
      };
      
      
      
      connection.bandwidth = {
          audio: 128,//audio bitrates. Minimum 6 kbps and maximum 510 kbps
          video: 1024*2,//video framerates. Minimum 100 kbps; maximum 2000 kbps
          screen: 1024,//screen framerates. Minimum 300 kbps; maximum 4000 kbps
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
              //'usedtx': 1,
              'maxptime': 3
          });
          return sdp;
      };
      
      connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
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
          //收到消息  
          /*
              0 表示聊天消息
              1 表示当前正在分享用户个数的消息
              2 表示xxx用户离线的消息
              3 表示xxx用户申请发言
              4 表示主持人同意发言
              5 表示主持人拒绝发言
              6 表示xxx用户停止发言
          */
          if (event.data.type === 0) {
              //聊天消息
              GetMessage(event.data.content);
          }
          else if (event.data.type === 1) {
              //当前正在分享用户个数的消息
              SetOnLiveUserList(event.data.content);
          }
          else if (event.data.type === 2) {
              //离线消息
              
              UserOffline(event.userid)
              var mediaElement = document.getElementById(event.userid);
              if (mediaElement) {
                  mediaElement.parentNode.removeChild(mediaElement);
                  console.warn(event.userid + "------onmessage");
                  
              }
          } else if (event.data.type === 3) {
              GetApplyForSpeech(event.data.content)
          } else if (event.data.type === 4) {
              GetAgreeSpeech(event.data.content)
          } else if (event.data.type === 5) {
              GetDisAgreeSpeech(event.data.content)
          } else if (event.data.type === 6) {
              GetStopSpeech(event.data.content)
          }
      };
      connection.onstream = null;
      
          //挂断视频
      connection.onstreamended = function (event) {
          //记录到缓存，
          if (event.type === 'local') {
              SetIsOnLive(false);
              RemoveOnLiveUser(event.userid);
          }
          SetUserHangOut(event.userid)
          var mediaElement = document.getElementById(event.userid);
          if (mediaElement) {
              mediaElement.parentNode.removeChild(mediaElement);
              console.warn(event.userid + "------onstreamended");
          }
      };
      
      connection.onMediaError = function (e) {
          if (e.message === 'Concurrent mic process limit.') {
      
              var mediaElement = document.getElementById(e.userid);
              if (mediaElement) {
                  mediaElement.parentNode.removeChild(mediaElement);
                  console.warn(e.userid + "------onMediaError--Concurrent mic process limit");
      
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
              var mediaElement = document.getElementById(e.userid);
              if (mediaElement) {
                  mediaElement.parentNode.removeChild(mediaElement);
                  console.warn(e.userid + "------onMediaError");
      
              }
          }
      };
      
          //用户进入房间即可触发（不分享摄像头也会触发）
      connection.onopen = function (event) {
          //收到其他用户上线，设置其为上线状态
          UserOnline(event.userid);
      };
      connection.onclose = function (event) {
          //收到其他用户离线，设置其为离线状态
          UserOffline(event.userid);
      };
      
          // ......................................................
          // ......................Handling Room-ID................
          // ......................................................
      
      
          //关闭浏览器
      connection.onleave = function (event) {
          //
          if (event.userid == window.uid) {
              RemoveOnLiveUser(event.userid);
          }
          connection.streamEvents.selectAll({
              userid: event.userid
          }).forEach(function (e) {
              var mediaElement = document.getElementById(e.userid);
              if (mediaElement) {
                  mediaElement.parentNode.removeChild(mediaElement);
                  console.warn(e.userid + "------onleave");
              }
              UserOffline(e.userid);
      
          });
      };
      
      
      
      
      connection.closeBeforeUnload = false;
      window.onbeforeunload = function (event) {
          RemoveOnLiveUser(event.userid)
          /*发送离线消息*/
          multiRtc.send({ "type": 2, "content": event.userid + " leave room" });
      
          connection.peers.getAllParticipants().forEach(function (participant) {
              connection.multiPeersHandler.onNegotiationNeeded({
                  userLeft: true
              }, participant);
      
              if (connection.peers[participant] && connection.peers[participant].peer) {
                  connection.peers[participant].peer.close();
              }
      
              delete connection.peers[participant];
          });
          connection.attachStreams.forEach(function (stream) {
              stream.stop();
          });
          connection.closeSocket();
      };
      
      
      connection.openOrJoin(window.groupid, function (isRoomExist, roomid, error) {
          if (error) {
              console.log(error);
      
              if (error == "Room not available") {
                  //重新加入
                  setTimeout(function () {
                      connection.openOrJoin(window.groupid, function (isRoomExist, roomid, error) {
                          if (error) {
                              alert("重新加入房间失败");
                          }
                          else {
      
                              //设置左侧自己上线
                              UserOnline(window.uid);
      
      
                              //没有加入房间的时候，也会收到自己的这个local的消息
                              connection.onstream = function (event) {
      
                                  console.log(event.userid + " enter room");
                                  var existing = document.getElementById(event.userid);
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
      
                                  var width = $("#videos-container").width();
                                  if (event.type === 'local') {
      
                                      SetIsOnLive(true);
                                      SetOnLiveUser(event.userid);
                                      //自己的视频
                                      video.volume = 0;
                                      try {
                                          video.setAttributeNode(document.createAttribute('muted'));
                                      } catch (e) {
                                          video.setAttribute('muted', true);
                                      }
                                      if (getFocusedStatus()) {
                                          //主持人状态
                                          width = width - 16;
                                      } else {
                                          //平铺状态
                                          width = width / 2 - 14;
                                      }
                                  } else {
                                      //其他成员的视频
      
                                      if (getFocusedStatus()) {
                                          //主持人状态
                                          width = connection.videosContainer.clientWidth / 3 - 18;
                                      } else {
                                          //平铺状态
                                          width = width / 2 - 14;
                                      }
                                      var ele = $("#videos-container div[data-uid='" + event.userid + "']");
                                      if (ele.length > 0) {
                                          ele.remove();
                                      }
      
      
                                  }
                                  video.srcObject = event.stream;
      
                                  addStreamStopListener(video.srcObject, function () {
                                      var ele = $("#videos-container div[data-uid='" + event.userid + "']");
                                      if (ele.length > 0) {
                                          ele.remove();
                                      }
                                  })
      
      
                                  var configOnMutedL, configOnUnMutedL, configOnGdL;
      
                                  if (event.type === 'local') {
                                      configOnMutedL = onMutedL;//静音 / 停止视频
                                      configOnUnMutedL = onUnMutedL;//取消静音  /  取消停止视频
                                      configOnGdL = onGdL;//挂断
                                  }
                                  var mediaElement = getHTMLMediaElement(video, {
                                      title: getTrueNameByUserid(event.userid),
                                      buttons: ['mute-audio', 'mute-video', 'mute-desk', 'full-screen'],
                                      width: width,
                                      showOnMouseEnter: false,
                                      uid: event.userid,
                                      onUnMuted: configOnUnMutedL,
                                      onMuted: configOnMutedL,
                                      localType: event.type,
                                      onGd: configOnGdL,
      
                                  });
                                  if (event.type === 'local') {
                                      $(mediaElement).prependTo($("#videos-container"));
      
                                  } else {
                                      connection.videosContainer.appendChild(mediaElement);
      
                                  }
                                  mediaElement.media.play();
                                  mediaElement.id = event.userid;
                                  //    setTimeout(function () {
                                  //      mediaElement.media.play();
                                  //}, 2000);
                              };
                          }
                          if (connection.isInitiator === true) {
                              //创建房间
      
                          } else {
                              //加入房间
                          }
                          //分享摄像头/桌面
                          ShowCameraOrDesktop();
                          window.setInterval(function () {
                              //console.log("定时任务-----------")
                              connection.socket.emit('', '1');
                          }, 10000);
                      });
                  }, 1000);
              }
          }
          else {
              //设置左侧自己上线
              UserOnline(window.uid);
      
      
              //没有加入房间的时候，也会收到自己的这个local的消息
              connection.onstream = function (event) {
      
                  console.log(event.userid + " enter room");
                  var existing = document.getElementById(event.userid);
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
      
                  var width = $("#videos-container").width();
                  if (event.type === 'local') {
      
                      SetIsOnLive(true);
                      SetOnLiveUser(event.userid);
                      //自己的视频
                      video.volume = 0;
                      try {
                          video.setAttributeNode(document.createAttribute('muted'));
                      } catch (e) {
                          video.setAttribute('muted', true);
                      }
                      if (getFocusedStatus()) {
                          //主持人状态
                          width = width - 16;
                      } else {
                          //平铺状态
                          width = width / 2 - 14;
                      }
                  } else {
                      //其他成员的视频
      
                      if (getFocusedStatus()) {
                          //主持人状态
                          width = connection.videosContainer.clientWidth / 3 - 18;
                      } else {
                          //平铺状态
                          width = width / 2 - 14;
                      }
                      var ele = $("#videos-container div[data-uid='" + event.userid + "']");
                      if (ele.length > 0) {
                          ele.remove();
                      }
      
      
                  }
                  video.srcObject = event.stream;
      
                  addStreamStopListener(video.srcObject, function () {
                      var ele = $("#videos-container div[data-uid='" + event.userid + "']");
                      if (ele.length > 0) {
                          ele.remove();
                      }
                  })
      
      
                  var configOnMutedL, configOnUnMutedL, configOnGdL;
      
                  if (event.type === 'local') {
                      configOnMutedL = onMutedL;//静音 / 停止视频
                      configOnUnMutedL = onUnMutedL;//取消静音  /  取消停止视频
                      configOnGdL = onGdL;//挂断
                  }
                  var mediaElement = getHTMLMediaElement(video, {
                      title: getTrueNameByUserid(event.userid),
                      buttons: ['mute-audio', 'mute-video', 'mute-desk', 'full-screen'],
                      width: width,
                      showOnMouseEnter: false,
                      uid: event.userid,
                      onUnMuted: configOnUnMutedL,
                      onMuted: configOnMutedL,
                      localType: event.type,
                      onGd: configOnGdL,
      
                  });
                  if (event.type === 'local') {
                      $(mediaElement).prependTo($("#videos-container"));
      
                  } else {
                      connection.videosContainer.appendChild(mediaElement);
      
                  }
                  mediaElement.media.play();
                  mediaElement.id = event.userid;
              //    setTimeout(function () {
              //      mediaElement.media.play();
              //}, 2000);
              };
          }
          if (connection.isInitiator === true) {
              //创建房间
      
          } else {
              //加入房间
          }
          //分享摄像头/桌面
          
          //config && config.isAdmin
          if(true){
            ShowCameraOrDesktop();
          }
      
          window.setInterval(function () {
              connection.socket.emit('', '1');
          }, 10000);
      });
      
      
      
      
      
      
      function getTrueNameByUserid(uid) {
         var ele = $(".member-ul li[data-uid='" + uid + "']");
         if (ele.length !== 0) {
             return ele.attr("data-title");
         }
         return "";
      }
      
      
      
      function onUnMutedL(type){
          connection.attachStreams[0].unmute(type);
      
      }
      
      function onMutedL(type){
            connection.attachStreams[0].mute(type);
      }
      
      function onGdL() {
          HangOut();
      }
      
      return connection;
      }
      
      
      function addStreamStopListener(stream, callback) {
          stream.addEventListener('ended', function () {
              callback();
              callback = function () { };
          }, false);
          stream.addEventListener('inactive', function () {
              callback();
              callback = function () { };
          }, false);
          stream.getTracks().forEach(function (track) {
              track.addEventListener('ended', function () {
                  callback();
                  callback = function () { };
              }, false);
              track.addEventListener('inactive', function () {
                  callback();
                  callback = function () { };
              }, false);
          });
      }