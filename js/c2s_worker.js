/**
 * @author Benjamin M. Chase <benjamin.chase@fh-luebeck.de>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
"use strict";

//Web Worker for the C2S Throughput Test

//import constants and utilities for use in Web Worker
importScripts('ndt_constants.js', 'ndt_utils.js');

var c2sEndTime = null;
var c2sStartTime = null;
var c2stestDatasent = null;
var clientDerivedUploadSpd = null;
var c2sUri = null;
var isBlink = null;
var c2sSocket = null;

// websocket buffering threshold
var THRESHOLD = 2001 * PREDEFINED_BUFFER_SIZE;

//Prepare test data
var testData = stringToArrayBuffer(createTestBuffer(PREDEFINED_BUFFER_SIZE));

//listener for webworker
self.addEventListener('message', function (e) {
    var data = e.data;
    switch (data.cmd) {
    case 'prepare':
        // connect to uri in the message
        c2sUri = data.msg;
        isBlink = data.blink;
        C2SSocket();
        break;
    case 'start':
        startC2STest();
        // beginC2STest();
        break;
    case 'stop':
        self.close();
        // Terminates the worker.
        break;
    case 'detectV8':
        detectV8 = data.msg;
        break;
    default:
        // self.postMessage('Unknown command: ' + data.msg);
    };
}, false);

/**
 * Description - Establishes a websocket connection with the server at the c2sUri. The connect uses a 
 * binary connection with arraybuffers.
 * @method C2SSocket
 * @return 
 */
function C2SSocket() {
    c2sSocket = new WebSocket(c2sUri, "binary");
    c2sSocket.binaryType = 'arraybuffer';

    c2sSocket.onopen = function (evt) {
        onOpenC2S(evt);
    };
    
    c2sSocket.onclose = function (evt) {
        onCloseC2S(evt);
    };

    c2sSocket.onmessage = function (evt) {
        onMessageC2S(evt);
    };

    c2sSocket.onerror = function (evt) {
        onErrorC2S(evt);
    };
}

/**
 * Description - Pass message to main thread for debug information on opening the websocket
 * @method onOpenC2S
 * @param {} evt
 * @return 
 */
function onOpenC2S(evt) {
    self.postMessage({
        'cmd': 'writeToScreen',
        'msg': 'CONNECTED C2S'
    });
}

/**
 * Description - when the socket is closed, that means the c2s test is complete. The results from the test are then
 * calculated and sent to the main thread for further processing. The last action is to close the webworker, as it 
 * is no longer needed.
 * @method onCloseC2S
 * @param {} evt
 * @return 
 */
function onCloseC2S(evt) {
    //Get end time of measurement. The Server closes the port when the measurment is complete.
    c2sEndTime = new Date().getTime();

    // correct the amount of data sent by substracting the data still in the send buffer
    c2stestDatasent = c2stestDatasent - c2sSocket.bufferedAmount;

    //TODO: Remove this big ugly hack after the Bug in Blink has been fixed see: https://code.google.com/p/chromium/issues/detail?id=64810
    //This hack is relevant to Chrome and Opera Browsers or any other browser that uses Blink as a rendering engine.
    //V8 Code optimization must be studied to determine the problem and to be able to make a bug report
    if (isBlink) {
        c2stestDatasent = c2stestDatasent / 2;
    }

    self.postMessage({
        'cmd': 'c2sEndTime',
        'msg': c2sEndTime
    });
    var C2STEST_DURATION_SECONDS = (c2sEndTime - c2sStartTime) / 1000;
    clientDerivedUploadSpd = parseFloat(((c2stestDatasent * 8) / 1000) /
        C2STEST_DURATION_SECONDS).toFixed(2);

    self.postMessage({
        'cmd': 'c2stestDatasent',
        'msg': c2stestDatasent
    });
    self.postMessage({
        'cmd': 'c2sSocket.bufferedAmount',
        'msg': c2sSocket.bufferedAmount
    });
    self.postMessage({
        'cmd': 'clientDerivedUploadSpd',
        'msg': clientDerivedUploadSpd
    });
    self.postMessage({
        'cmd': 'writeToScreen',
        'msg': 'DISCONNECTED C2S'
    });

	//TODO: Fix message passing with string + variable, probably with json.stringify()
    // self.postMessage({'cmd': 'writeToScreen', 'msg': '<span style="color: blue;">C2S Duration:' + C2STEST_DURATION_SECONDS + ' seconds </span>'});

    // Close Worker when everything is done
    self.close();
}

/**
 * Description - Relay received messages to main thread for debug output
 * @method onMessageC2S
 * @param {} evt
 * @return 
 */
function onMessageC2S(evt) {
    self.postMessage({
        'cmd': 'writeToScreen',
        'msg': '<span style="color: blue;">RESPONSE: C2S Data</span>'
    });
}

/**
 * Description - Relay error messages to main thread for output
 * @method onErrorC2S
 * @param {} evt
 * @return 
 */
//TODO: Fix message passing with string + variable, probably with json.stringify()
function onErrorC2S(evt) {
    self.postMessage({
        'cmd': 'writeToScreen',
        'msg': '<span style="color: red;">ERROR:' // + evt.data + '</span>'
    });
}

/**
 * Description - Start the C2S test by sending the startime to the main thread and start sending messages
 * @method startC2STest
 * @return 
 */
function startC2STest() {

    // get current time
    c2sStartTime = new Date().getTime();
    self.postMessage({
        'cmd': 'c2sStartTime',
        'msg': c2sStartTime
    });

    sendMessage();
}


/**
 * Description A buffer threshold is set so that the client doesn't consume too much memory. After that the Buffer is filled with 500 messages
 * at a time until it is full. The Buffer is refilled as long as the test hast not ended or the buffer is nor full.
 * Then send testdata as fast as possible as long as there is room in the buffer. As that testdata is being sent the data is also being
 * counted for further use.
 * @method sendMessage
 * @return 
 */
var sendMessage = function () {
    var addDataToBuffer = setInterval(function () {

        // Check for amount of data buffered but not yet sent and if the throughput test has not yet ended
        if ((c2sSocket.bufferedAmount < THRESHOLD) && new Date().getTime() <
            c2sStartTime + C2S_DURATION) {
            // Is this for loop incorrectly optimized in V8(Blink)? 
            // For some reason c2stestDatasent += PREDEFINED_BUFFER_SIZE; is evaluted twice each cycle
            // which skews the results on Blink based browsers.(Chrome, Opera, ...)
            for (var i = 0; i < 500; i++) {
                if ((c2sSocket.bufferedAmount >= THRESHOLD) ||
                    c2sEndTime != null) {
                    break;
                }
                c2stestDatasent += PREDEFINED_BUFFER_SIZE;
                c2sSocket.send(testData);
            }
        }
        //if test has ended then clear the interval and stop sending data
        if (new Date().getTime() >= c2sStartTime + C2S_DURATION) {
            clearInterval(addDataToBuffer);
        }
    }, 0);
};