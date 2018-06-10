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
var glif = document.getElementById("gif");
var colors = ['#330011','#112435','#AAA3A0','#000000','#855355','#110011','#312233','#f0f3ff','#ff0040','#d8e7c4'];

var blop = new Painter();
var hobo1 = new Traveler();
var deathmarch = new Traveler();
var tt = 0;
animate();

function animate(){
  tt++;
  if((tt % 200)<1){
    blop.splatter();
  }
  hobo1.tick();
  deathmarch.tick();
  blop.shiftpix(hobo1.x,hobo1.y,hobo1.cartx*-2,hobo1.carty*-2,2);
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
  this.velocity = 20;
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
      this.acc = Math.random()*20+0.5;
      this.len = Math.random()*500+30;
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