"use strict";

function Score(){
  this.data = [];
}

Score.prototype = {
    appendNode: function(mel) {
      if (mel instanceof Array) {
	var o;
	for (o in mel) {
          this.data.push(mel[o]);
        }	
      } else {
        this.data.push(mel);
      }
    },
    getLastElementByType: function(type) {
      var i = 0, l = this.data.length;
      var mel;
      for (i = 0; i < l; i++) {
        mel = this.data[l-i];
        if (mel && mel.type === type) {
          return mel;
        }
      }
    }
};
var score = new Score();

Score.prototype.buildCollections = function() {
  var c = {}; // Collections
  var i, l = this.data.length;
  var mel, lastType;
  var beamGroup, inBeam, endBeam;
  var tieGroup, inTie, endTie;
  var tripletGroup, inTriplet, endTriplet;
  var voltaGroup, inVolta, endVolta;
  
  c.notes = [];
  c.melodyNotes = [];
  c.graceNotes = [];
  c.beams = [];
  c.ties = [];
  c.triplets = [];
  c.voltas = [];
  
  c.findIn = function(mel, collection) {
    var i,j,grp;
    for (i = 0; i < collection.length; i++) {
      grp = collection[i];
      for (j = 0; j <grp.length; j++) {
        if (grp[j] == mel) {
          return (grp);
        }
      }
    }
    return (null);
  };
  
  function pushGroup(dest, src) {
    var i;
    for (i = 0; i < src.length; i++) {
      dest.push(src[i]);
    }
  }
  
  inBeam = endBeam = false;
  inTie = endTie = false;
  inTriplet = endTriplet = false;
  inVolta = endVolta = false;

  for (i = 0; i < l; i++) {
    mel = this.data[i];
    
    if (mel.type === "phrasegroup") {
      if (mel.collectionName === "ties") {
        if (mel.sectionStart) {
          if (!inTie) {tieGroup = []; tieGroup.push(mel);}
          inTie = true;
        } else if (mel.sectionEnd) {
          tieGroup.push(mel);
          c.ties.push(tieGroup);
          inTie = false;
        }
      } else if (mel.collectionName === "triplets") {
        if (mel.sectionStart) {
          if (!inTriplet) {tripletGroup = []; tripletGroup.push(mel);}
          inTriplet = true;
        } else if (mel.sectionEnd) {
          tripletGroup.push(mel);
          c.triplets.push(tripletGroup);
          inTriplet = false;
        }
      } else if (mel.collectionName === "voltas") {
        if (mel.sectionStart) {
          if (!inVolta) {voltaGroup = []; voltaGroup.push(mel);}
          inVolta = true;
          continue;
        } else if (mel.sectionEnd) {
          voltaGroup.push(mel);
          c.voltas.push(voltaGroup);
          inVolta = false;
        }
      }
      // nothing more to do with this mel, continue to next mel
      continue;
    }

    if (mel.type === "embellishment") {
      c.notes.push(mel);
      c.graceNotes.push(mel);
      if (inTie) tieGroup.push(mel);
      if (inTriplet) tripletGroup.push(mel);
      if (inVolta) voltaGroup.push(mel);
    }
    
    if (mel.type === "melody") {
      c.notes.push(mel);
      c.melodyNotes.push(mel);
      if (inTie) tieGroup.push(mel);
      if (inTriplet) tripletGroup.push(mel);
      if (inVolta) voltaGroup.push(mel);
    }

    if (mel.grouped) {
      beamGroup.push(mel);
    }

    if (mel.type === "beamgroup") {
      if(mel.sectionStart) {
        if (!inBeam) {beamGroup = [];}
        inBeam = true;
        beamGroup.push(mel);
      }
      if(mel.sectionEnd) {
        if (inBeam) {
          beamGroup.push(mel);
          c.beams.push(beamGroup);
          inBeam = false;
        }
      }
    }


    
/*
    // gracenote group immediately followed by melody note group
    // push beamGroup, create empty beamGroup
    // set inBeam to false so the next conditional will cat on this mel
    if (mel.grouped && mel.type != lastType) {
      if (inBeam) {
        c.beams.push(beamGroup);
        inBeam = false;
      }
    }

    // This whole beam code is patterned, of course, after the BWW format.
    // Eventually, I'd love to see the option to fix beaming and group
    // noting based on beat count.
    
    if (mel.grouped) {
      if (!inBeam) {beamGroup = [];}
      inBeam = true;
      beamGroup.push(mel);
    }

    if (mel.type === "beat" && inBeam || !mel.grouped && inBeam) {
      c.beams.push(beamGroup);
      inBeam = false;
    }

    lastType = mel.type;
*/
  }
  this.collections = c;
}