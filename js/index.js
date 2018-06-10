var canvas = document.getElementById("transition");
canvas.width = window.innerWidth;
canvas.height  = window.innerHeight;
var w = canvas.width;
var h = canvas.height;
window.onresize = function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    w = canvas.width;
    h = canvas.height;
};
var c = canvas.getContext('2d');

var colors = ['#330011','#112435','#AAA3A0','#000000','#855355','#110011','#312233','#f0f3ff','#ff0040','#d8e7c4'];

/* Audio setup */
var context = null, usingWebAudio = true;

try {
  if (typeof AudioContext !== 'undefined') {
      context = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
      context = new webkitAudioContext();
  } else {
      usingWebAudio = false;
  }
} catch(e) {
    usingWebAudio = false;
}

// context state at this time is `undefined` in iOS8 Safari
if (usingWebAudio && context.state === 'suspended') {
  var resume = function () {
    context.resume();

    setTimeout(function () {
      if (context.state === 'running') {
        document.body.removeEventListener('touchend', resume, false);
      }
    }, 0);
  };

  document.body.addEventListener('touchend', resume, false);
}

var audiodelay = context.createDelay(1);
audiodelay.delayTime.value = 0.25;
var delayfb = context.createGain();
var delaygain = context.createGain();
audiodelay.connect(delaygain);
audiodelay.connect(delayfb);
delayfb.gain.value = 0.5;
delaygain.gain.value = 0.45;
delayfb.connect(audiodelay);
delaygain.connect(context.destination);

var overmax = false;
var sets = [];
var voices = [];
var next = 0;
var voicemax = 10;

var grain = [];
nextgrain = 0;
for(var i = 0; i< 10; i++){
	grain[i] = new DelayGrain(1);
}
window.setInterval(function(){
	grain[nextgrain].play(0.5,0.45);
	nextgrain++;
	if (nextgrain>9) nextgrain = 0;
	},50);
	
for (var x=0;x<256;x++){
  sets[x]= new FMSet();
}
function playsound(e){
    if(!overmax) voices[next] = new FMSynth(sets[e]);
    else voices[next].change(sets[e]);
    next++;
    if(next>=voicemax){
      next = 0;
      overmax = true;
    }
}

function FMSet(){
  this.carrier = Math.random()*1200+100;
  this.mod = this.carrier*Math.random()*3;
  this.harm = Math.random()*6+0.001;
  this.fb = Math.random()*0.7+0.1;
  this.adsr = [Math.random()*0.05+0.003,Math.random()*2+0.01,Math.random()+0.1,Math.random()*1+0.01];
  this.fmadsr = [Math.random()*0.1+0.001,Math.random()*1+0.1,Math.random()+0.25,Math.random()*2];
};

function FMSynth(fmset){
   this.set = fmset;
   this.cwave = context.createOscillator();
   this.mwave = context.createOscillator();
   this.mamp = context.createGain();
   this.amp = context.createGain();
   this.fb = context.createGain();
   this.init = function(set){
     this.cwave.frequency.value = set.carrier;
     this.mwave.frequency.value = set.carrier*set.harm;
     this.fb.gain.value = set.fb;
     this.cwave.connect(this.amp);
     this.mwave.connect(this.mamp);
     this.mamp.connect(this.cwave.frequency);
     this.amp.connect(context.destination);
     this.amp.connect(audiodelay);
     this.cwave.connect(this.fb);
     this.fb.connect(this.mamp);
     this.cwave.start(0);
     this.mwave.start(0);
     doADSR(this.mamp,set.fmadsr,set.mod);
     doADSR(this.amp,set.adsr,0.05);
   };
   this.init(this.set);
   this.change = function(set){
     this.cwave.frequency.value = set.carrier;
     this.mwave.frequency.value = set.carrier*set.harm;
     this.fb.gain.value = set.fb;
     doADSR(this.mamp,set.fmadsr,set.mod);
     doADSR(this.amp,set.adsr,0.05);
   };
};

function DelayGrain(max){
	this.delay = context.createDelay(max);
	this.delay.delayTime.value = 0.1;
	this.amp = context.createGain();
	this.delay.connect(this.amp);
	this.amp.connect(context.destination);
	audiodelay.connect(this.delay);
	this.play = function(del,rng){
		this.delay.delayTime.setValueAtTime(del+Math.random()*2*rng-rng,context.currentTime+0.0001);
		doADSR(this.amp,[0.01,0.1,0.1,0.1],0.9);
	}
}

function doADSR(amp,adsr,level){
    var now = context.currentTime;
    amp.gain.cancelScheduledValues(now);
    amp.gain.setValueAtTime(0,now);
    amp.gain.linearRampToValueAtTime(level,now+adsr[0]);
    amp.gain.linearRampToValueAtTime(level*adsr[2], now+adsr[0]+adsr[1]);
    amp.gain.linearRampToValueAtTime(0, now+adsr[0]+adsr[1]+adsr[3]);
}

//low-end generator
var sq1 = context.createOscillator();
sq1.type = "sawtooth";
sq1.frequency.value = 61;
var filter1 = context.createBiquadFilter();
filter1.type = 0;
filter1.frequency.value = 120.;
filter1.Q.value = 0.5;
sq1.connect(filter1);
sq1.start();

var lfo1 = context.createOscillator();
var lfogain1 = context.createGain();
lfo1.type = "triangle";
lfo1.frequency.value = 5;
lfogain1.gain.value = 50;
lfo1.connect(lfogain1);
lfogain1.connect(filter1.frequency);
lfo1.start();
var wshape = context.createWaveShaper();
wshape.curve = makeDistortionCurve(0.15);
var lowamp = context.createGain();
lowamp.gain.value = 0.1;
filter1.connect(wshape);
wshape.connect(lowamp);
lowamp.connect(context.destination);


window.setInterval(function(){
  var filfre = Math.random()*800+140;
  lfo1.frequency.linearRampToValueAtTime(Math.random()*8, context.currentTime+0.5);
  filter1.frequency.linearRampToValueAtTime(filfre, context.currentTime+0.5);
  lfogain1.gain.linearRampToValueAtTime((Math.random()*0.5+0.3)*filfre, context.currentTime+0.5);
  lowamp.gain.linearRampToValueAtTime(Math.random()*0.25+0.05, context.currentTime+0.5);
},500);

function makeDistortionCurve( amount ) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

//painting code
var blop = new Painter();
var hobo1 = new Traveler();
var hobo2 = new Traveler();
var hobo3 = new Traveler();
var deathmarch = new Traveler();
var tt = 0;
animate();

function animate(){
  tt++;
  if((tt % 80)<1){
    blop.splatter();
    playsound(Math.floor(Math.random()*50+50));
  }
  hobo1.tick();
  hobo2.tick();
  hobo3.tick();
  deathmarch.tick();
  blop.shiftpix(hobo1.x,hobo1.y,hobo1.cartx*-2,hobo1.carty*-2,2);
  blop.shiftpix(hobo2.x,hobo2.y,hobo2.cartx*-2,hobo2.carty*-2,2);
  blop.shiftpix(hobo3.x,hobo3.y,hobo3.cartx*-2,hobo3.carty*-2,2);
  c.clearRect(deathmarch.x+Math.random()*40-20,deathmarch.y+Math.random()*40-20,120,120);
 window.requestAnimationFrame(animate);
}


function Painter(){
    //smears a rect of the existing canvas.
    this.shiftpix = function(x,y,h,v,ticks){
        var b = 0;
        var sx = x;
        var sy = y;
        var dx = Math.floor(h/ticks);
        var dy = Math.floor(v/ticks);
        for(b=0;b<ticks;b++){
            var tx = Math.random()*200+30;
            var vx = Math.random()*200-100;
            var vy = Math.random()*200-100;
            c.drawImage(canvas, sx+dx*b-tx/2+vx,sy+dy*b-tx/2+vy,tx,tx,sx-tx/2+vx,sy-tx/2+vy,tx,tx);
        }
    };
    //draws a random rect from previous image
    this.basepix = function(ticks){
        var b = 0;
        var sx = Math.random()*900;
        var sy = Math.random()*860;
        var dx = Math.floor(Math.random()*200)-100;
        var dy = Math.floor(Math.random()*200)-100;
        var tx = Math.random()*50+10;
        c.drawImage(this.img,sx,sy,tx,tx,sx+dx,sy+dy,tx*2,tx*2);
    };
    this.splatter = function(){
      var startx = Math.random()*w*1.5-w*0.25;
      var starty = Math.random()*h*1.5-h*0.25;
      var endx = Math.random()*w*1.5-w*0.25;
      var endy = Math.random()*h*1.5-h*0.25;
      var gradient = c.createLinearGradient(startx, starty, endx, endy);
      gradient.addColorStop(0, colorPick());
      gradient.addColorStop(0.5,colorPick());
      gradient.addColorStop(1, colorPick());
      c.fillStyle = gradient;
      c.beginPath();
      c.moveTo(startx,starty);
      c.lineTo(endx,endy);
      c.lineTo(Math.random()*1200-150, Math.random()*w*1.5-w*0.25);
      c.lineTo(startx,starty);
      c.fill();
    };
}

function Traveler(){
  this.x = 450;
  this.y = 450;
  this.cartx = 0;
  this.carty = 0;
  this.angle = 0;
  this.turn = 0;
  this.velocity = 10;
  this.acc = 0;
  this.color = colorPick();
  this.len = Math.random()*200+10;
  this.tick = function(){
    this.angle = lerp(this.angle,this.turn,0.005);
    this.velocity = lerp(this.velocity,this.acc,0.005);
    this.cartx = Math.sin(this.angle)*this.velocity;
    this.carty = Math.cos(this.angle)*this.velocity;
    this.x += this.cartx;
    this.y += this.carty;
    this.x %= w;
    this.y %= h;
    if(this.x<0) this.x += w;
    if(this.y<0) this.y += h;
    if((tt%Math.floor(this.len))==0){
      this.turn = Math.random()*7-3.5;
      this.acc = Math.random()*5+0.5;
      this.len = Math.random()*500+30;
      playsound(Math.floor(Math.random()*170));
    }
  }
  this.draw = function(){
    c.beginPath();
    c.arc(this.x, this.y, 5, 0, 2 * Math.PI, false);
    c.fillStyle = colorPick();
    c.fill();
  }
}

function randomcolor(){
    return 'rgb('+
      Math.floor(Math.random()*256)+','+
      Math.floor(Math.random()*256)+','+
      Math.floor(Math.random()*256)+')';
}

function colorPick(){
  var choose = Math.floor(Math.random()* colors.length);
  return colors[choose];
}

function lerp(a, b, f) { return a + f * (b - a); }