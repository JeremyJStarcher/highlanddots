"use strict";

(function() {
 var THISTYPE = "timesig";
 function ThisType() {
   this.type = THISTYPE;
     this.c = {};                  // Storage area for some commonly used calcuations.
   return this;
 }
 
 ThisType.inherits(ScoreElement);
 
 ThisType.prototype.calc = function(staff) {
   var c = this.c;
   var sdet = staff.details;
   var ctx = sdet.ctx;
   var tf = c.font;
   var dim;
   c.x = sdet.x;
   c.y = sdet.noteInfo.f2.y;

   c.bigNum = Math.max(this.beatsPerBar, this.beatUnit);
   
   c.font = "" + (sdet.space*2.5) + "px sans-serif";
   ctx.font = c.font;
   c.height = sdet.noteInfo.e1.y - sdet.noteInfo.f2.y; 
   c.width = 0;
   if (API.isHostMethod(ctx, 'measureText')) {
     c.width = ctx.measureText("" + c.bigNum).width;
   }
   
   // Alas, not all canvas have a measureText that actually works.
   if (!c.width) {c.width = c.height * 0.5;} 
   ctx.font = tf;

   c.y1 = sdet.noteInfo.b2.y;
   c.y2 = sdet.noteInfo.e1.y;
 }
 
 ThisType.prototype.getBoundingRect = function(staff) {
   this.calc(staff);
   var sdet = staff.details;
   var c = this.c;
   
   var o = {
     x: c.x,
     y: c.y,
     width: c.width,
     height: c.height
   };
   //alert(o.toSource());
   return o;
 }
 
 
 ThisType.prototype.paint = function(staff) {
   // this.calc(staff); Already been calced -- no need to do it again
   var sdet = staff.details;
   var ctx = sdet.ctx;
   var c = this.c;
   
   var tf = ctx.font;
   var ta = ctx.textAlign;
   ctx.font = c.font;
   ctx.textAlign = 'start';

   ctx.fillText(""+this.beatsPerBar, c.x, c.y1, c.width);
   ctx.fillText(""+this.beatUnit, c.x, c.y2, c.width);
   ctx.font = tf;
   ctx.textAlign = ta;   
 }
 
 Score.prototype.createTimeSig = function() {
   return new ThisType();
 };
}
)();

