const DEVICE_SERIAL_NUMBER_PROBE_INTERVAL = 100;
const DEVICE_SERIAL_NUMBER_LENGTH = 52;
const DEVICE_HANDLE_TIMEOUT = 1 * 60 * 1000;
const NULL_COMMAND_TIMEOUT = 100;
const CHECK_SERIAL_NUMBER_FLUSH_TIMEOUT = 500;

const log = console.log;

console.log = function(string){

  log("Test_log: " + string);

  }

const DEVICE_STATES = Object.freeze({
   "INITED": 0,
   "OPENED": 1,
   "TEST_DATA_SENT": 2,
   "RUBBISH": 3,
   "SERIAL_FOUND": 4,
   "PURGING": 5,
   "DEVICE_IS_READY": 6,
   "DEVICE_ERROR":7
});

const DEVICES = Object.freeze({
   //Basic Robot
   0:{
      "firmware":7,
      "commands":{
         "check":{
            "code": "a",
            "params": [],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         },
         "power":{
            "code": "c",
            "params": ["ubyte", "ubyte"],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         },
         "rob_encoder":{
            "code": "e",
            "params": ["ubyte"],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         },
         "rob_lamps":{
            "code": "h",
            "params": ["ubyte"],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         },
         "rob_pow_encoder":{
            "code": "g",
            "params": ["ubyte", "ubyte","ubyte","ubyte"],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         },
         "rob_claw":{
            "code": "j",
            "params": ["ubyte"],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         },
         "sensors":{
            "code": "i",
            "params": ["ubyte", "ubyte", "ubyte", "ubyte", "ubyte"],
            "response": {
                         "encoder0" : "uint2",
                         "encoder1" : "uint2",
                         "path0"    : "uint2",
                         "path1"    : "uint2",
                         "a0"       : "ubyte[4]",
                         "a1"       : "ubyte[4]",
                         "a2"       : "ubyte[4]",
                         "a3"       : "ubyte[4]",
                         "a4"       : "ubyte[4]",
                         "button"   : "ubyte"
                        }
         }
      }
   },

   //Old lab
   1:{

     "firmware":5,
     "commands":{
        "check":{
           "code": "a",
           "params": [],
           "response": {
                        "D8-13" : "ubyte",
                        "a0"       : "ubyte[2]",
                        "a1"       : "ubyte[2]",
                        "a2"       : "ubyte[2]",
                        "a3"       : "ubyte[2]",
                        "a4"       : "ubyte[2]",
                        "a5"       : "ubyte[2]",
                        "a6"       : "ubyte[2]",
                        "a7"       : "ubyte[2]",
                       }
        }

    }
   },

   //New lab
   2:{

     "firmware":2,
     "commands":{
        "check":{
           "code": "a",
           "params": [],
           "response": {
                        "D8-13" : "ubyte",
                        "a0"       : "ubyte[2]",
                        "a1"       : "ubyte[2]",
                        "a2"       : "ubyte[2]",
                        "a3"       : "ubyte[2]",
                        "a4"       : "ubyte[2]",
                        "a5"       : "ubyte[2]",
                        "a6"       : "ubyte[2]",
                        "a7"       : "ubyte[2]",
                       }
        }

    }

   }
});


var arrDevices = [];



function InterfaceDevice(port){
   this.port = port;
   var LOG = "[" + port.path + "] ";

   console.log(LOG + "Trying to register a new device...");

   var state = DEVICE_STATES["INITED"];
   var bufIncomingData = new Uint8Array();
   var iConnectionId;
   var iDeviceID;
   var iFirmwareVersion;
   var sSerialNumber;
   var iSerialNumberOffset;
   var iWaiting = 0;
   var response = {};
   var commandToRun = null;
   var callback = null;
   var automaticStopCheckingSerialNumberTimeout

   var isStopCheckingSerialNumber = false;

   var commands_stack = [];

   var    time1 = Date.now();
   var    time_delta = 0;
   var    time2 = Date.now();

   var command_try_send_time1 = null;
   var command_try_send_time2 = null;

   var check_serial_number_time1 = Date.now();
   var check_serial_number_time2 = Date.now();

   var can_check_serial_after_flush = true;

   var onReceiveCallback = function(info){
      if(info.connectionId == iConnectionId && info.data){
         var buf = new Uint8Array(info.data);
         console.log(LOG + "<- " + buf.length);
         var bufIncomingDataNew = new Uint8Array(bufIncomingData.length + buf.length);
         bufIncomingDataNew.set(bufIncomingData);
         bufIncomingDataNew.set(buf, bufIncomingData.length);

         bufIncomingData = bufIncomingDataNew;

         //We are not waiting for any data;
         if(commandToRun == null) return;


         if(bufIncomingData.length >= iWaiting){
            console.log(LOG + "command '" + commandToRun.code + "' complete.");

            //all params
            var iResponsePointer = 1;
            Object.keys(commandToRun.response).forEach(function (sField){
               switch(commandToRun.response[sField]){
                  case "uint2":{
                     response[sField] = bufIncomingData[iResponsePointer] * 256 + bufIncomingData[iResponsePointer + 1];
                     iResponsePointer += 2;
                     break;
                  }
                  case "ubyte[4]":{
                     response[sField] = [];
                     response[sField].push(bufIncomingData[iResponsePointer]);
                     response[sField].push(bufIncomingData[iResponsePointer + 1]);
                     response[sField].push(bufIncomingData[iResponsePointer + 2]);
                     response[sField].push(bufIncomingData[iResponsePointer + 3]);
                     iResponsePointer += 4; //modified +=2
                     break;
                  }
                  case "ubyte":{
                     response[sField] = bufIncomingData[iResponsePointer];
                     iResponsePointer += 1;
                     break;
                  }
               }
            });

            //console.log(response);
            commandToRun = null;

            /******/

                  if (commands_stack.length >= 1){

                    let command_object =  commands_stack.shift();

                  let  commandToRun_local  = command_object.command;
                  let  params_local        = command_object.params;
                  let  fCallback_local     = command_object.fCallback;
                  let  self                = command_object.self;

                  self.command(commandToRun_local,params_local,fCallback_local);

                  }

            /******/

            iWaiting = 0;
            callback(response);
         }
      }
   };

   var onErrorCallback = function (info){

     console.log("onErrorCallback");

      if (info.connectionId == iConnectionId){

          console.error(LOG + "error: " + info.error);

          state = DEVICE_STATES["DEVICE_ERROR"];

          chrome.serial.disconnect(iConnectionId, function(result){

                 console.log("Connection closed: " + result);
          });

      }

   }

   var onSend = function(){
      console.log(LOG + "buffer sent.");

      time1 = Date.now();
      time_delta = time1 - time2;
      console.log("time delta: " + time_delta)
      time2 = Date.now();
   };
   var onFlush = function(){
      console.log(LOG + "port flushed.");
      commandToRun = null;
      can_check_serial_after_flush = true;
   }

   var purgePort = function(){
      console.log(LOG + "purge()");
      state = DEVICE_STATES["PURGE"];
      if(bufIncomingData.length > 0){
         chrome.serial.flush(iConnectionId, onFlush);
         bufIncomingData = new Uint8Array();
         setTimeout(purgePort, 300);
      }
      else{
         console.log(LOG + "device is ready.");
         state = DEVICE_STATES["DEVICE_IS_READY"];
      }
   }


   var getSerial = function(){
      console.log(LOG + "-> getSerial()");
      var buf=new ArrayBuffer(1);
      var bufView=new Uint8Array(buf);
      bufView[0] = 32;
      chrome.serial.send(iConnectionId, buf, onSend);
      state = DEVICE_STATES["TEST_DATA_SENT"];
   }

   var checkSerialNumber = function(){
      console.log(LOG + "let's check the serial");

      var sIncomingData = new TextDecoder("utf-8").decode(bufIncomingData);
      console.log(LOG + "Now we have: " + sIncomingData);

      if(bufIncomingData.length > DEVICE_SERIAL_NUMBER_PROBE_INTERVAL){
         iSerialNumberOffset = sIncomingData.indexOf("ROBBO");
         if(iSerialNumberOffset < 0){
            console.log(LOG + "Rubbish instead of serial number");
            state = DEVICE_STATES["RUBBISH"];
         }
         else{
            iDeviceID        = parseInt(sIncomingData.substring(iSerialNumberOffset + 6, iSerialNumberOffset + 11));
            iFirmwareVersion = parseInt(sIncomingData.substring(iSerialNumberOffset + 12, iSerialNumberOffset + 17));
            sSerialNumber    = sIncomingData.substring(iSerialNumberOffset + 18, iSerialNumberOffset + DEVICE_SERIAL_NUMBER_LENGTH);
            console.log(LOG + "Device=" + iDeviceID + " Firmware=" + iFirmwareVersion + " Serial='" + sSerialNumber + "'");

            purgePort();
         }
      }
      else{
         if((sSerialNumber === undefined) && (!isStopCheckingSerialNumber) && (can_check_serial_after_flush)) {


            check_serial_number_time2 = Date.now();

            if ((check_serial_number_time2 - check_serial_number_time1)>= CHECK_SERIAL_NUMBER_FLUSH_TIMEOUT){

                    console.log('CHECK_SERIAL_NUMBER_FLUSH_TIMEOUT');

                    chrome.serial.flush(iConnectionId, onFlush);

                    can_check_serial_after_flush = false;

                    check_serial_number_time1 = Date.now();


            }else{

                  //Let's send the space
                  getSerial();
            }

            //Let's check the response
             let checkSerialNumberTimeout =   setTimeout(checkSerialNumber, 100); //100

         }
      }
   }

   var onConnect = function(connectionInfo){
      console.log(LOG + "connected.");
      state = DEVICE_STATES["CONNECTED"];

      iConnectionId = connectionInfo.connectionId;

      chrome.serial.flush(iConnectionId, onFlush);

      chrome.serial.onReceive.addListener(onReceiveCallback);

      chrome.serial.onReceiveError.addListener(onErrorCallback);

    setTimeout(checkSerialNumber, 300);

      automaticStopCheckingSerialNumberTimeout =  setTimeout(function(){


          console.log("Stop checking serial number.");
        //  clearTimeout(checkSerialNumberTimeout);
          isStopCheckingSerialNumber = true;

          chrome.serial.disconnect(iConnectionId, function(result){

                 console.log("Connection closed: " + result);
          });



      }  ,DEVICE_HANDLE_TIMEOUT);
   }

   this.stopCheckingSerialNumber = function(){

     if (!isStopCheckingSerialNumber){

       isStopCheckingSerialNumber = true;
       clearTimeout(automaticStopCheckingSerialNumberTimeout);

       chrome.serial.disconnect(iConnectionId, function(result){

              console.log("Connection closed: " + result);
       });

     }


   }


   chrome.serial.connect(port.path, {bitrate: 115200}, onConnect);


   this.getState = function(){
      return state;
   }

   this.getDeviceID = function(){
      return iDeviceID;
   }

   this.getPortName = function(){
      return this.port.path;
   }

   this.getSerialNumber = function(){

        return sSerialNumber;

   }

   this.command = function(command, params, fCallback){
    //  if(commandToRun != null) return;
    //  commandToRun = command;

    var params = params;
    var fCallback = fCallback;

    command_try_send_time2 = Date.now();

    if ((command_try_send_time2 - command_try_send_time1) >= NULL_COMMAND_TIMEOUT ){


          chrome.serial.flush(iConnectionId, onFlush);

    }

      if(commandToRun != null){

        if (command != DEVICES[0].commands.check){

             console.log(`buffering commands1... buffer length: ${commands_stack.length}`);

            commands_stack.push({command:command,params:params,fCallback:fCallback,self:this});

        }


          return;

      }

      if (commands_stack.length > 0){


        if (command != DEVICES[0].commands.check){

          console.log(`buffering commands2... buffer length: ${commands_stack.length}`);

          commands_stack.push({command:command,params:params,fCallback:fCallback,self:this});

        }



          let command_object =  commands_stack.shift();

          commandToRun  = command_object.command;
          params        = command_object.params;
          fCallback     = command_object.fCallback;


      }else{

          commandToRun = command;

      }

      // setTimeout(function(){
      //
      //     commandToRun=null;
      //
      // },500)


       command_try_send_time1 = Date.now();

      bufIncomingData = new Uint8Array();
      var buf=new ArrayBuffer(command.code.length + params.length + 1);
      var bufView=new Uint8Array(buf);
      var bufCommand = new TextEncoder("utf-8").encode(command.code);
      bufView.set(bufCommand);

      var iParamOffset = 0;
      params.forEach(function(param){
         bufView[bufCommand.length + iParamOffset] = param;
         iParamOffset++;
      });

      bufView[bufCommand.length + iParamOffset] = 36;

      //console.log(buf);

      chrome.serial.send(iConnectionId, buf, onSend);

      //for #
      var iWaitingNew = 1;

      //all params
      Object.keys(command.response).forEach(function (sField){
         switch(command.response[sField]){
            case "uint2":{
               iWaitingNew += 2;
               break;
            }
            case "ubyte[4]":{
               iWaitingNew += 4;
               break;
            }
            case "ubyte":{
               iWaitingNew += 1;
               break;
            }
         }
      });

      callback = fCallback;

      console.log(LOG + "we wating for " + iWaitingNew + " bytes");
      iWaiting = iWaitingNew;
   }


   // var onGetDevices = function(ports) {
   //   for (var i=0; i<ports.length; i++) {
   //     console.log(ports[i].path);
   //     var device = new InterfaceDevice(ports[i]);
   //      arrDevices.push(device);
   //   }
   // }
   //
   // this.searchDevices(callback){
   //
   //    chrome.serial.getDevices(callback);
   //
   // }
   //
   //
   // this.getConnectedDevices(){
   //
   //
   //
   // }


}


const searchDevices = function(){

  arrDevices = [];

  var onGetDevices = function(ports) {
    for (var i=0; i<ports.length; i++) {
      console.log(ports[i].path);
      var device = new InterfaceDevice(ports[i]);
       arrDevices.push(device);
    }
  }

    chrome.serial.getDevices(onGetDevices);

};

const getConnectedDevices = function(){

    return arrDevices;

}



// var fuck = false;
// var mainLoop = function(){
//    arrDevices.forEach(function(device) {
//       if(device.getDeviceID() == 0 && device.getState() == DEVICE_STATES["DEVICE_IS_READY"]){
//
//          if(!fuck){
//             device.command(DEVICES[0].commands.sensors, [7, 0, 0, 0, 0], function(response){
//                console.log("pizda=" + response.a0);
//             });
//             fuck = true;
//             return;
//          }
//          device.command(DEVICES[0].commands.power, [0, 0], function(response){
//             console.log("pizda=" + response.a0);
//          });
//       }
//    });
//
//    setTimeout(mainLoop, 100);
// }














export  {

  InterfaceDevice,
  searchDevices,
  getConnectedDevices,
  DEVICES,
  DEVICE_STATES


};

// chrome.app.runtime.onLaunched.addListener(function() {
//   // Center window on screen.
//   var screenWidth = screen.availWidth;
//   var screenHeight = screen.availHeight;
//   var width = 500;
//   var height = 300;
//
//
//   chrome.serial.getDevices(onGetDevices);
//   mainLoop();
//
//
//   chrome.app.window.create('index.html', {
//     id: "helloWorldID",
//     outerBounds: {
//       width: width,
//       height: height,
//       left: Math.round((screenWidth-width)/2),
//       top: Math.round((screenHeight-height)/2)
//     }
//   });
// });
