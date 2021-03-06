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

var ndtMessageLength = null;
var ndtControlSocket = null;

// web worker for c2s throughput test
var c2sWorker = new Worker('./js/c2s_worker.js');

/**
 * Description Tell the webworker to get ready
 * @method prepareWorker
 * @param {} worker 
 * @param {} uri which uri should the worker connect with
 * @param {} bool used to tell the worker if Blink is the current JS Engine
 * @return 
 */
function prepareWorker(worker, uri, bool) {
    worker.postMessage({
        'cmd': 'prepare',
        'msg': uri,
        'blink': bool
    });
}

/**
 * Description Tells the Worker to start processing
 * @method startWorker
 * @param {} worker
 * @return 
 */
function startWorker(worker) {
    worker.postMessage({
        'cmd': 'start'
    });
}

/**
 * Description Tells the worker to stop and close
 * @method stopWorker
 * @param {} worker
 * @return 
 */
function stopWorker(worker) {
    worker.postMessage({
        'cmd': 'stop'
    });
}

// Listener for communication with the c2s web worker
// Processes the messages received
c2sWorker.addEventListener('message', function (e) {
    var data = e.data;
    switch (data.cmd) {
    case 'c2sEndTime':
        clientResults.c2sEndTime = data.msg;
        break;
    case 'c2sStartTime':
        clientResults.c2sStartTime = data.msg;
        break;
    case 'clientDerivedUploadSpd':
        clientResults.clientDerivedUploadSpd = data.msg;
        writeToScreen("clientDerivedUploadSpd: " + data.msg, 'debug');
        break;
    case 'c2stestDatasent':
        clientResults.c2stestDatasent = data.msg;
        writeToScreen("c2sDatasent: " + data.msg, 'debug');
        break;
    case 'c2sSocket.bufferedAmount':
        writeToScreen("c2sSocket.bufferedAmount: " + data.msg, 'debug');
        break;
    case 'writeToScreen':
        if (DEBUG) {
            writeToScreen(data.msg, 'debug');
        }
        break;
    default:
        // self.postMessage('Unknown command: ' + data.msg);
    };
}, false);

// The current state of the client is stored here. This is used to decide
// which action needs to be taken next.
// HANDSHAKE should be set to the first selected test
var clientState = {

	complete: false,
	queued: false,
	versionCompatible: false,
	waitingForMessage: false,
	timeTillStart: null,
	requestedC2STest: false,
	requestedS2CTest: false,
	requestedMetaTest: false,
	requestedMIDTest: false,
	requestedSFWTest: false,
	currentTest: HANDSHAKE,
	/**
	 * Description set all the values to false
	 * @method resetClient
	 * @return
	 */
	resetClient: function () {
		for (var key in clientState) {
			if (clientState[key] == true || clientState[key] == false) {
				clientState[key] = false;
			} else {
				clientState[key] = null;
			}

		}
	}
	};

// Store all the web 100 variables and other data needed for processing the results.
var clientResults = {
    CurMSS: null,
    X_Rcvbuf: null,
    X_Sndbuf: null,
    AckPktsIn: null,
    AckPktsOut: null,
    BytesRetrans: null,
    CongAvoid: null,
    CongestionOverCount: null,
    CongestionSignals: null,
    CountRTT: null,
    CurCwnd: null,
    CurRTO: null,
    CurRwinRcvd: null,
    CurRwinSent: null,
    CurSsthresh: null,
    DSACKDups: null,
    DataBytesIn: null,
    DataBytesOut: null,
    DataPktsIn: null,
    DataPktsOut: null,
    DupAcksIn: null,
    ECNEnabled: null,
    FastRetran: null,
    MaxCwnd: null,
    MaxMSS: null,
    MaxRTO: null,
    MaxRTT: null,
    MaxRwinRcvd: null,
    MaxRwinSent: null,
    MaxSsthresh: null,
    MinMSS: null,
    MinRTO: null,
    MinRTT: null,
    MinRwinRcvd: null,
    MinRwinSent: null,
    NagleEnabled: null,
    OtherReductions: null,
    PktsIn: null,
    PktsOut: null,
    PktsRetrans: null,
    RcvWinScale: null,
    SACKEnabled: null,
    SACKsRcvd: null,
    SendStall: null,
    SlowStart: null,
    SampleRTT: null,
    SmoothedRTT: null,
    SndWinScale: null,
    SndLimTimeRwin: null,
    SndLimTimeCwnd: null,
    SndLimTimeSender: null,
    SndLimTransRwin: null,
    SndLimTransCwnd: null,
    SndLimTransSender: null,
    SndLimBytesRwin: null,
    SndLimBytesCwnd: null,
    ndLimBytesSender: null,
    SubsequentTimeouts: null,
    SumRTT: null,
    Timeouts: null,
    TimestampsEnabled: null,
    WinScaleRcvd: null,
    WinScaleSent: null,
    DupAcksOut: null,
    StartTimeUsec: null,
    Duration: null,
    c2sData: null,
    c2sAck: null,
    s2cData: null,
    s2cAck: null,
    half_duplex: null,
    link: null,
    congestion: null,
    bad_cable: null,
    mismatch: null,
    spd: null,
    bw: null,
    loss: null,
    avgrtt: null,
    waitsec: null,
    timesec: null,
    order: null,
    rwintime: null,
    sendtime: null,
    cwndtime: null,
    rwin: null,
    swin: null,
    cwin: null,
    rttsec: null,
    Sndbuf: null,
    aspd: null,
    CWND_Limited: null,
    minCWNDpeak: null,
    maxCWNDpeak: null,
    CWNDpeaks: null,
    serverVersion: null,
    serverDerivedUploadSpd: null,
    clientDerivedUploadSpd: null,
    clientDerivedDownloadSpd: null,
    c2stestDatasent: null,
    s2cdataLength: null,
    c2sStartTime: null,
    c2sEndTime: null,
    s2cStartTime: null,
    s2cEndTime: null,
    linkSpd: null,
    /**
     * Description set all the values to null
     * @method resetClient
     * @return 
     */
    resetClient: function () {
        for (var key in clientResults) {
            clientResults[key] = null;
        }
    }
};

/**
 * Description starts the client.
 * @method NDTinit
 * @return 
 */
function NDTinit() {
	ControlSocket();
}

/**
 * Description Opens a websocket on the control port of the ndt server
 * @method ControlSocket
 * @return 
 */
function ControlSocket() {
    ndtControlSocket = new WebSocket(controlUri, "binary");
    ndtControlSocket.binaryType = 'arraybuffer';

    ndtControlSocket.onopen = function (evt) {
        onOpen(evt);
    };

    ndtControlSocket.onclose = function (evt) {
        onClose(evt);
    };

    ndtControlSocket.onmessage = function (evt) {
        onMessage(evt);
    };

    ndtControlSocket.onerror = function (evt) {
        onError(evt);
    };
}

/**
 * Description - Generates and sends a NDT control message.
 * Messages arriving as an Arraybuffer will be sent untouched as an Arraybuffer e.g. client metadata for meta tests.
 * Messages arriving as anything else will be sent as a 1 byte arraybuffer e.g. testsuite request on login
 * Control messages must always be sent through the control socket
 * @return
 * @method sendNDTControlMsg
 * @param {} type type of ndt message to be sent
 * @param {} message either a string or an arraybuffer
 * @return 
 */
function sendNDTControlMsg(type, message) {
    var isArrayBuffer = false;

    // If message is an Arraybuffer then bytelength must be used to determine the message length
    if (Object.prototype.toString.call(message) === '[object ArrayBuffer]') {
        isArrayBuffer = true;
        var messageLength = message.byteLength;
    }
    //otherwise it is a string and get the message length with .toString.length
    else {
        var messageLength = message.toString.length;
    }

    //length calculation uses both available bytes
    var header = new ArrayBuffer(MSG_HEADER_LENGTH);
    var x = new Uint8Array(header);
    x[0] = type;
    x[1] = (messageLength >> 8) & 0xff;
    x[2] = messageLength & 0xff;

    send(header, ndtControlSocket);

    //only send a message body that contains data.
    if (messageLength > 0) {
        if (isArrayBuffer) {
            send(message, ndtControlSocket);
        } else if (!isArrayBuffer && messageLength == '1') {
            var body = new ArrayBuffer(1);
            var x = new Uint8Array(body);
            x[0] = message;
            send(body, ndtControlSocket);
        } else {
            //error. Message must be either an Arraybuffer or a number less than 256
        }
    }

}

/**
 * Description when the control socket is opened set the client state as being connected
 * and output information for the user
 * @method onOpen
 * @param {} evt
 * @return 
 */
function onOpen(evt) {
    if (DEBUG) {
        writeToScreen("CONNECTED", 'debug');
    }
    clientState.connected = true;
    writeToScreen(displayMessages.connected + hostname, 'details');
}

/**
 * Description When the connection is closed then show the results and clean up the objects
 * @method onClose
 * @param {} evt
 * @return 
 */
function onClose(evt) {
    clientState.complete = true;
    if (DEBUG) {
        writeToScreen("DISCONNECTED", 'debug');
    }
    showResults();
    cleanUp();
}

/**
 * Description when an incoming message is received, send it to get parsed.
 * @method onMessage
 * @param {} evt
 * @return 
 */
function onMessage(evt) {
    readNDTControlMsg(arrayBufferToString(evt.data));
    // if (DEBUG) {
    // writeToScreen('<span style="color: blue;">onMessage RESPONSE: ' + arrayBufferToString(evt.data) + '</span>', 'debug');
    // }
}

/**
 * Description Output debug information on errors.
 * @method onError
 * @param {} evt
 * @return 
 */
function onError(evt) {
    if (DEBUG) {
        writeToScreen('<span style="color: red;">ERROR:' + evt.data +
            '</span>', 'debug');
    }
}

/**
 * Description Parse the incoming messages and decide what need to be done with them
 * @method readNDTControlMsg
 * @param {} message
 * @return 
 */
function readNDTControlMsg(message) {

    // In case of Old Client Kick Off message: do nothing
    if (message == KICK_OFF) {
        // remove kick off message from data stream
        var messageContent = extractNDTMessageBody(message, KICK_OFF.length);
        message = messageContent[0];
        return;
    }

    //parse messages until the end
    while (message.length > 0) {

        switch (message.charCodeAt(0)) {
        case COMM_FAILURE:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: COMM_FAILURE</span>',
                    'debug');
            }
            break;
        case SRV_QUEUE:
            message = extractNDTHeader(message);
            clientState.waitingForMessage = true;

            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: SRV_QUEUE</span>',
                    'debug');
            }
            break;
        case MSG_LOGIN:
            message = extractNDTHeader(message);
            var messageContent = extractNDTMessageBody(message,
                ndtMessageLength);
            message = messageContent[0];

            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: MSG_LOGIN</span>',
                    'debug');
            }

            //get the server Version. look for a "v" in the message for the version
            if ((messageContent[1].indexOf("v")) != -1) {
                clientResults.serverVersion = messageContent[1];
                // if client version is too old close connection
                if (clientResults.serverVersion < LAST_VALID_SERVER_VERSION) {
                    clientState.versionCompatible = false;
                    ndtControlSocket.close();
                    writeToScreen(
                        '<span style="color: red;">Server is too old for this client. Closing connection.</span>',
                        'details');
                    break;
                }
                if (clientResults.serverVersion == CLIENT_VER) {
                    clientState.versionCompatible = true;
                    writeToScreen(
                        '<span style="color: blue;">Client and server have the same version.</span>',
                        'details');
                }

                if (clientResults.serverVersion > LAST_VALID_SERVER_VERSION &&
                    clientResults.serverVersion < CLIENT_VER ||
                    clientResults.serverVersion > CLIENT_VER) {
                    clientState.versionCompatible = true;
                    writeToScreen(
                        '<span style="color: orange;">Client and server do not have the same version, but should be compatible.</span>',
                        'details');
                }

                // Server version
                writeToScreen('<span style="color: blue;">Server Version:' +
                    clientResults.serverVersion + '</span>', 'details');
            }

            //TODO: check tests sent from server
            // if (messageContent[1].indexOf(TESTTYPE_C2S) != -1 || messageContent[1].indexOf(TESTTYPE_META) != 1
            // || messageContent[1].indexOf(TESTTYPE_S2C) != 1 || messageContentessageContent[1].indexOf(TESTTYPE_MID) != 1 || messageContent[1].indexOf(TESTTYPE_SFW) != 1) {
            // }

            // var testArray = messageContent[1].split(/[ ,\n]+/);
            // for ( testOffset = 0; testOffset < testArray.length; testOffset++) {
            // //find the occurence of the string and set the corresponding value in the object
            // if (testArray[testOffset].indexOf("CurMSS") > -1) {
            // clientResults.CurMSS = testArray[testOffset + 1];
            // }

            break;
        case TEST_PREPARE:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: TEST_PREPARE</span>',
                    'debug');
            }
            //only start test on compatible server
            if (clientState.versionCompatible) {
                switch (clientState.currentTest) {
                case HANDSHAKE:
                    clientState.currentTest = TESTTYPE_C2S;
                    prepareWorker(c2sWorker, c2sUri, Boolean(self.chrome));
                    // C2SSocket();
                    break;
                case TESTTYPE_C2S:
                    prepareWorker(c2sWorker, c2sUri, Boolean(self.chrome));
                    c2sWorker.postmessage('detectV8', detectV8());
                    // C2SSocket();
                    break;
                case TESTTYPE_S2C:
                    S2CSocket();
                    //start progressbar
                    s2cProgress();
                    //runningInboundTest
                    writeToScreen(displayMessages.runningInboundTest,
                        'details');
                    break;
                default:
                    break;

                }
            }

            break;
        case TEST_START:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: TEST_START</span>',
                    'debug');
            }
            //only start test on compatible server
            if (clientState.versionCompatible) {
                switch (clientState.currentTest) {
                case TESTTYPE_C2S:
                    startWorker(c2sWorker);
                    // startC2STest();
                    //start progressbar
                    c2sProgress();
                    //Show message runningOutboundTest
                    writeToScreen(displayMessages.runningOutboundTest,
                        'details');
                    break;
                case TESTTYPE_META:
                    startMetaTest();
                    //start progressbar
                    metaProgress();
                    //sendingMetaInformation
                    writeToScreen(displayMessages.sendingMetaInformation,
                        'details');
                    break;
                default:
                    break;
                }
            }

            break;
        case TEST_MSG:
            getResults(message);
            message = extractNDTHeader(message);
            clientState.waitingForMessage = true;

            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: TEST_MSG</span>',
                    'debug');
            }
            break;
        case TEST_FINALIZE:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: TEST_FINALIZE</span>',
                    'debug');
            }
            switch (clientState.currentTest) {
            case TESTTYPE_C2S:
                clientState.currentTest = TESTTYPE_S2C;
                break;
            case TESTTYPE_S2C:
                clientState.currentTest = TESTTYPE_META;
                break;
            case TESTTYPE_META:
                clientState.currentTest = null;
                writeToScreen(displayMessages.stopping, 'details');
                break;
            default:
                clientState.currentTest = null;
                break;
            }
            break;
        case MSG_ERROR:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: MSG_ERROR</span>',
                    'debug');
            }
            break;
        case MSG_RESULTS:
            getResults(message);
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: MSG_RESULTS</span>',
                    'debug');
            }
            break;
        case MSG_LOGOUT:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: MSG_LOGOUT</span>',
                    'debug');
            }
            break;
        case MSG_WAITING:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: MSG_WAITING</span>',
                    'debug');
            }
            break;
        case MSG_EXTENDED_LOGIN:
            message = extractNDTHeader(message);
            if (DEBUG) {
                writeToScreen(
                    '<span style="color: blue;">RESPONSE: MSG_EXTENDED_LOGIN</span>',
                    'debug');
            }
            break;
        default:
            //get results that arrive after their header
            getResults(message);
            var messageContent = extractNDTMessageBody(message,
                ndtMessageLength);
            message = messageContent[0];

            //get client upload speed from c2s test results
            // client is awaiting message for the c2s test and the message is not empty
            if (clientState.waitingForMessage && clientState.currentTest ==
                TESTTYPE_C2S && messageContent[1] > 0) {
                // client upload speed
                if (DEBUG) {
                    writeToScreen(
                        '<span style="color: blue;">Client upload:' +
                        messageContent[1] + '</span>', 'debug');
                }
                clientResults.serverDerivedUploadSpd = messageContent[1];

                //After message is recieved set status back to false
                clientState.waitingForMessage = false;
            }

            if (clientState.waitingForMessage && clientState.currentTest ==
                HANDSHAKE && messageContent[1] >= 0) {
                // client queue position
                if (DEBUG) {
                    writeToScreen(
                        '<span style="color: blue;">Client Queue:' +
                        messageContent[1] + '</span>', 'debug');
                }

                if (messageContent[1] == SRV_QUEUE_SERVER_FAULT) {
                    // Server Fault
                    if (DEBUG) {
                        writeToScreen(
                            '<span style="color: blue;">RESPONSE: Server Fault</span>',
                            'debug');
                    }
                    writeToScreen(displayMessages.serverFault, 'details');
                    //Close socket on fault
                    ndtControlSocket.close();
                    break;

                } else if (messageContent[1] == SRV_QUEUE_SERVER_BUSY) {
                    // Server busy/fault
                    if (DEBUG) {
                        writeToScreen(
                            '<span style="color: blue;">RESPONSE: Server busy or server fault</span>',
                            'debug');
                    }
                    writeToScreen(displayMessages.serverBusy, 'details');
                    //Close socket on fault
                    ndtControlSocket.close();
                    break;

                } else if (messageContent[1] == SRV_QUEUE_HEARTBEAT) {
                    //Test_Status check
                    // Signalize client is waiting with empty MSG_WAITING packet
                    sendNDTControlMsg(MSG_WAITING, "");
                    if (DEBUG) {
                        writeToScreen(
                            '<span style="color: blue;">RESPONSE: Client responded waiting...</span>',
                            'debug');
                    }

                } else if (messageContent[1] != SRV_QUEUE_TEST_STARTS_NOW) {

                    clientState.queued = true;
                    clientState.timeTillStart = messageContent[1];
                    writeToScreen(
                        'Client queued. Test should start in approximately ' +
                        clientState.timeTillStart + ' min.', 'details');
                } else {
                    // Client starting tests
                    clientState.queued = false;
                    clientState.timeTillStart = null;
                }

                //After message is recieved set status back to false
                clientState.waitingForMessage = false;
            }

            break;
        }
    }
}

/**
 * Description Read the header of the incoming messages and strip it from the message
 * @method extractNDTHeader
 * @param {} message
 * @return message the rest of the message without the header.
 */
function extractNDTHeader(message) {
    //Get the length of the message from the header

    //must be at least 3 bytes available to process
    if (message.length >= 3) {
        //get messagelength from second and third bytes in the Header
        ndtMessageLength = (message.charCodeAt(1) << 8) | message.charCodeAt(
            2);

        //Remove the header from messageStream, it is exactly 3 chars/bytes
        message = removeFirstNChars(message, MSG_HEADER_LENGTH);

        //if Header is received before the body set the waitingformessage flag
        if (message.length <= 0 && ndtMessageLength > 0) {
            clientState.waitingForMessage = true;
        }
    }
    return message;

}

/**
 * Description returns the remaining message to be parsed as well as the content of the last message block
 * @method extractNDTMessageBody
 * @param {} message
 * @param {} messageLength
 * @return ArrayExpression
 */
function extractNDTMessageBody(message, messageLength) {

    var content = message.substring(0, messageLength);

    if (DEBUG) {
        writeToScreen('<span style="color: blue;">Message Content:' +
            content + '</span>', 'debug');
    }

    var remainingMessage = removeFirstNChars(message, messageLength);
    ndtMessageLength = 0;

    return [remainingMessage, content];
}

/**
 * Description Send messages through the requested websocket when the socket is in a ready state
 * @method send
 * @param {} message
 * @param {} socket
 * @return 
 */
function send(message, socket) {

    // only send if socket is ready
    waitForSocketConnection(socket, function () {
        socket.send(message);
    });
}

/**
 * Description Make the send function wait until the connection is ready...
 * @method waitForSocketConnection
 * @param {} socket
 * @param {} callback
 * @return 
 */
function waitForSocketConnection(socket, callback) {
    setTimeout(function () {
        //TODO: Discard messges if socket is closed. Optimize code, so the client doesn't wait too long!
        //if client has ended tests, discard all undelivered messages
        if (clientState.complete == true) {
            return;
        }
        if (socket.readyState === 1) {
            if (callback != null) {
                callback();
            }
            return;
        } else {
            waitForSocketConnection(socket, callback);
        }

    }, 5);
    // wait 5 milisecond for the connection...
}

/**
 * Description Clean up the objects for reuse.
 * @method cleanUp
 * @return 
 */
function cleanUp() {
    clientState.resetClient();
    clientResults.resetClient();
}