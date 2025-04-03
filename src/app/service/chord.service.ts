import {Injectable} from '@angular/core';

import { NoteId } from '../class/note-id.class';
import { Mode } from '../enum/mode.enum';
import { Scale } from '../class/scale.class';
import { Accidental } from '../enum/accidental.enum';
import { ChordQuality } from '../enum/chord-quality.enum';
import { ChordAlteration } from '../enum/chord-alteration.enum';

const MAJOR_CHORD_QUALITIES = Object.freeze([ChordQuality.Major, ChordQuality.Minor, ChordQuality.Minor, ChordQuality.Major, ChordQuality.Major, ChordQuality.Minor, ChordQuality.Diminished]);
const MAJOR_SEVENTH_CHORD_QUALITIES = Object.freeze(["M⁷", "m⁷", "m⁷", "M⁷", "⁷", "m⁷", "ø⁷"]);
const ROMAN_NUMERALS = Object.freeze(["i", "ii", "iii", "iv", "v", "vi", "vii"]);
const DIATONIC_INTERVALS = Object.freeze([2, 2, 1, 2, 2, 2, 1]);
const NATURAL_NOTES = Object.freeze(["C", "D", "E", "F", "G", "A", "B"]);
const ORDER_OF_SHARPS = Object.freeze(["F", "C", "G", "D", "A", "E", "B"]);
const ORDER_OF_SHARPS_SHARPED = Object.freeze(["F#", "C#", "G#", "D#", "A#", "E#", "B#"]);
const ORDER_OF_FLATS = Object.freeze(["B", "E", "A", "D", "G", "C", "F"]);
const ORDER_OF_FLATS_FLATTED = Object.freeze(["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"]);

const MAJOR_PERFECT_INTERVALS = Object.freeze(new Map <number, number>([[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 11]]))

@Injectable({
    providedIn: 'root',
})
export class ChordService {

    //#region Scales

    getScaleNotes(scale: Scale): number[]{
        let scaleCopy: Scale = new Scale(new NoteId(scale.tonic.getValue()), scale.mode, scale.accidental);
        let notes: number[] = [];

        let tonic = scaleCopy.tonic;
        const diatonicIntervals = DIATONIC_INTERVALS;

        const offset = this.getModeOffset(scaleCopy.mode, "diatonic");

        let adjustedIntervals: number[] = []

        for (let i = 0; i < diatonicIntervals.length; i++) {
            const offsetIndex = (i + offset) % diatonicIntervals.length
            const element = diatonicIntervals[offsetIndex];
            adjustedIntervals.push(element)
        }

        notes.push(tonic.getValue());
        adjustedIntervals.forEach(interval => {
            tonic.increaseValue(interval);
            notes.push(tonic.getValue());
        });
        notes.pop();
        return notes;
    }

    getScaleNotesNames(scale: Scale): string[]{
        let scaleCopy: Scale = new Scale(new NoteId(scale.tonic.getValue()), scale.mode, scale.accidental);
        const offset = this.getModeOffset(scaleCopy.mode, "half step");
        scaleCopy.tonic.decreaseValue(offset);
        scaleCopy.mode = Mode.Ionian;
        
        return this.getMajorNotesNames(scaleCopy, scale);
    }

    getNoteValueNameMap(scale: Scale) : Map<number, string>{
        const values = this.getScaleNotes(scale);
        const names = this.getScaleNotesNames(scale);

        const map = new Map();
        for (let i = 0; i < values.length; i++) {
            map.set(values[i], names[i]);
        }
        return map;
    }

    //#endregion 

    //#region Chords

    getDiatonicChord(scale: Scale, scaleDegree: number, extension: number = 3): number[]{
        if(extension > 7){
            throw new Error("Extension too high");
        }
        const scaleNotes = this.getScaleNotes(scale);
        let chord: number[] = [];

        let index = scaleDegree - 1;
        for (let noteNumber = 0; noteNumber < extension; noteNumber++) {
            const chordNote = scaleNotes[index];
            chord.push(chordNote);
            index = (index + 2) % scaleNotes.length
        }
        return chord;
    }

    // The first element of "qualities" refers to the quality of the basic triad, and
    // the following elements refer to the qualities of the intervals between the root
    // and the added notes from the extension, if it's greater than 3.
    // Sus chords will ignore the first quality.
    getChord(root: number, qualities: ChordQuality[], extension: number = 3, alteration: ChordAlteration | undefined = undefined): number[]{
        if (qualities.length != extension - 2) return [];
        if(extension > 7){
            throw new Error("Extension too high");
        }
        let chord: number[] = [];
        const noteIterator: NoteId = new NoteId(root);

        chord.push(noteIterator.getValue());

        // The odd index number refers to the number of the note added (2 -> Second note)
        for (let i = 2; i < extension + 1; i++) { 
            noteIterator.value = root;
            if(i < 4){
                if(i == 2){
                    if(alteration == ChordAlteration.Sus2){
                        noteIterator.increaseValue(2);
                    }else if(alteration == ChordAlteration.Sus4){
                        noteIterator.increaseValue(5);
                    }else{
                        switch (qualities[0]) {
                            case ChordQuality.Major:
                            case ChordQuality.Augmented:
                                noteIterator.increaseValue(4);
                                break;
                            case ChordQuality.Minor:
                            case ChordQuality.Diminished:
                                noteIterator.increaseValue(3);
                                break;
                        }
                    }
                }else{
                    switch (qualities[0]) {
                        case ChordQuality.Major:
                        case ChordQuality.Minor:
                            noteIterator.increaseValue(7);
                            break;
                        case ChordQuality.Augmented:
                            noteIterator.increaseValue(8);
                            break;
                        case ChordQuality.Diminished:
                            noteIterator.increaseValue(6);
                            break;
                    }
                }
            }else{
                let scaleDegree = 5 + 2 * (i - 3);
                scaleDegree = (( scaleDegree - 1) % 7) + 1

                const quality = qualities[i - 3];
                const referenceInterval = MAJOR_PERFECT_INTERVALS.get(scaleDegree) ?? 1

                if([2, 3, 6, 7].includes(scaleDegree)){
                    noteIterator.increaseValue(this.getHalfStepCountMajorMinor(referenceInterval, quality));
                }else{
                    noteIterator.increaseValue(this.getHalfStepCountPerfect(referenceInterval, quality));
                }
            }
            chord.push(noteIterator.getValue());
        }
        return chord;
    }


    getRomanNumeralChords(mode: Mode){
        const majorQualities: ChordQuality[] = [...MAJOR_CHORD_QUALITIES];
        const offset = this.getModeOffset(mode, "diatonic")

        let adjustedQualities: ChordQuality[] = []

        for (let i = 0; i < majorQualities.length; i++) {
            const offsetIndex = (i + offset) % majorQualities.length
            const element = majorQualities[offsetIndex];
            adjustedQualities.push(element)
        }
        let romanNumerals: string[] = [];
        adjustedQualities.forEach((quality, index) => {
            let chord = ROMAN_NUMERALS[index];
            switch (quality) {
                case ChordQuality.Major:
                    chord = chord.toUpperCase();
                    break;
                case ChordQuality.Diminished:
                    chord = chord + "°";
                    break;
            }
            romanNumerals.push(chord)
        });
        return romanNumerals;
    }

    getChordNoteNames(notes: number[]){
        const naturalNotes = NATURAL_NOTES;
        const noteIterator = new NoteId(notes[0]);
        const sharpName = noteIterator.getName("sharp");
        const flatName = noteIterator.getName("flat");
        let rootNaturalIndex = naturalNotes.findIndex(n => n == sharpName.charAt(0));
        let noteNames: string[] = [];

        const trySharpAndFlat = sharpName != flatName;
        let foundRightChordNotes = false
        for (let index = 0; index < 2; index++) {
            if(index == 1 && !trySharpAndFlat) break;
            if(foundRightChordNotes) break;
            let doFlatSecondTry = false;
            let useFlat = false;
            if(index == 1){
                useFlat = true
                rootNaturalIndex = naturalNotes.findIndex(n => n == flatName.charAt(0));
            }
            
            for (let index = 0; index < 2; index++) {
                if(index == 1 && !doFlatSecondTry){
                    foundRightChordNotes = true;
                    break;
                };
                noteNames = [];
                for (let index = 0; index < notes.length; index++){
                    const note = notes[index]

                    let appropriateLetterIndex = (rootNaturalIndex + (2 * index)) % naturalNotes.length;
                    if(index == 1){
                        let susCounter = new NoteId(notes[0]);
                        let distanceFromRoot = 1;
                        for (distanceFromRoot; distanceFromRoot <= 5; distanceFromRoot++) {
                            susCounter.increaseValue(1);
                            if(susCounter.getValue() == note){
                                break;
                            }
                        }
                        if(distanceFromRoot == 2){ // sus2
                            appropriateLetterIndex = ((appropriateLetterIndex - 1) % naturalNotes.length + naturalNotes.length) % naturalNotes.length;
                        }else if(distanceFromRoot == 5){ // sus4
                            appropriateLetterIndex = ((appropriateLetterIndex + 1) % naturalNotes.length + naturalNotes.length) % naturalNotes.length
                        }
                    }
                    let isAugmentedFifth = false;
                    let isDiminishedFifth = false;
                    if(index == 2){
                        let augCounter = new NoteId(notes[0]);
                        let distanceFromRoot = 1;
                        for (distanceFromRoot; distanceFromRoot <= 8; distanceFromRoot++) {
                            augCounter.increaseValue(1);
                            if(augCounter.getValue() == note){
                                break;
                            }
                        }
                        isAugmentedFifth = distanceFromRoot == 8;
                        isDiminishedFifth = distanceFromRoot == 6;
                    }
                    const appropriateLetter = naturalNotes[appropriateLetterIndex];
                    let appropriateLetterId = 0;
                    for (const [id, name] of NoteId.sharpNameMap.entries()) {
                        if (name == appropriateLetter){
                            appropriateLetterId = id;
                            break;
                        } 
                    }
                    let differenceCounter = new NoteId(appropriateLetterId);
                    let accidentalAmount = 0;
                    let found = false;
                    for (let index = 0; index < 3; index++) {
                        // 0 = n, 1 = #, 2 = ##
                        if(differenceCounter.getValue() == note){
                            accidentalAmount = index;
                            found = true;
                            break;
                        }
                        if(useFlat) differenceCounter.decreaseValue(1); 
                        else differenceCounter.increaseValue(1);
                        
                    }
                    let oppositeAccidental = false;
                    if(!found && (index > 2 || isAugmentedFifth)){
                        oppositeAccidental = true;
                        differenceCounter = new NoteId(appropriateLetterId);
                        for (let index = 0; index < 3; index++) {
                            if(differenceCounter.getValue() == note){
                                accidentalAmount = index;
                                found = true;
                                break;
                            }
                            if(!useFlat) differenceCounter.decreaseValue(1); 
                            else differenceCounter.increaseValue(1);
                            
                        }
                    }
                    if(found){
                        let noteName = appropriateLetter;
                        for (let index = 0; index < accidentalAmount; index++) {
                            noteName = noteName + (useFlat ? (!oppositeAccidental ? "b" : "#") : (!oppositeAccidental ? "#" : "b"));
                        }
                        if(["Cb", "B#", "Fb", "E#"].includes(noteName) && index <= 2 && !isAugmentedFifth && !isDiminishedFifth){ 
                            if(!useFlat) doFlatSecondTry = true;
                            useFlat = true;
                            break;
                        }
                        noteNames.push(noteName);
                        if(accidentalAmount > 1 && index <= 2 && !isAugmentedFifth){
                            if(!useFlat) doFlatSecondTry = true;
                            useFlat = true;
                            break;
                        }
                    }else{
                        if(!useFlat) doFlatSecondTry = true;
                        useFlat = true;
                        break;
                    }
        
                };
            }
        }

        return noteNames;
    }

    getScaleChordName(root: string, scale: Scale, scaleDegree: number, extension: number){
        const offset = this.getModeOffset(scale.mode, "diatonic");
        let quality = "";
        if(extension == 3){
            const majorQualities: ChordQuality[] = [...MAJOR_CHORD_QUALITIES];
    
            let adjustedQualities: ChordQuality[] = [];
    
            for (let i = 0; i < majorQualities.length; i++) {
                const offsetIndex = (i + offset) % majorQualities.length;
                const element = majorQualities[offsetIndex];
                adjustedQualities.push(element);
            }

            switch (adjustedQualities[scaleDegree - 1]) {
                case ChordQuality.Major:
                    quality = "M";
                    break;
                case ChordQuality.Minor:
                    quality = "m";
                    break;
                case ChordQuality.Diminished:
                    quality = "°";
                    break;
            }
        }else if(extension == 4){
            const majorSeventhQualities: string[] = [...MAJOR_SEVENTH_CHORD_QUALITIES];
    
            let adjustedQualities: string[] = []
    
            for (let i = 0; i < majorSeventhQualities.length; i++) {
                const offsetIndex = (i + offset) % majorSeventhQualities.length;
                const element = majorSeventhQualities[offsetIndex];
                adjustedQualities.push(element);
            }
            quality = adjustedQualities[scaleDegree - 1];
        }else{
            return "";
        }
        return root + quality;
    }

    getPlayableNotes(notes: number[], scale: Scale, type: "diatonic" | "advanced", octave: number, bassNote: boolean, repeatRoot: boolean ){
        const scaleTonic = scale.tonic.getValue()

        let currentOctave: number;
        if(type == "diatonic"){
            currentOctave = notes[0] >= scaleTonic ? octave : octave + 1;
        }else{
            currentOctave = octave;
        }
        
        let noteNames: string[] = [];

        notes.forEach((note, index) => {
            if(index != 0 && note < notes[index - 1]) currentOctave ++;
            const noteId = new NoteId(note);
            const noteName = noteId.getDefaultNoteName() ?? "C";
            if(bassNote && index == 0){
                const bassFullNoteName = noteName + (currentOctave - 1).toString();
                noteNames.push(bassFullNoteName);
            }
            const fullNoteName = noteName + currentOctave.toString();
            noteNames.push(fullNoteName);
        });

        if(repeatRoot){
            if(notes[0] < notes[notes.length - 1]) currentOctave ++;
            const noteId = new NoteId(notes[0]);
            const noteName = noteId.getDefaultNoteName() ?? "C";
            const fullNoteName = noteName + currentOctave.toString();
            noteNames.push(fullNoteName);
        }

        return noteNames;
    }

    getDiatonicInversion(notes: number[], scale: Scale, octave: number,){
        const playableNotes = this.getPlayableNotes(notes, scale, "diatonic", octave, false, false);
        const tonic = scale.tonic;
        const invertedChordNotes: string[] = [];
        let invertionCount = 0;
        playableNotes.forEach((note, index) => {
            let invertedNote = note;
            if(index != 0){
                const noteOctave: number = Number(note.slice(-1));
                const id = notes[index];
                if(noteOctave > octave && id >= tonic.value){
                    const noteWithoutOctave = note.substring(0, note.length - 1);
                    invertedNote = noteWithoutOctave + (noteOctave - 1).toString();
                    invertionCount = invertionCount + 1;
                }
            }
            invertedChordNotes.push(invertedNote);
        });
        const copy = [...invertedChordNotes];
        invertedChordNotes.sort((a, b) =>{
            const octaveA = Number(a.slice(-1));
            const octaveB = Number(b.slice(-1));
            if(octaveA != octaveB){
                return octaveA - octaveB;
            }
            const idA = notes[copy.indexOf(a)];
            const idB = notes[copy.indexOf(b)];

            return idA - idB;
           
        })

        return invertedChordNotes;
    }

    //#endregion

    //#region Private Methods

    private getHalfStepCountMajorMinor(majorInterval: number, quality: ChordQuality){
        switch (quality) {
            case ChordQuality.Major:
            default:
                return majorInterval;
            case ChordQuality.Minor:
                return majorInterval - 1;
            case ChordQuality.Augmented:
                return majorInterval + 1;
            case ChordQuality.Diminished:
                return majorInterval - 2;
        }
    }

    private getHalfStepCountPerfect(perfectInterval: number, quality: ChordQuality){
        switch (quality) {
            case ChordQuality.Perfect:
            default:
                return perfectInterval;
            case ChordQuality.Augmented:
                return perfectInterval + 1;
            case ChordQuality.Diminished:
                return perfectInterval - 1;
        }
    }

    private getModeOffset(mode: Mode, type:  "half step" | "diatonic"){
        switch (mode) {
            case Mode.Ionian:
                return type == "diatonic" ? 0 : 0;
            case Mode.Dorian:
                return type == "diatonic" ? 1 : 2;
            case Mode.Phrygian:
                return type == "diatonic" ? 2 : 4;
            case Mode.Lydian:
                return type == "diatonic" ? 3 : 5;
            case Mode.Mixolydian:
                return type == "diatonic" ? 4 : 7;
            case Mode.Aeolian:
                return type == "diatonic" ? 5 : 9;
            case Mode.Locrian:
                return type == "diatonic" ? 6 : 11;
        }
    }

    // Receives an ionian mode scale.
    private getMajorNotesNames(scale: Scale, original: Scale): string[]{
        let notes = NATURAL_NOTES;
        let tonicIndex: number = 0;
        if(scale.tonic.getValue() == 1){
            tonicIndex = notes.indexOf(original.tonic.getName("sharp"));
        }else if(scale.accidental == Accidental.Natural){
            const tonicName = original.tonic.getName("sharp")
            notes = this.findBestKeySig(scale.tonic, tonicName);
            tonicIndex = notes.indexOf(original.tonic.getName("sharp"));
        }else if(scale.accidental == Accidental.Sharp){
            notes = this.circleOfFifths(scale.tonic);
            tonicIndex = notes.indexOf(original.tonic.getName("sharp"));
        }else if(scale.accidental == Accidental.Flat){
            notes = this.circleOfFourths(scale.tonic);
            tonicIndex = notes.indexOf(original.tonic.getName("flat"));
        }

        let orderedNotes: string[] = []
        for (let i = 0; i < notes.length; i++) {
            const offsetIndex = (i + tonicIndex) % notes.length
            const element = notes[offsetIndex];
            orderedNotes.push(element)
        }

        return orderedNotes;
    }

    private circleOfFifths(tonic: NoteId): string[]{
        let currentNote: NoteId = new NoteId(1);
        let notes = [...NATURAL_NOTES];
        let sharps = [...ORDER_OF_SHARPS];
        let reachedTonic = false;
        while(!reachedTonic){
            reachedTonic = sharps.some(sharp => {
                currentNote.increaseValue(7);
                const index = notes.indexOf(sharp);
                sharp = sharp + "#";
                notes.splice(index, 1, sharp);
                if(currentNote.getValue() == tonic.getValue()){
                    return true;
                }
                return false;
            });
            if(!reachedTonic){
                sharps = [...ORDER_OF_SHARPS_SHARPED];
            }
        }
        return notes;
    }

    private circleOfFourths(tonic: NoteId){
        let currentNote: NoteId = new NoteId(1);
        let notes = [...NATURAL_NOTES];
        let flats = [...ORDER_OF_FLATS];
        let reachedTonic = false;
        while(!reachedTonic){
            reachedTonic = flats.some(flat => {
                currentNote.increaseValue(5);
                const index = notes.indexOf(flat);
                flat = flat + "b";
                notes.splice(index, 1, flat);
                if(currentNote.getValue() == tonic.getValue()){
                    return true;
                }
                return false;
            });
            if(!reachedTonic){
                flats = [...ORDER_OF_FLATS_FLATTED];
            }
        }
        return notes;
    }

    private findBestKeySig(tonic: NoteId, originalTonic: string){
        let currentNoteFifth: NoteId = new NoteId(1);
        let currentNoteFourth: NoteId = new NoteId(1);
        let notes: string[] = []
        let notesFifth = [...NATURAL_NOTES];
        let notesFourth = [...NATURAL_NOTES];
        let sharps = [...ORDER_OF_SHARPS];
        let flats = [...ORDER_OF_FLATS];
        let reachedTonic = false;
        while(!reachedTonic){
            reachedTonic = sharps.some(sharp => {
                if((() =>{
                    currentNoteFifth.increaseValue(7);
                    const index = notesFifth.indexOf(sharp);
                    const altSharp = sharp + "#";
                    notesFifth.splice(index, 1, altSharp);
                    if(currentNoteFifth.getValue() == tonic.getValue() && notesFifth.includes(originalTonic)){
                        return true;
                    }
                    return false;
                })()){
                    // Found the tonic in circle of fifths
                    notes = notesFifth;
                    return true;
                }else if((() =>{
                    let flat = flats[sharps.indexOf(sharp)];
                    currentNoteFourth.increaseValue(5);
                    const index = notesFourth.indexOf(flat);
                    flat = flat + "b";
                    notesFourth.splice(index, 1, flat);
                    if(currentNoteFourth.getValue() == tonic.getValue() && notesFourth.includes(originalTonic)){
                        return true;
                    }
                    return false;
                })()){
                    // Found the tonic in circle of fourths
                    notes = notesFourth;
                    return true;
                }else{
                    // Didn't find the tonic
                    return false;
                }
            });
        }
        return notes;
    }

    //#endregion

}