
  cordova.define('cordova/plugin_list', function(require, exports, module) {
    module.exports = [
      {
          "id": "cordova-plugin-printer.Printer",
          "file": "plugins/cordova-plugin-printer/www/printer.js",
          "pluginId": "cordova-plugin-printer",
        "clobbers": [
          "cordova.plugins.printer"
        ]
        }
    ];
    module.exports.metadata =
    // TOP OF METADATA
    {
      "cordova-plugin-printer": "0.8.0"
    };
    // BOTTOM OF METADATA
    });
    