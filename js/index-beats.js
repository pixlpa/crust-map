var canvas = document.getElementById("transition");
var c = canvas.getContext('2d');
var gcanvas = document.getElementById("grid");
var gc = gcanvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height  = window.innerHeight;
gcanvas.width = window.innerWidth;
gcanvas.height  = window.innerHeight;
var w = canvas.width;
var h = canvas.height;
var offcanvas = document.createElement('canvas');
var oc = offcanvas.getContext('2d');
offcanvas.width = w;
offcanvas.height = h;
drawgrid();

window.onresize = function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    w = canvas.width;
    h = canvas.height;
    offcanvas.width = w;
    offcanvas.height = h;
    gcanvas.width = w;
    gcanvas.height = h;
    drawgrid();
};
var c = canvas.getContext('2d');

var colors = ['#dfa4a4','#bb5f5f','#373632','#346395','#d9d2a1','#d1a217','#4e4f6e','#763710'];
var notes = [0,2,4,5,7,9,11,12];
var timings = [0.5,1,2,4];

/* Audio setup */
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
if ('webkitAudioContext' in window){
	context = new webkitAudioContext();
}

window.addEventListener('touchstart', function() {

	// create empty buffer
	var buffer = context.createBuffer(1, 1, 22050);
	var source = context.createBufferSource();
	source.buffer = buffer;

	// connect to output (your speakers)
	source.connect(context.destination);

	// play the file
	source.noteOn(0);

}, false);

var cgain = context.createGain();
var mdelay = context.createDelay(2);
var delayfb = context.createGain();
delayfb.gain.value = 0.35;
mdelay.delayTime.value = 0.720;
cgain.connect(mdelay);
mdelay.connect(context.destination);
mdelay.connect(delayfb);
delayfb.connect(cgain);
cgain.connect(context.destination);


var overmax = false;
var sets = [];
var voices = [];
var next = 0;
var voicemax = 10;

var grain = [];
nextgrain = 0;
for(var i = 0; i< 10; i++){
	grain[i] = new DelayGrain(2);
}
	
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
  this.carrier = mtoF(notes[(Math.floor(Math.random()*6))]+Math.floor(Math.random()*4)*12+43);
  this.mod = this.carrier*Math.random()*0.5+0.75;
  this.harm = Math.random()*(Math.floor(Math.random()*12))/4+0.5;
  this.fb = Math.random()*0.1+0.1;
  this.adsr = [Math.random()*0.1+0.001,Math.random()*0.3+0.1,Math.random()*0.8+0.1,Math.random()*0.8+0.2];
  this.fmadsr = [Math.random()*0.03+0.001,Math.random()*0.05+0.01,0.2,Math.random()*2];
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
     //this.amp.connect(context.destination);
     this.amp.connect(cgain);
     this.cwave.connect(this.fb);
     this.fb.connect(this.mamp);
     this.cwave.start(0);
     this.mwave.start(0);
     doADSR(this.mamp,set.fmadsr,set.mod);
     doADSR(this.amp,set.adsr,Math.random()*0.45);
   };
   this.init(this.set);
   this.change = function(set){
   		var now = context.currentTime;
     this.cwave.frequency.setValueAtTime(set.carrier,now);
     this.mwave.frequency.setValueAtTime(set.carrier*set.harm,now);
     this.fb.gain.setValueAtTime(set.fb,now);
     doADSR(this.mamp,set.fmadsr,set.mod);
     doADSR(this.amp,set.adsr,0.1);
   };
};

function DelayGrain(max){
	this.lfo = context.createOscillator();
	this.lfo.type = 'triangle';
	this.lfo.frequency.value = 110;
	this.lfogain = context.createGain();
	this.lfogain.gain.value = 0.3;
	this.lfo.connect(this.lfogain);
	this.delay = context.createDelay(max);
	this.delay.delayTime.value = 0.1;
	this.lfogain.connect(this.delay.delayTime);
	this.amp = context.createGain();
	this.delay.connect(this.amp);
	this.amp.gain.value = 0;
	this.lfo.start(0);
	this.pan = context.createStereoPanner();
	cgain.connect(this.delay);
	this.amp.connect(this.pan);
	this.pan.connect(context.destination);
	this.amp.connect(cgain);
	this.play = function(del,rng,len){
		var now = context.currentTime;
		this.delay.delayTime.setValueAtTime(del+Math.random()*2*rng-rng,now+0.0001);
		this.lfo.frequency.setValueAtTime(Math.random()*4+0.1,now+0.0001);
		this.lfogain.gain.setValueAtTime(Math.random()*0.1,now+0.0001);
		this.pan.pan.setValueAtTime(Math.random()*2-1,now);
		doADSR(this.amp,[0.01,len,0.1,0.15],0.75);
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

//painting code -----------------------------

var blop = new Painter();
var hobo1 = new Traveler();
var hobo2 = new Traveler();
var hobo3 = new Traveler();
var deathmarch = new Traveler();
var deathmarch2 = new Traveler();
var mud = new Smudge();
var tt = 0;

animate();

function animate(){
  tt++;
  hobo1.tick();
  hobo2.tick();
  hobo3.tick();
  deathmarch.tick();
  deathmarch2.tick();
  mud.tick();
  c.clearRect(deathmarch.x+Math.random()*200-100,deathmarch.y+Math.random()*80-40,Math.random()*300,Math.random()*300);
  c.clearRect(deathmarch2.x+Math.random()*200-100,deathmarch2.y+Math.random()*80-40,Math.random()*300,Math.random()*300);
  //blop.mark(w/2,h/2,300);
  blop.shiftpix(hobo1.x,hobo1.y,hobo1.cartx*-2,hobo1.carty*-2,3);
  window.requestAnimationFrame(animate);
}

//rhythm callbacks

window.setInterval(function(){
	if(Math.random()>0.6) grain[nextgrain].play(1,0.5,0.01);
	nextgrain++;
	if (nextgrain>9) nextgrain = 0;
	if(Math.random()>0.4) grain[nextgrain].play(0.15,0.145,0.1);
	nextgrain++;
	if (nextgrain>9) nextgrain = 0;
	if (Math.random()>0.6) {
		var test = Math.random();
		if(test < 0.85) mud.blast();
		playsound(Math.floor(Math.random()*256));
		blop.clunk();
	}
	},180);
	

function Painter(){
    this.gradient;
    this.shiftpix = function(x,y,h,v,ticks){
        var b = 0;
        var sx = x;
        var sy = y;
        var dx = Math.floor(h/ticks);
        var dy = Math.floor(v/ticks);
        for(b=0;b<ticks;b++){
            var tx = Math.random()*300+100;
            var vx = Math.random()*200-100;
            var vy = Math.random()*200-100;
            c.drawImage(canvas, sx+dx*b-tx/2+vx,sy+dy*b-tx/2+vy,tx,tx,sx-tx/2+vx,sy-tx/2+vy,tx,tx);
        }
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
	this.mark = function(x,y,radius){
	  if((tt % 40)<1){
	  	var startx = Math.random()*w*1.5-w*0.25;
      	var starty = Math.random()*h*1.5-h*0.25;
      	var endx = Math.random()*w*1.5-w*0.25;
      	var endy = Math.random()*h*1.5-h*0.25;
      	this.gradient = c.createLinearGradient(startx, starty, endx, endy);
      	this.gradient.addColorStop(0, colorPick());
      	this.gradient.addColorStop(0.5,colorPick());
      	this.gradient.addColorStop(1, colorPick());
      }
      c.fillStyle = this.gradient;
      c.beginPath();
      c.moveTo(startx,starty);
      c.arc(x,y,radius,0,2*Math.PI);
      c.fill();
    };
    this.clunk = function(){
    	c.drawImage(canvas, Math.random()*400-200, Math.random()*400-200, w-Math.random()*100+50, h-Math.random()*100+50);
    }
}

function Smudge(){
    //smears a rect of the existing canvas.
    this.gradient;
    this.tt = 0;
    this.shiftpix = function(x,y,h,v,ticks){
        var b = 0;
        var sx = x;
        var sy = y;
        var dx = Math.floor(h/ticks);
        var dy = Math.floor(v/ticks);
        for(b=0;b<ticks;b++){
            var tx = Math.random()*400+500;
            var vx = Math.random()*200-100;
            var vy = Math.random()*200-100;
            oc.drawImage(offcanvas, sx+dx*b-tx/2+vx,sy+dy*b-tx/2+vy,tx,tx,sx-tx/2+vx,sy-tx/2+vy,tx,tx);
        }
    };
    this.splatter = function(){
      var startx = Math.random()*w*1.5-w*0.25;
      var starty = Math.random()*h*1.5-h*0.25;
      var endx = Math.random()*w*1.5-w*0.25;
      var endy = Math.random()*h*1.5-h*0.25;
      this.gradient = oc.createLinearGradient(startx, starty, endx, endy);
      this.gradient.addColorStop(0, colorPick());
      this.gradient.addColorStop(0.5,colorPick());
      this.gradient.addColorStop(1, colorPick());
    };
    this.tick = function(){
    	this.place.tick();
    	this.place2.tick();
    	oc.fillStyle= this.gradient;
    	oc.fillRect(this.place.x+Math.random()*10,this.place.y+Math.random()*10,Math.random()*100+20,Math.random()*100+20);
    	this.shiftpix(this.place2.x,this.place2.y,this.place.cartx*-2,this.place.carty*-2,3);
    }
    this.blast = function(){
    	    c.drawImage(offcanvas,0,0,w,h);
    		oc.clearRect(0,0,w,h);
    		this.splatter();
    };
    this.place = new Traveler();
    this.place2 = new Traveler();
    this.place2.change();
    c.clearRect(0,0,w,h);
    this.splatter();
    c.fillStyle= this.gradient;
    
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
  this.len = Math.random()*200+40;
  this.change = function(){
      this.turn = Math.random()*12-6;
      this.acc = Math.random()*10+2;
      this.len = Math.random()*150+55;
  }
  this.tick = function(){
    this.angle = lerp(this.angle,this.turn,0.005);
    this.velocity = lerp(this.velocity,this.acc,0.01);
    this.cartx = Math.sin(this.angle)*this.velocity;
    this.carty = Math.cos(this.angle)*this.velocity;
    this.x += this.cartx;
    this.y += this.carty;
    this.x %= w;
    this.y %= h;
    if(this.x<0) this.x += w;
    if(this.y<0) this.y += h;
    if((tt%Math.floor(this.len))==0){
      this.change();
    }
  }
  this.draw = function(){
    c.beginPath();
    c.arc(this.x, this.y, 5, 0, 2 * Math.PI, false);
    c.fillStyle = colorPick();
    c.fill();
  }
}

function drawgrid(){
	gc.strokeStyle = '#469';
	var gsize = w/10;
	for(i = 0; i<15; i++){
		gc.beginPath();
		gc.moveTo(0,i*gsize);
		gc.lineTo(w,i*gsize);
		gc.stroke();
		gc.beginPath();
		gc.moveTo(i*gsize,0);
		gc.lineTo(i*gsize,h);
		gc.stroke();
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

function mtoF (note) {
    return Math.pow(2, ((note - 69) / 12)) * 440;
}