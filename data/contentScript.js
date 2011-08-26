
document.defaultView.addEventListener("message",
        function (evt) {
            var message = dojo.fromJson(evt.data);
            self.postMessage(message/*, "*"*/);
        }, false);

self.on('message', function(data) {
    if (data.event == 'onLoad')
    {
        var themeEl = dojo.byId('content');
        themeEl.innerHTML = data.content.replace(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})([^0-9a-zA-Z])/ig, '<span style=\'background-color: #$1;\'>#$1</span>$2');

        delete data["content"];
    }
    var message = dojo.toJson(data);

    document.defaultView.postMessage(message, "*");

});
