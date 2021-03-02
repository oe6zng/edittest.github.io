/***************************************************************************
 *   Copyright (C) 2021, Paul Lutus                                        *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 ***************************************************************************/

// Created on Aug 26, 2015 11:23:50 AM
// Modified for Stereo Generator Aug 08, 2019
// cosmetic changes  Mar 02, 2021
	var Lamplitude = 1.0;
	var Lphase = 0.0;
	var Ramplitude = 1.0;
	var Rphase = 3.14/2;
	
SigGen = function() {
  SigGen.temp = 0;
  SigGen.canvas = SigGen.id("scope");
  if(!SigGen.canvas) {
    alert("Sorry! Your browser doesn't support the features this program requires.\n\nPlease update or replace your browser.");
    return false;
  }
  SigGen.setTooltips("control_slider","Adjust with mouse cursor or use arrow keys");
  SigGen.setTooltips("scope_slider","Adjust with mouse cursor or use arrow keys");
  SigGen.setTooltips("numeric_entry","Enter numeric value or spin mouse wheel for small steps");
  SigGen.canvasCtx = SigGen.canvas.getContext("2d");
  SigGen.canvasCtx.translate(0.5, 0.5);
  SigGen.canvas.onmousemove = SigGen.onMouseMove;
  SigGen.canvas.onmouseleave= SigGen.onMouseLeave;
  SigGen.activate();
}

SigGen.id = function(ss) {
  return document.getElementById(ss);
}

SigGen.setTooltips = function(classname,ss) {
  var group = document.getElementsByClassName(classname);
  for(var x = 0;x < group.length;x++) {
    group[x].title = ss;
  }
}

// a rather complicated way to find out which
// radio selection has been made

SigGen.getRadioSelection = function(ss) {
  var group = document.getElementsByName(ss);
  for(var x = 0;x < group.length;x++) {
    var v = group[x];
    if(v.checked) {
      return v.value;
    }
  }
}

// return an appropriate X scale value
// depending on display type

SigGen.xCoordVal = function() {
  if(SigGen.dispType == "Freq") {
    // units Hertz
    SigGen.unitTag = " Hz";
    return SigGen.timeScale * SigGen.sampleRate / 2.0;
  }
  else {
    // units milliseconds
    SigGen.unitTag = " ms";
    return SigGen.timeScale * 1000.0
    * SigGen.arraySize / (SigGen.sampleRate * 2.0);
  }
}

SigGen.setParams = function() {
  if(!SigGen.active || !SigGen.canvas) {
    return;
  }
  if(SigGen.micGain) {
    var gain = Math.pow(2,(parseFloat(SigGen.id('micGain').value) * 4));
    SigGen.id('micReadout').innerHTML = gain.toFixed(1);
    //SigGen.micGain.gain.value = gain;
    SigGen.micGain.gain.setTargetAtTime( gain,0,0);
  }
  if(SigGen.carrier) {
    SigGen.carrierGaina.gain.setTargetAtTime( parseFloat(SigGen.id('carrierGain').value),0,0);
    SigGen.carrierGaina.gain.setTargetAtTime( parseFloat(SigGen.id('carrierGain').value),0,0);
    SigGen.carrier.frequency.setTargetAtTime(parseFloat(SigGen.id('carrierFreq').value),0,0);
    var gain = ((SigGen.mode == "AM")?1.0:SigGen.carrier.frequency.value);
    SigGen.modGain.gain.setTargetAtTime( parseFloat(SigGen.id('modGain').value) * gain,0,0);
    SigGen.mod.frequency.setTargetAtTime( parseFloat(SigGen.id('modFreq').value),0,0);
  }
  // make the time/frequency scale easier to use
  SigGen.timeScale = Math.pow(SigGen.id('timeScale').value,4);
  SigGen.syncLevel = SigGen.id('syncLevel').value;
  SigGen.noiseGain.gain.setTargetAtTime( parseFloat(SigGen.id('noiseGain_Left').value),0,0);
  Lamplitude = parseFloat(SigGen.id('noiseGain_Left').value),0,0;
 //  Ramplitude = parseFloat(SigGen.id('noiseGain_Right').value),0,0;
   Ramplitude = parseFloat(SigGen.id('noiseGain_Right').value),0,0;
   Rphase = 3.14 + -3.14 *  parseFloat(SigGen.id('noisePhase_Right').value),0,0;
  var ltag = "";
  var rtag = "";
  var x = SigGen.xCoordVal();
  SigGen.id("leftScopeTag").innerHTML = "0.00 " + SigGen.unitTag;
  SigGen.id("rightScopeTag").innerHTML = x.toFixed(2) + SigGen.unitTag;
  //SigGen.initNoiseGen();
   	for (var i = 0; i < bufferSize; i++) {
		// audio is in [-1.0; 1.0] too much for some headphone amplifiers
		output[i] = Lamplitude * Math.sin(Lphase + (i*1000)/(1000*6.282));
	}
	for (var i = 0; i < bufferSize; i++) {
		// audio is in [-1.0; 1.0]
//		output2[i] = noiseGain_Right * Math.sin(Rphase + (i*1000)/(1000*6.282));
		output2[i] = Ramplitude * Math.sin(Rphase + (i*1000)/(1000*6.282));
	}

  return true;
}

SigGen.makeAnalyser = function(dest) {
  // solve parasitic old-connection problem
  if(typeof dest !== 'undefined') {
    dest.disconnect();
  }
  dest = SigGen.audio.createAnalyser();
  dest.fftSize = SigGen.arraySize;
  dest.maxDecibels = 0;
  dest.smoothingTimeConstant = 0;
  return dest;
}

SigGen.startSig = function() {
  SigGen.stopSig();
  if(!SigGen.active || !SigGen.canvas) {
    return;
  }
  if(!SigGen.carrier) {
    if(!SigGen.audio) {
      SigGen.audio = SigGen.loadContext();
      if(!SigGen.audio) {
        return;
      }
    }
    SigGen.arraySize = parseInt(SigGen.getRadioSelection("binsize"));
    SigGen.sampleRate = SigGen.audio.sampleRate;
    SigGen.dispSource = SigGen.getRadioSelection("source");
    SigGen.trigSource = SigGen.getRadioSelection("trig");
    SigGen.scopeWidth = SigGen.canvas.width;
    SigGen.scopeHeight = SigGen.canvas.height;
    SigGen.genAnalyser = SigGen.makeAnalyser(SigGen.genAnalyser);
    SigGen.micAnalyser = SigGen.makeAnalyser(SigGen.micAnalyser);
    SigGen.genArray = new Uint8Array(SigGen.genAnalyser.frequencyBinCount);
    SigGen.micArray = new Uint8Array(SigGen.micAnalyser.frequencyBinCount);
    SigGen.mode = SigGen.getRadioSelection("mode");
    SigGen.cwave = SigGen.getRadioSelection("cwave");
    SigGen.mwave = SigGen.getRadioSelection("mwave");
    SigGen.dispType = SigGen.getRadioSelection("disp");
    SigGen.syncEnabled = SigGen.id('sync').checked;
    SigGen.noise = SigGen.id('noise').checked;
    SigGen.carrier = SigGen.audio.createOscillator();
    //SigGen.carrier.detune.value = 0;
    //Morse.cosine.detune.value = 0;
    SigGen.carrier.frequency.setTargetAtTime(0,0,0);
    SigGen.mod = SigGen.audio.createOscillator();
    //SigGen.mod.detune.value = 0;
    SigGen.mod.frequency.setTargetAtTime(0,0,0);
    SigGen.carrierGaina = SigGen.audio.createGain();
    SigGen.carrierGainb = SigGen.audio.createGain();
    SigGen.micGain = SigGen.audio.createGain();
    SigGen.modGain = SigGen.audio.createGain();
    SigGen.noiseGain = SigGen.audio.createGain();
    SigGen.mod.connect(SigGen.modGain);
    SigGen.carrier.connect(SigGen.carrierGaina);
    SigGen.carrier.type = SigGen.cwave;
    SigGen.mod.type = SigGen.mwave;
    if(SigGen.noise) {
      SigGen.initNoiseGen();
      SigGen.whiteNoise.connect(SigGen.noiseGain);
      SigGen.noiseGain.connect(SigGen.genAnalyser);
      SigGen.noiseGain.connect(SigGen.micAnalyser);
    }
    if(SigGen.mode == "AM") {
      SigGen.carrierGaina.connect(SigGen.carrierGainb);
      SigGen.carrierGainb.gain = 0;
      SigGen.modGain.connect(SigGen.carrierGainb.gain);
      SigGen.carrierGainb.connect(SigGen.genAnalyser);
    }
    else {
      SigGen.modGain.connect(SigGen.carrier.frequency);
      SigGen.carrierGaina.connect(SigGen.genAnalyser);
    }
    SigGen.setParams();
    SigGen.carrier.start();
    SigGen.mod.start();
    if(SigGen.dispSource == "microphone" || SigGen.trigSource == "microphone") {
      // only request access to microphone
      // once per program run, avoid annoying
      // multiple user requests
      if(typeof SigGen.micSetup === 'undefined') {
        navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
        navigator.getUserMedia(
          {
            "audio": {
              "mandatory": {
                "googEchoCancellation": "false",
                "googAutoGainControl": "false",
                "googNoiseSuppression": "false",
                "googHighpassFilter": "false"
              },
              "optional": []
            },
          },
          SigGen.gotMicStream,
          SigGen.micErrorCallback
        );
        SigGen.micSetup = true;
      }
      else {
        SigGen.postMicStream();
      }
    }
    if(typeof SigGen.muteGain === 'undefined') {
      // only once! Avoid problem of old
      // parasitic connects
      SigGen.muteGain = SigGen.audio.createGain();
    }
    if(SigGen.dispSource == "generator") {
      SigGen.genAnalyser.connect(SigGen.muteGain);
    }
    else {
      SigGen.micAnalyser.connect(SigGen.muteGain);
    }
    SigGen.muteGain.connect(SigGen.audio.destination);
    // the muteGain control has a simple role
    SigGen.muteGain.gain.setTargetAtTime( (SigGen.id("mute").checked)?0:1,0,0);
    SigGen.drawScope();
  }
}

SigGen.gotMicStream = function(stream) {
  SigGen.micStream = stream;
  SigGen.postMicStream();
}

SigGen.postMicStream = function() {
  var microphone = SigGen.audio.createMediaStreamSource(SigGen.micStream);
  microphone.connect(SigGen.micGain);
  SigGen.micGain.connect(SigGen.micAnalyser);
  SigGen.setParams();
}

SigGen.micErrorCallback = function(err) {
  //alert(err);
}

// acquire an audio context from HTML5 audio feature

SigGen.loadContext = function() {
  var audioContext =
  new (window.AudioContext ||
  window.webkitAudioContext)();
  if(typeof audioContext !== 'undefined') {
    return audioContext;
    } else {
    alert("Sorry! This browser doesn't support the features this program requires.\n\nPlease update or replace your browser.");
    return null;
  }
}

// generate an array of white noise

SigGen.initNoiseGen = function() {
console.log('init');		
  if(SigGen.whiteNoise) {
    SigGen.whiteNoise.disconnect(SigGen.noiseGain);
    SigGen.whiteNoise = null;
  }
//  var 
  bufferSize = 4 * SigGen.audio.sampleRate;
  if(!SigGen.noiseBuffer) {
    SigGen.noiseBuffer = SigGen.audio.createBuffer(2, bufferSize, SigGen.audio.sampleRate);
   // var
	output = SigGen.noiseBuffer.getChannelData(0);
   // var
	output2 = SigGen.noiseBuffer.getChannelData(1);
 //   for (var i = 0; i < bufferSize; i++) {
 //     output[i] = Math.random() * 2 - 1;
 //   }
//		var channel = 0;
	//var output = myArrayBuffer.getChannelData(channel);
/*
	for (var i = 0; i < bufferSize; i++) {
		// audio is in [-1.0; 1.0] too much for some headphone amplifiers
		output[i] = Lamplitude * Math.sin(Lphase + (i*1000)/(1000*6.282));
	}
	for (var i = 0; i < bufferSize; i++) {
		// audio is in [-1.0; 1.0]
//		output2[i] = noiseGain_Right * Math.sin(Rphase + (i*1000)/(1000*6.282));
		output2[i] = Ramplitude * Math.sin(Rphase + (i*1000)/(1000*6.282));
	}
*/
  }
  SigGen.whiteNoise = SigGen.audio.createBufferSource();
  SigGen.whiteNoise.buffer = SigGen.noiseBuffer;
  SigGen.whiteNoise.loop = true;
  SigGen.whiteNoise.start(0);
}

SigGen.ntrp = function(x,xa,xb,ya,yb) {
  return (x-xa) * (yb-ya) / (xb-xa) + ya;
}

SigGen.scaledValue = function(array,i) {
  return SigGen.ntrp(array[i],-1.0,256.0,-0.5,0.5);
}

SigGen.syncValue = function(array,i) {
  return SigGen.scaledValue(array,i) < SigGen.syncLevel;
}

// draw scope display, then request next
// animation frame from system

SigGen.drawScope = function() {
  SigGen.requested = false;
  var bias = SigGen.scopeHeight/2.0;
  var draw = true;
  if(SigGen.dispSource == 'generator') {
    if(SigGen.dispType == "Time") {
      SigGen.genAnalyser.getByteTimeDomainData(SigGen.genArray);
    }
    else {
      SigGen.genAnalyser.getByteFrequencyData(SigGen.genArray);
    }
  }
  else { // mic input
    if(SigGen.dispType == "Time") {
      SigGen.micAnalyser.getByteTimeDomainData(SigGen.micArray);
    }
    else {
      SigGen.micAnalyser.getByteFrequencyData(SigGen.micArray);
    }
  }
  var sigArray = (SigGen.dispSource == 'generator')?SigGen.genArray:SigGen.micArray;
  var trigArray = (SigGen.trigSource == 'generator')?SigGen.genArray:SigGen.micArray;
  var bufferLen = sigArray.length * SigGen.timeScale;
  
  var sliceWidth = SigGen.scopeWidth / bufferLen;
  var i = 0;
  
  if(SigGen.syncEnabled) {
    if(SigGen.dispType == "Time") {
      // if sync specifies non-generated data, generate it
      if(trigArray != sigArray) {
        if(trigArray == SigGen.micArray) {
          SigGen.micAnalyser.getByteTimeDomainData(SigGen.micArray);
        }
        else {
          SigGen.genAnalyser.getByteTimeDomainData(SigGen.genArray);
        }
      }
      // find sync transition
      var oldSync = SigGen.syncValue(trigArray,i);
      if(oldSync ^ (SigGen.syncLevel > 0)) {
        draw = false;
      }
      for(; i < bufferLen; i++) {
        var newSync = SigGen.syncValue(trigArray,i);
        if(newSync != oldSync) {
          break;
        }
      }
    }
  }
  if(draw) {
    SigGen.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    SigGen.canvasCtx.fillRect(0, 0, SigGen.scopeWidth, SigGen.scopeHeight);
    SigGen.canvasCtx.lineWidth = 1;
    SigGen.drawGrid();
    SigGen.canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
    // this has a hugely beneficial effect on
    // the appearance of lines
    SigGen.canvasCtx.lineWidth = 1.5;
    SigGen.canvasCtx.beginPath();
    // draw from synchronization point forward
    for(var x = 0; x < SigGen.scopeWidth && i < sigArray.length; i++) {
      y = SigGen.scaledValue(sigArray,i);
      var dy = bias - y * bias * 2;
      if(i == 0) {
        SigGen.canvasCtx.moveTo(x, dy);
        } else {
        SigGen.canvasCtx.lineTo(x, dy);
      }
      x += sliceWidth;
    }
    SigGen.canvasCtx.stroke();
	
	
	// draw channel two
    SigGen.canvasCtx.strokeStyle = 'rgb(0, 0, 255)';
    // this has a hugely beneficial effect on
    // the appearance of lines
    SigGen.canvasCtx.lineWidth = 1.0;
    SigGen.canvasCtx.beginPath();
    // draw from synchronization point forward
    for(var x = 0; x < SigGen.scopeWidth && i < sigArray.length; i++) {
      y = SigGen.scaledValue(sigArray,i); // channel 2?
      var dy = bias - y * bias * 2;
      if(i == 0) {
        SigGen.canvasCtx.moveTo(x, dy);
        } else {
        SigGen.canvasCtx.lineTo(x, dy);
      }
      x += sliceWidth;
    }
    SigGen.canvasCtx.stroke();
	
	
	
  }
  // avoid multiple overlapping animation requests
  if(SigGen.active && !SigGen.requested) {
    requestAnimationFrame(SigGen.drawScope);
    SigGen.requested = true;
  }
}

// draw scope grid lines

SigGen.drawGrid = function() {
  var gw = 10;
  SigGen.canvasCtx.strokeStyle = 'rgb(128,128,128)';
  SigGen.canvasCtx.beginPath();
  var px = 0;
  for(var x = 0;x < gw;x++) {
    SigGen.canvasCtx.moveTo(px, 0);
    SigGen.canvasCtx.lineTo(px, SigGen.scopeHeight);
    px += SigGen.scopeWidth/gw;
  }
  py = 0;
  for(var y = 0;y < gw;y++) {
    SigGen.canvasCtx.moveTo(0, py);
    SigGen.canvasCtx.lineTo(SigGen.scopeWidth, py);
    py += SigGen.scopeHeight/gw;
  }
  SigGen.canvasCtx.stroke();
  // draw primary axes
  SigGen.canvasCtx.strokeStyle = 'rgb(192,192,192)';
  SigGen.canvasCtx.beginPath();
  SigGen.canvasCtx.moveTo(SigGen.scopeWidth/2, 0);
  SigGen.canvasCtx.lineTo(SigGen.scopeWidth/2, SigGen.scopeHeight);
  SigGen.canvasCtx.moveTo(0, SigGen.scopeHeight/2);
  SigGen.canvasCtx.lineTo(SigGen.scopeWidth, SigGen.scopeHeight/2);
  SigGen.canvasCtx.stroke();
}

// show an informative tooltip text when the
// mouse cursor hovers over the scope display

SigGen.onMouseMove = function(evt) {
  var target=evt.target || evt.srcElement;
  var xs = target.offsetWidth;
  var ys = target.offsetHeight;
  var x = (evt.offsetX / xs) * SigGen.xCoordVal();
  var y = 1 - evt.offsetY / ys;
  
  var ss = x.toFixed(2) + SigGen.unitTag;
  ss += ", " + y.toFixed(2);
  if(typeof SigGen.titleDiv === 'undefined') {
    SigGen.titleDiv =  document.createElement("div");
    document.body.appendChild(SigGen.titleDiv);
    try {
      SigGen.titleDiv.style.padding = '4px';
      SigGen.titleDiv.style.opacity = .6;
      SigGen.titleDiv.style.position = 'absolute';
      SigGen.titleDiv.style.color = 'white';
      SigGen.titleDiv.style.background = 'black';
    }
    catch(err) {
      SigGen.titleDiv.setAttribute('style','padding:4px');
      SigGen.titleDiv.setAttribute('style','opacity = .6');
      SigGen.titleDiv.setAttribute('style','position:absolute');
      SigGen.titleDiv.setAttribute('style','color:white');
      SigGen.titleDiv.setAttribute('style','background:black');
    }
    
    
  }
  try {
    SigGen.titleDiv.style.visibility = 'visible';
    SigGen.titleDiv.style.left = (evt.pageX+4) + "px";
    SigGen.titleDiv.style.top = (evt.pageY-30) + "px";
  }
  catch(err) {
    SigGen.titleDiv.setAttribute('style','visibility:visible');
    SigGen.titleDiv.setAttribute('style','left:' + (evt.pageX+4) + 'px');
    SigGen.titleDiv.setAttribute('style','top:' + (evt.pageY-30) + 'px');
  }
  SigGen.titleDiv.innerHTML = ss;
}

// hide the "tooltip" text when mouse cursor
// exits the scope display area

SigGen.onMouseLeave = function(event) {
  try {
    SigGen.titleDiv.style.visibility = 'hidden';
  }
  catch(err) {
    SigGen.titleDiv.setAttribute('style','visibility:hidden');
  }
}

SigGen.stopSig = function() {
  if(SigGen.carrier) {
    try {
      SigGen.carrier.stop();
    }
    catch(err) {
      //alert(err);
    }
    SigGen.carrier = null;
    if(SigGen.whiteNoise) {
      SigGen.whiteNoise.disconnect(SigGen.noiseGain);
      SigGen.whiteNoise = null;
    }
  }
}

SigGen.activate = function() {
  if(SigGen.canvas) {
    SigGen.active = SigGen.id('enable').checked;
    SigGen.startSig();
  }
}

window.onload = function() { new SigGen(); }
