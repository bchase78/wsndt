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

var wsWwTest = false;

$(document).ready(function () {
    //hide Results on before test has been run

    if (!DEBUG) {
        $("#debugtab").addClass('hide');
        $("#debug").addClass('hide');
    }

    $("#resetBtn").prop('disabled', true);

    $('#StartBtn').on('click', function (event) {

        NDTinit();

        // Send testsuite to server
        sendNDTControlMsg(MSG_LOGIN, selectTests());

        //disable startbutton after start.
        $('#StartBtn').prop('disabled', true);
        $("#resetBtn").prop('disabled', false);

    });

    $('#resetBtn').on('click', function (event) {
        window.location.reload();
    });

    // web worker for websocket in webworker feature test
    var wswwWorker = new Worker('./js/wsww_worker.js');

    wswwWorker.addEventListener('message', function (e) {
        var data = e.data;
        switch (data.cmd) {
        case 'wsWwTest':
            wsWwTest = data.msg;
            featureChecks();
            break;
        default:
            // do nothing
        };
    }, false);

    //start web worker function test
    wswwWorker.postMessage({
        'cmd': 'test'
    });

});

/**
 * Description Check if the necessary features are available in the Browser.  If not then display a 
 * warning message, and inform the user which feature is missing.
 * @method featureChecks
 * @return 
 */
function featureChecks() {

    // Browser compatiblity tests
    if (!Modernizr.websockets || !Modernizr.webworkers || !Modernizr.postmessage ||
        !Modernizr.canvas || !wsWwTest) {

        var notSupported =
            '<br><span class="glyphicon glyphicon-ban-circle text-danger" aria-hidden="true"></span><span class="sr-only">Not Supported</span>';
        var supported =
            '<br><span class="glyphicon glyphicon-ok-circle text-success" aria-hidden="true"></span><span class="sr-only">Supported</span>';

        var compattxt =
            '<h2>Unfortunately your Browser is not supported by this application.</h2>';

        compattxt += '<p>';
        compattxt +=
            'Your Browser must support the following HTML5 features:	';

        if (!Modernizr.canvas) {
            compattxt += notSupported;
        } else {
            compattxt += supported;
        }
        compattxt +=
            ' <a href="http://caniuse.com/#search=canvas">Canvas</a>';

        if (!Modernizr.websockets) {
            compattxt += notSupported;
        } else {
            compattxt += supported;
        }
        compattxt +=
            ' <a href="http://caniuse.com/#search=websockets">Websockets</a>';

        if (!Modernizr.webworkers) {
            compattxt += notSupported;
        } else {
            compattxt += supported;
        }
        compattxt +=
            ' <a href="http://caniuse.com/#search=webworkers">Web Workers</a>';

        if (!Modernizr.postmessage) {
            compattxt += notSupported;
        } else {
            compattxt += supported;
        }
        compattxt +=
            ' <a href="http://caniuse.com/#search=postmessage">Postmessage</a>';

        if (!wsWwTest) {
            compattxt += notSupported;
        } else {
            compattxt += supported;
        }
        compattxt +=
            ' <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=504553">Websockets in Web Workers</a> Firefox does not currently support this feature in a stable release.<br>';

        compattxt +=
            '<br><a href="http://caniuse.com/#feat=websockets">List of compatible browsers</a><br>';
        compattxt += '</p>';

        document.getElementById("browserCompat").innerHTML = compattxt;
        $(function () {
            $("#browserCompat").removeClass('hide');
        });
        // Remove Start Button, Progressbar, and dialog tabs/panes
        $(function () {
            $("#startpanel").addClass('hide');
            $("#ndtTab").addClass('hide');
            $("#dialogspanes").addClass('hide');
        });

    }
}

/**
 * Description After the Tests have been run this method should be called. It blends in the visual elements
 * and it calls the method to parse the results. Further the Speed gauges are drawn and the results
 * are displayed.
 * @method showResults
 * @return 
 */
function showResults() {

    $("#resultstab").removeClass('hide');
    $("#results").removeClass('hide');
    $("#web100varstab").removeClass('hide');
    $("#web100varsmessages").removeClass('hide');

    interpretResults();

    $('#ndtTab a[href="#results"]').tab('show');

    document.getElementById("avgrtttext").innerHTML = clientResults.avgrtt;
    setGaugeValue("download", clientResults.clientDerivedDownloadSpd);
    setGaugeValue("upload", clientResults.serverDerivedUploadSpd);

    // Printing property names and values using Array.forEach
    Object.getOwnPropertyNames(clientResults).forEach(function (val, idx,
        array) {
        if (clientResults[val].length > 0 && clientResults[val].indexOf(
                "function") == -1) {
            writeToScreen((val + ': ' + clientResults[val]),
                'web100vars');
        }
    });

}

/**
 * Description Controls the progress bar for the c2s part of the test
 * @method c2sProgress
 * @return 
 */
function c2sProgress() {
    $('#c2sbar').css("width", function () {
        return $(this).attr("aria-valuenow") + "%";
    });
}

/**
 * Description Controls the progress bar for the s2c part of the test
 * @method s2cProgress
 * @return 
 */
function s2cProgress() {
    $('#s2cbar').css("width", function () {
        return $(this).attr("aria-valuenow") + "%";
    });
}

/**
 * Description Controls the progress bar for the meta part of the test
 * @method metaProgress
 * @return 
 */
function metaProgress() {
    $('#metabar').css("width", function () {
        return $(this).attr("aria-valuenow") + "%";
    });
}

/**
 * Description Displays the animated speed gauge and parses the speed to show the speed in the correct units.
 * The input value is kb/s but if it is more than 1024 then in will be converted to MB/s and so on...
 * @method setGaugeValue
 * @param {} gaugeid  the id of the canvas to output the gauge
 * @param {} speedinKB the speed in kilobytes/s
 * @return gauge canvas and the speed with units as text
 */
function setGaugeValue(gaugeid, speedinKB) {
    //Converts speed in kb/s to other sizes
    var s = ['kB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s'];
    var e = Math.floor(Math.log(speedinKB) / Math.log(1024));
    var value = (speedinKB / Math.pow(1024, e)).toFixed(2);

    var opts = {
        lines: 100, // The number of lines to draw
        angle: 0, // The length of each line
        lineWidth: 0.23, // The line thickness
        pointer: {
            length: 0.9, // The radius of the inner circle
            strokeWidth: 0.035, // The rotation offset
            color: '#000000' // Fill color
        },
        limitMax: 'false', // If true, the pointer will not go past the end of the gauge
        percentColors: [
            [0.0, "#f9c802"],
            [0.50, "#a9d70b"],
            [1.0, "#1AB02E"]
        ],
        strokeColor: '#DEDEDE' // to see which ones work best for you
    };
    // canvas element
    var target = document.getElementById(gaugeid);
    // create gauge
    var gauge = new Gauge(target).setOptions(opts);
    // set max gauge value
    gauge.maxValue = 1000;
    // set animation speed (32 is default value)
    gauge.animationSpeed = 10;

    gauge.setTextField(document.getElementById(gaugeid + 'text'));
    // set actual value
    gauge.set(parseFloat(value));

    //output Units
    document.getElementById(gaugeid + 'unit').innerHTML = " " + s[e];

}


/**
 * Description Check the which tests are selected and return them as a Binaryexpression
 * This method could be used to select different tests, however at the moment only the C2S, S2C, and Meta tests are available
 * @method selectTests
 * @return BinaryExpression  the test suite as or operation
 */
function selectTests() {
    var midTest;
    var c2sTest;
    var s2cTest;
    var sfwTest;
    var metaTest;

    // if ($('#C2S').is(':checked')) {
    // c2sTest = TESTTYPE_C2S;
    // clientState.requestedC2STest = true;
    // }
    // if ($('#MID').is(':checked')) {
    // midTest = TESTTYPE_MID;
    // clientState.requestedMIDTest = true;
    // }
    // if ($('#SFW').is(':checked')) {
    // sfwTest = TESTTYPE_SFW;
    // clientState.requestedSFWTest = true;
    // }
    // if ($('#S2C').is(':checked')) {
    // s2cTest = TESTTYPE_S2C;
    // clientState.requestedsS2CTest = true;
    // }
    // if ($('#META').is(':checked')) {
    // metaTest = TESTTYPE_META;
    // clientState.requestedMetaTest = true;
    // }

    //force start of c2s, s2c, and meta tests.  Function could be changed to selectable tests in a later version.
    c2sTest = TESTTYPE_C2S;
    clientState.requestedC2STest = true;
    s2cTest = TESTTYPE_S2C;
    clientState.requestedsS2CTest = true;
    metaTest = TESTTYPE_META;
    clientState.requestedMetaTest = true;

    return midTest | c2sTest | s2cTest | sfwTest | TESTTYPE_STATUS |
        metaTest;
}