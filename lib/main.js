const widgets = require("widget");
const tabs = require("tabs");
const data = require("self").data;
const pageMod = require("page-mod");
const windowUtil = require("window-utils");

var {Cc, Ci, Cu} = require("chrome");
var utils = {};
Cu.import("resource://gre/modules/NetUtil.jsm", utils);
Cu.import("resource://gre/modules/FileUtils.jsm", utils);

pageMod.PageMod({
    include: data.url("cssColorEditor.html"),
    contentScriptWhen: 'end',
    contentScriptFile: [data.url("dojo.js"), data.url("contentScript.js")],
    onAttach: function onAttach(worker) {
        console.log("Attaching content scripts")
        worker.on('message', function(eventData) {
            console.log("command: " + eventData.command);
            if ("load" == eventData.command)
            {
                openFile(worker, eventData.fileName);
            }
            else if ("save" == eventData.command)
            {
                saveFile(worker, eventData.content, eventData.fileName);
            }

        });
    }
});

var widget = widgets.Widget({
    id: "visualColorEditor",
    label: "Visual Color Editor",
    contentURL: data.url("icon48.png"),
    onClick: function() {
        tabs.open(data.url("visualColorEditor.html"));
    }
});


var openFile = function (worker, fileName)
    {
        var filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        var window = windowUtil.activeWindow;
        filePicker.init(window, 'Open file...', Ci.nsIFilePicker.modeOpen);
        if (fileName)
        {
            var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            localFile.initWithPath(fileName);
            filePicker.displayDirectory = localFile.parent;
            filePicker.defaultString = localFile.leafName;
        }

        var result = filePicker.show();

        if (result != Ci.nsIFilePicker.returnOK)
        {
            return;
        }
        var file = filePicker.file;

        var sourceFile = filePicker.fileURL.path;

        utils.NetUtil.asyncFetch(file, function(inputStream, status) {
    		if (!Components.isSuccessCode(status)) {
                var message = {event: 'onLoad', error: 'Error opening file \'' + sourceFile + '\' (' + status + ')', fileName: sourceFile};
                worker.postMessage(message);
				return;
			 }
			try {
			    var fileContent = utils.NetUtil.readInputStreamToString(inputStream, inputStream.available()).replace('&', '&amp;').replace('>', '&gt;').replace('<', '&lt;');

                var message = {event: 'onLoad', content: fileContent, fileName: sourceFile, message: 'Content file: \'' + sourceFile.replace('&', '&amp;').replace('>', '&gt;').replace('<', '&lt;') + '\''};
                worker.postMessage(message);
			} catch (e) {
				console.log(e.message);
                var message = {event: 'onLoad', error: 'Error opening file \''+ sourceFile +'\': ' + e.message, fileName: sourceFile};
                worker.postMessage(message);
                return;
			}
		});


    };

var saveFile = function (worker, content, fileName)
    {
        var filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        var window = windowUtil.activeWindow;
        filePicker.init(window, 'Save file as...', Ci.nsIFilePicker.modeSave);
        if (fileName)
        {
            var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            localFile.initWithPath(fileName);
            filePicker.displayDirectory = localFile.parent;
            filePicker.defaultString = localFile.leafName;
        }
        var result = filePicker.show();

        if (result == Ci.nsIFilePicker.returnCancel)
        {
            return;
        }
        var file = filePicker.file;
        var destFile = filePicker.fileURL.path;

        var ostream = utils.FileUtils.openSafeFileOutputStream(file);

        var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
        converter.charset = "UTF-8";

        var istream = converter.convertToInputStream(content);

        try
        {
            utils.NetUtil.asyncCopy(istream, ostream, function(status)
            {
                if (!Components.isSuccessCode(status))
                {
                    // Handle error!
                    var message = {event: 'onSave', error: 'Error saving file \'' + destFile + '\' (' + status + ')', fileName: destFile};
                    worker.postMessage(message);
                    return;
                }
                var message = {event: 'onSave', message: 'Content saved to file: \'' + destFile + '\'', fileName: destFile};
                worker.postMessage(message);
                return;

            });
        }
        catch (e)
        {
            console.debug(e.message);
            var message = {event: 'onSave', error: 'Error saving file \''+ destFile +'\': ' + e.message, fileName: destFile};
            worker.postMessage(message);
            return;
        }
    };
console.log("The add-on is running.........");




