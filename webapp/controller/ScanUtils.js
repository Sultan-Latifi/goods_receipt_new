document.addEventListener("deviceready", init, false);   
function scan() {
  log("scanning");
  cordova.plugins.barcodeScanner.scan(scanSuccessCallback, scanErrorCallback);
}

function scanSuccessCallback(result) {
  log(JSON.stringify(result));
  /*
  alert("We got a barcode\n" +
  "Result: " + result.text + "\n" +
  "Format: " + result.format + "\n" +
  "Cancelled: " + result.cancelled);
   */
}

function scanErrorCallback(error) {
  alert("Scanning failed: " + JSON.stringify(error));
}
        
function encode() {
  log("encoding");
  if (device.platform == "Android") {  //Not supported on iOS
    var stringToEncode = "http://www.sap.com";
    cordova.plugins.barcodeScanner.encode(cordova.plugins.barcodeScanner.Encode.TEXT_TYPE, stringToEncode, encodeSuccessCallback, encodeErrorCallback);
  }
  else {
    log("Encoding is not supported on iOS.  See https://github.com/wildabeast/BarcodeScanner/issues/106");	
  }
}

 function encodeSuccessCallback(result) {
   log(JSON.stringify(result));
 }

 function encodeErrorCallback(error) {
   alert("Encoding failed: " + JSON.stringify(error));
 }
            
 function log(line) {
   var results = document.getElementById("scan_results");
   results.innerHTML+= "<br>" + line;
 }
