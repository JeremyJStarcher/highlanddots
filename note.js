"use strict";

function Note() {  
  this.isPrintable = true;
  this.scaleFactor = 1.0;
  this.stemDir = "down";
  this.grouped = false;         // note is part of group
  this.c = {};                  // Storage area for some commonly used calcuations.
  var self = this;
  return this;
}

Note.inherits(ScoreElement);

Note.prototype.hasStem = function() {
  return this.duration >= 2;
};

Note.prototype.countTails = function() {
  var tailLookup = {1: 0, 2: 0, 4: 0, 8: 1, 16: 2, 32: 3};
  return tailLookup[this.duration];
};


Note.prototype.stemDirection = function() {
  return this.stemDir;
};



Note.prototype.calc = function(staff) {  
  var c = this.c;
  var w;
  var h;

  c.width = staff.details.space * this.scaleFactor;
  c.height = c.width; // what should this be? staff.details.height; 

  w = c.width/2;
  h = c.height/2;

  c.x = staff.details.x;
  c.y = staff.details.noteInfo[this.staffPosition].y;
  c.r = (staff.details.space /2 ) * this.scaleFactor;

  c.endX = c.x + c.width;
  c.endY = c.y;
    
  c.cp1x1 = c.x + w;
  c.cp1y1 = c.y - h;
  c.cp2x1 = c.endX + w;
  c.cp2y1 = c.endY - h;
  
  c.cp1x2 = c.endX - w;
  c.cp1y2 = c.endY + h;
  c.cp2x2 = c.x - w;
  c.cp2y2 = c.y + h;

  // calc stem length and direction
  c.stemlen = staff.details.space * 3.2 * this.scaleFactor;
  if (c.stemlenDelta == undefined) c.stemlenDelta = 0;

  c.barthick = staff.details.barthick * this.scaleFactor;
  if (c.barthick < 1) {c.barthick = 1;}

  if (this.stemDirection() == "up") {
    c.stemx1 = c.x + (c.r*2) + (staff.details.thick/2);
    c.stemx2 = c.stemx1;
    c.stemy1 = c.y;
    c.stemy2 = c.y - c.stemlen;
  } else {
    c.stemx1 = c.x - (c.r/2) + staff.details.thick;
    c.stemx2 = c.stemx1;
    c.stemy1 = c.y;
    c.stemy2 = c.y + c.stemlen;
  }

}


Note.prototype.getBoundingRect = function(staff) {
  var ctx = staff.details.ctx;
  var c = this.c;
  
  this.calc(staff);  
  
  var o = {
    x: c.x,
    y: c.y-(c.height/2),
    width: c.width,
    height: c.height
  };
  
  return o;
}


Note.prototype.paint2 = function(staff) {
  var c = this.c;
  var ctx = staff.details.ctx;
  var self = this;
  
  function paintStem(grp) {
    
    var tails = self.countTails();
    var lw = ctx.lineWidth;
    var i,tailx,taily;
    var yInc, yMult = 1;

    yInc = (c.height/2) + c.barthick;		// amount to increment Y between tails
    if (self.stemDirection() == "down") {
      yMult = -1;				// 
    }

    // FIXME : scale factor on line width?
    ctx.lineWidth = staff.details.thick; 
    ctx.beginPath();
    ctx.moveTo(c.stemx1, c.stemy1);
    ctx.lineTo(c.stemx2, c.stemy2+c.stemlenDelta);
    ctx.stroke();
    ctx.closePath();

    if (tails) {
      if (self.grouped && Note.groupUtils.isLast(self, grp)) {
        tailx = c.stemx1 - c.width;
      } else if (self.grouped) {

        // lookahead to next note
        // IF next note has fewer tails && current tail count > next tail count
        //    THEN tails are 1/2 width
        // ELSE tail is as wide as the gap between notes

        //Note.groupUtils.lookahead(self, grp, "countTails");

        tailx = c.stemx1 + (c.width*2); // twice width to bridge to next note stem
      } else {
        tailx = c.stemx1 + c.width;
      }

      taily = c.stemy2+c.stemlenDelta;

      // FIXME : line width should be 1/2 ... but 1/3 looks better
      ctx.lineWidth = c.height/3;

      for (i = 0; i < tails; i++) {
        ctx.beginPath();
        ctx.moveTo(c.stemx1, taily);

        if (!self.grouped && staff.details.beamStyle == "sloped") {
          if (self.stemDirection() == "up") {
            ctx.lineTo(tailx, taily+c.width);
          } else {
            ctx.lineTo(tailx, taily-c.width);
          }
        } else {
          ctx.lineTo(tailx, taily);
        }

        ctx.stroke();
        ctx.closePath();

        taily += yInc * yMult;
      }

      ctx.lineWidth = lw;
    }
  }
  
  this.calc(staff);  
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.bezierCurveTo(c.cp1x1, c.cp1y1, c.cp2x1, c.cp2y1, c.endX, c.endY);
  ctx.bezierCurveTo(c.cp1x2, c.cp1y2, c.cp2x2, c.cp2y2, c.x, c.y);
  
  // nice thick line for note outlines :)
  var lw = ctx.lineWidth;
  ctx.lineWidth = staff.details.thick * 1.5 * this.scaleFactor;
  ctx.stroke();
  ctx.lineWidth = lw;

  // not filled for whole or half notes
  if (this.duration > 2 ) {
    ctx.fill();
  }
  
  if (this.dotType === "dot") {
    
    var doty = c.y;
    if (staff.details.noteInfo[self.staffPosition].drawnOnLine) {
      doty -= c.r*1.2
    }
    
    ctx.beginPath();
    ctx.arc(c.x+c.r*3, doty, c.r/3, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
    
  }
  
  if (this.hasStem()) {
    var grp = Note.groupUtils.findGroup (this, "beams");
    if (this.grouped) {
      Note.groupUtils.beam(staff, this, grp);
    } else {
      // FIXME :  there's a bug somewhere ..... c appear to be
      //            a class level var - it should be instance level
      // workaround :: reset stemlenDelta
      this.c.stemlenDelta = 0;
    }
    paintStem(grp);
  }

};


/*
 * Note group utility functions. These functions are Object functions, not
 * instance functions. This is the JS equivalent of Java static methods.
 */
Note.groupUtils = {};

/* 
 * collectionType can be "notes" | "melodyNotes" | "graceNotes" | "beams"
 */
Note.groupUtils.findGroup = function(note, collectionType) {
    var i,j,collection, grp;
    collection = score.collections[collectionType];
    for (i = 0; i < collection.length; i++) {
      grp = collection[i];
      for (j = 0; j <grp.length; j++) {
        if (grp[j] == note) {
          return (grp);
        }
      }
    }
    return (null);
  };

/*
 * If grp is null, the note's beam group will be found.
 */
Note.groupUtils.lookahead = function(note, grp, attribName) {
  var i;
  var next, val = null;

  if (grp == null) 
    grp = Note.groupUtils.findGroup(note, "beams");

  for (i = 0; i < grp.length; i++) {
    if (grp[i] == note && i < (grp.length -1) ) {
      next = grp[i+1];
      if (next[attribName]) {
        if (typeof next[attribName] == "function") {
          val = next[attribName]();
        } else  {
          val = next[attribName];
        }
      }
    }
  }
  return val;
}

Note.groupUtils.isLast = function(note, group) {
   return (note == group[group.length-1]);
 };
 
Note.groupUtils.isFirst = function(note, group) {
   return (note == group[0]);
 };

Note.groupUtils.highest = function(group) {
   var highest = group[0];
   var lowest = group[0];
   for (i=0; i<group.length; i++) {
     if (staff.details.findNote[group[i].staffPosition] < staff.details.findNote[highest.staffPosition]) {
       highest = group[i];
     }
   }
   return (highest);
 };

Note.groupUtils.lowest = function(group) {
   var lowest = group[0];
   for (i=0; i<group.length; i++) {
     if (staff.details.findNote[group[i].staffPosition] > staff.details.findNote[lowest.staffPosition]) {
       lowest = group[i];
     }
   }
   return (lowest);
 };

Note.groupUtils.beam = function(staff, note) {
   var i, note, noteGrp;
   var details = staff.details;
   var deltas = [];
   
   noteGrp = Note.groupUtils.findGroup(note, "beams");
   // TODO: error handling?
   
   function straight () {
     // FIXME : this works but really shouldn't be hardcoded!
     var highestY = staff.details.noteInfo[GHPRef.HA].y;
     var lowestY = staff.details.noteInfo[GHPRef.LG].y;

     if (note.stemDirection() == "up") {
       note.c.stemlenDelta = highestY - staff.details.noteInfo[note.staffPosition].y;
     } else {
       note.c.stemlenDelta = lowestY - staff.details.noteInfo[note.staffPosition].y;
     }
     note.c.beamSlope = 0;
   }
   
   function sloped () {
     var i, note, pivot, slope, pivoty, firsty, lasty, xSpan;
     var highest = Note.groupUtils.highest(noteGrp);
     var lowest = Note.groupUtils.lowest(noteGrp);
     var first = noteGrp[0];
     var last = noteGrp[noteGrp.length-1];
     var yMult = 1;
     
     if (note.stemDirection() == "up") {
       pivot = highest;
     } else {
       pivot = lowest;
     }
     
     firsty = staff.details.noteInfo[first.staffPosition].y;
     lasty  = staff.details.noteInfo[last.staffPosition].y;

     if (firstY == lastY) {
       note.c.beamSlope = 0;
       note.c.stemlenDelta = pivoty - (staff.details.noteInfo[note.staffPosition].y);
       
     } else {
       // FIXME : X diffs taken from staff layout spacing in hdot.js:238
       //    this is expected to break when staff spacing is re-engineered
       noteXSpan = staff.details.space * 2.5;
       pivotXSpan = noteXSpan * Note.groupUtils.indexOf(pivot, noteGrp);
       grpXSpan = noteXSpan * noteGrp.length;
       pivoty = staff.details.noteInfo[pivot.staffPosition].y;

       note.c.beamSlope = (firstY - lastY) / grpXSpan;

// TDO : stem up|down multiplier?
       note.c.stemlenDelta = pivoty - (pivotXSpan * m);

     }
     
   }
   
   if (details.beamStyle != undefined && details.beamStyle == "sloped") {
     sloped();
   } else {
     straight(); 
   }
   
 };

