"use strict";

/* Since BWW and ABC will have certain aspects of being imported in common,
handle them here rather than maintaining two separate versions in the
import sections
*/

function postImport(score) {
  function gatherKeySig() {
    // This routine is used to figure out the time sig after a BWW import.
    // Any sharps or flats that appear directly after the clef determines
    // the key sig.
    var ii;
    var mel;
    
    var note;
    var modes = {
      sharp: "#",
      flat: "b",
      natural: "-"
    };
    
    var data = {};
    
    var keyMel;
    
    for (ii = i+1; i < l; ii++) {
      mel = score.data[ii];
      note = undefined;
      
      if (mel.type === "beat") {continue;}  // Skip any stray beat marks
      if (mel.type === "keysig") {
      keyMel = mel;
      continue;
      }
      
      if (modes[mel.name]) {
        if (typeof data.type === "undefined") {
          data.keyType = mel.name;
          data.count = 0;
          data.key = defaultKeySig;
        } else {
          if (data.keyType !== mel.name) {
            alert("A key signature can contain sharps or flats but not both.");
          }
        }
        
        data.count++;
        note = mel.staffNote.split('')[0];
        logit("note = " + note);
        data.key[note] = modes[mel.name];
        continue;
      }
      
      if (keyMel) {
        keyMel.data = data;
      }
      // Nothing left to catch
      logit(data);
      break;
    }
     

    
  }
  
  
  var i, l, mel;
  var beatUnit;
  var beatsPerBar;
  
  var volta = undefined;
  var tupletMelodyMels = undefined; // Save off the tuplets and recalculate them at the end.
  var tupletLength = 0;
  var measureLength = 0;
  var lineLength = 0;
  var measureCount = 1; // People like 1-based, not zero based.
  var lastNewBar; 
  var maxMeasuresInLine
  var lineMeasureNumber = 0;
  var staffLine = 1;
  
  var defaultKeySig = {};
  
    
  
  for (i = 0, l = score.data.length; i < l; i++) {
    mel = score.data[i];
    if (!mel.type) {continue;}

    if (mel.name === "treble-clef") {
      gatherKeySig();
    }

    
    
    if (mel.type === "timesig") {
      beatUnit = mel.beatUnit; 
      beatsPerBar = mel.beatsPerBar;
    }
    
    if (mel.type === "phrasegroup" && mel.collectionName === "voltas") {
      if (mel.sectionStart) { volta = mel; }
      if (mel.sectionEnd) { volta = undefined; }
    }
    
    if (mel.type === "phrasegroup" && mel.collectionName === "triplets") {
      if (mel.sectionStart) {
        tupletMelodyMels = [];
        tupletLength = 0;
      }
      if (mel.sectionEnd) {
        // FIXME: This needs to calculate the /adjusted/ length of tuplets.
        tupletMelodyMels = undefined;
        
      }
    }
    
    if (mel.type === "staffControl") {
      if (mel.newBar) {
        if (measureLength && lastNewBar) { 
          lastNewBar.measureNumber = measureCount;
          lastNewBar.str = [staffLine, lineMeasureNumber].join(":"); 
          lastNewBar.beatsPerBar = beatsPerBar;
          lastNewBar.measureLength = measureLength;
          if (measureLength !== beatsPerBar) {
            if (lineMeasureNumber === 0) {
              lastNewBar.isLeadIn = true;
            } else {
              lastNewBar.isLeadOut = true;
            }
          }
          lineMeasureNumber++;
          measureCount++;
        }
        //mel.measureNumber = measureLength // DEBUG;
        mel.measureLength = measureLength;
        measureLength = 0;
        lastNewBar = mel;
      }
      
      if (mel.staffEnd) {
        maxMeasuresInLine = Math.max(maxMeasuresInLine, lineMeasureNumber);
        staffLine++;
        mel.lineLength = lineLength;
        lineMeasureNumber = 0;
        lineLength = 0;
      }
    }
    
    if (mel.type === "melody") {
      mel.beatFraction = beatUnit/mel.duration; 
      
      //TODO: Handle hold-cut note lengths properly.
      
      if (mel.dotType === "dot") { mel.beatFraction *= 1.5; }
      if (mel.dotType === "doubledot") { mel.beatFraction *= 1.75; }
      measureLength += mel.beatFraction;
      lineLength += mel.beatFraction;
      
      if (tupletMelodyMels) { tupletLength += mel.beatFraction; }
      if (volta) { mel.repeatOnPasses = volta.repeatOnPasses;}
    }
    
  }
}