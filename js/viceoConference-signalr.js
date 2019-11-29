

$.connection.hub.url = "http://okcs.test.cnki.net/okcssignalr/";
$.connection.hub.logging = true;
var chat = $.connection.conferenceChatHub;
$.connection.hub.start()
      .done(function () {
            chat.server.connect("@Edu.Service.LoginUserService.ssoUserID", false);
      })
      .fail(function () {
            console.log("conferenceChatHub------>Connection failed!");
      });
chat.client.getMessage = function (model) {
      
}