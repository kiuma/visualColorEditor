
document.defaultView.addEventListener("message",
        function (evt) {
            var message = dojo.fromJson(evt.data);
            self.postMessage(message/*, "*"*/);
        }, false);

self.on('message', function(data) {
    if (data.event == 'onLoad')
    {
        var themeEl = dojo.byId('content');
        themeEl.innerHTML = data.content.replace(/#([0-9a-zA-Z]{6})/gi, '<span style=\'background-color: #$1;\'>#$1</span>');

        delete data["content"];
    }
    var message = dojo.toJson(data);

    document.defaultView.postMessage(message, "*");

});
