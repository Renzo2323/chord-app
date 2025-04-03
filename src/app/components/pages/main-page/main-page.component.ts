import { Component, HostListener, effect, ViewChild} from '@angular/core';

import { Mode } from '../../../enum/mode.enum';
import { NoteId } from '../../../class/note-id.class';
import { FormsModule } from '@angular/forms'
import { ChordService } from '../../../service/chord.service';
import { Scale } from '../../../class/scale.class';
import { Accidental } from '../../../enum/accidental.enum';
import { ChordQuality } from '../../../enum/chord-quality.enum';
import { VisualPianoComponent } from "../../visual-piano/visual-piano.component";
import { AudioService } from '../../../service/audio.service';
import { InstrumentData } from '../../../model/instrument-data.model';
import { ChordAlteration } from '../../../enum/chord-alteration.enum';
import { DropdownMenuComponent } from "../../dropdown-menu/dropdown-menu.component";
import { MenuItem } from '../../../model/menu-item.model';
import { NumberInputComponent } from "../../number-input/number-input.component";
import { Key } from '../../../model/key.model';
import { ChordType } from '../../../enum/chord-type.enum';
import { TonicOption } from '../../../model/tonic-option.model';

@Component({
    selector: 'app-home-page',
    standalone: true,
    imports: [FormsModule, VisualPianoComponent, DropdownMenuComponent, NumberInputComponent],
    templateUrl: './main-page.component.html',
    styleUrl: './main-page.component.css',
})
export class MainPageComponent {
    @ViewChild(VisualPianoComponent) visualPiano !: VisualPianoComponent

    // HTML Types and helpers
    JSON = JSON
    Mode = Mode;
    Accidental = Accidental;
    ChordQuality = ChordQuality;
    ChordAlteration = ChordAlteration;
    ChordType = ChordType;

    // Options
    tonicOptions: TonicOption[] = [
        {note: "C", value: {id: 1, accidental: Accidental.Natural}},
        {note: "C#", value: {id: 2, accidental: Accidental.Sharp}},
        {note: "Db", value: {id: 2, accidental: Accidental.Flat}},
        {note: "D", value: {id: 3, accidental: Accidental.Natural}},
        {note: "D#", value: {id: 4, accidental: Accidental.Sharp}},
        {note: "Eb", value: {id: 4, accidental: Accidental.Flat}},
        {note: "E", value: {id: 5, accidental: Accidental.Natural}},
        {note: "F", value: {id: 6, accidental: Accidental.Natural}},
        {note: "F#", value: {id: 7, accidental: Accidental.Sharp}},
        {note: "Gb", value: {id: 7, accidental: Accidental.Flat}},
        {note: "G", value: {id: 8, accidental: Accidental.Natural}},
        {note: "G#", value: {id: 9, accidental: Accidental.Sharp}},
        {note: "Ab", value: {id: 9, accidental: Accidental.Flat}},
        {note: "A", value: {id: 10, accidental: Accidental.Natural}},
        {note: "A#", value: {id: 11, accidental: Accidental.Sharp}},
        {note: "Bb", value: {id: 11, accidental: Accidental.Flat}},
        {note: "B", value: {id: 12, accidental: Accidental.Natural}}
    ];

    instrumentOptions: InstrumentData[] = [
        {name: "Synth", fileName: "synth"},
        {name: "Grand piano", fileName: "grand"},
        {name: "Electric piano", fileName: "electric"},
        {name: "Rhodes", fileName: "rhodes"},
    ]

    pianoMenuOptions = [
        {id: "scale-highlight", description: "Highlight scale"},
        {id: "scale-labels", description: "Hide scale labels"}
    ]

    // User input
    selectedScale: Scale = new Scale(new NoteId(), Mode.Ionian);
    tonicSelect: TonicOption = this.tonicOptions[0];
    chordData = {
        scaleDegree: 1,
        extension: 3
    };
    octave: number = 4;
    useBassNote: boolean = false;
    instrument: InstrumentData = this.instrumentOptions[0];

    advancedChordExtension: number = 3;
    chordType: ChordType = ChordType.MajorTriad;
    chordQualityTriad: ChordQuality = ChordQuality.Major;
    chordQuality7th: ChordQuality = ChordQuality.Major;
    chordQuality9th: ChordQuality = ChordQuality.Perfect;
    chordQuality11th: ChordQuality = ChordQuality.Perfect;

    chordAlteration: ChordAlteration | undefined;
    isPianoMenuVisible: boolean = false;
    inAdvancedMode: boolean = false;
    arpeggiate: boolean = false;
    invertDiatonicChords: boolean = false;

    volume: number = -12;

    inEarTrainingMode: boolean = false;
    trainingDiminishedEnabled: boolean = false;
    trainingMinorEnabled: boolean = true;
    trainingMajorEnabled: boolean = true;
    trainingAugmentedEnabled: boolean = false;
    selectedTrainingQuality: ChordQuality | undefined;
    trainingUseSameRoot: boolean = false;

    // Output
    scaleMap: Map<number, string> | undefined = undefined;
    scaleAccidental: Accidental = Accidental.Natural;
    displayedChord: number[] | undefined = undefined;
    displayedChordNames: string[] | undefined = undefined;
    displayedChordName: string | undefined = undefined;
    trainingMessage: string = "";
    
    // Other
    loadingInstrument: boolean = false;
    currentTrainingQuality: ChordQuality | undefined;
    hasSelectedTrainingQuality: boolean = false;

    trainingRightAnswers: number = 0;
    trainingWrongAnswers: number = 0;


    constructor(private chordService: ChordService, private audioService: AudioService){
        effect(() => {
            this.loadingInstrument = this.audioService.loadingInstrument();
        });
    }

    ngOnInit(){
        this.getScaleMap();
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        switch(event.key){
            case "1": case "2": case "3": case "4": case "5": case "6": case "7":
                this.playScaleDegreeChord(Number(event.key))
                break;
        }
    }
    
    private playScaleDegreeChord(scaleDegree: number){
        this.chordData.scaleDegree = scaleDegree;
        this.getDiatonicChord(undefined, true);
    }

    //#region Scales

    getScaleMap(){
        this.scaleMap = this.chordService.getNoteValueNameMap(this.selectedScale);
        this.updateScaleAccidental();
        this.playScale();
    }

    getMapNoteValues(){
        if(this.scaleMap) return [...this.scaleMap?.keys()];
        else return undefined;
    }

    getMapNoteNames(){
        if(this.scaleMap) return [...this.scaleMap?.values()];
        else return undefined;
    }

    onTonicChange(selection: TonicOption){
        this.selectedScale.tonic.value = selection.value.id;
        this.selectedScale.accidental = selection.value.accidental;
        this.getScaleMap();
    }

    onModeChange(){
        this.getScaleMap();
    }

    playScale(){
        if(this.scaleMap){
            this.audioService.playNotes([...this.scaleMap.keys()], "melodic", "advanced", 4, this.selectedScale, false, true, true);
        }
    }

    getScaleTitle(){
        let mode = Mode[this.selectedScale.mode].toUpperCase();
        if(mode == "IONIAN"){
            mode = "MAJOR";
        }else if(mode == "AEOLIAN"){
            mode = "MINOR";
        }
        return this.tonicSelect.note + " " + mode + " SCALE";
    }

    updateScaleAccidental(){
        let sAccidental = Accidental.Natural;
        this.scaleMap?.forEach((name, id) =>{
            const accidental = name.slice(1, 2);
            if(accidental == "#"){
                sAccidental = Accidental.Sharp;
            }else if(accidental == "b"){
                sAccidental = Accidental.Flat;
            }
        })
        this.scaleAccidental = sAccidental;
    }

    //#endregion
    
    //#region Chords

    getDiatonicChord(specificOctave?: number, doInversion: boolean = false){
        this.displayedChord = this.chordService.getDiatonicChord(this.selectedScale, this.chordData.scaleDegree, this.chordData.extension);
        this.updateChordNoteNames();
        this.playChord(specificOctave, doInversion);
    }

    getAdvancedChord(root: number, octave: number, overrideQuality?: ChordQuality){
        let chordQualities: ChordQuality[] = [];
        let selectedQualities = [this.chordQualityTriad, this.chordQuality7th, this.chordQuality9th, this.chordQuality11th];
        for (let index = 0; index < (this.advancedChordExtension - 2); index++) {
            chordQualities.push(selectedQualities[index]);
        }
        if(overrideQuality == undefined){
            this.displayedChord = this.chordService.getChord(root, chordQualities, this.advancedChordExtension, this.chordAlteration);
        }else{
            this.displayedChord = this.chordService.getChord(root, [overrideQuality]);
        }
        this.updateChordNoteNamesAdvanced(overrideQuality);
        this.playChord(octave);
    }

    playChord(specificOctave?: number, doInversion: boolean = false){
        if(!this.displayedChord) return;
        if(this.invertDiatonicChords && doInversion){
            const invertedChord = this.chordService.getDiatonicInversion(this.displayedChord, this.selectedScale, this.octave);
            this.audioService.playNotes(invertedChord, this.arpeggiate ? "melodic" : "harmonic", specificOctave ? "advanced" : "diatonic", specificOctave ?? this.octave, this.selectedScale, this.useBassNote);

        }else{
            this.audioService.playNotes(this.displayedChord, this.arpeggiate ? "melodic" : "harmonic", specificOctave ? "advanced" : "diatonic", specificOctave ?? this.octave, this.selectedScale, this.useBassNote);
        }
    }

    getRomanNumeralChords(){
        return this.chordService.getRomanNumeralChords(this.selectedScale.mode)
    }

    //#endregion

    //#region Piano Display
    
    handlePianoMenuSelection(item : MenuItem){
        switch (item.id) {
            case "scale-highlight":
                this.visualPiano.highlightKeys = !this.visualPiano.highlightKeys;
                
                const newDescriptionHighlight = this.visualPiano.highlightKeys ? "Remove scale highlight" : "Highlight scale"
                this.pianoMenuOptions[this.pianoMenuOptions.indexOf(item)].description = newDescriptionHighlight
                break;
            case "scale-labels":
                this.visualPiano.showLabels = !this.visualPiano.showLabels;
                
                const newDescriptionLabel = this.visualPiano.showLabels ? "Hide scale labels" : "Show scale labels"
                this.pianoMenuOptions[this.pianoMenuOptions.indexOf(item)].description = newDescriptionLabel
                break;
            default:
                break;
        }
        
    }

    onVisualPianoKeyPress(key: Key){
        if(this.inAdvancedMode){
            this.getAdvancedChord(key.id, key.octave);
        }else{
            if(this.scaleMap && this.scaleMap.has(key.id)){
                const scaleDegree = ([...this.scaleMap?.keys()].indexOf(key.id) + 1);
                this.chordData.scaleDegree = scaleDegree;
                this.getDiatonicChord(key.octave);
            }
        }
        
    }

    //#endregion

    //#region Ear Training

    randomChordTraining(){
        this.trainingMessage = "";
        if(this.getTrainingQualityPoolSize() < 2){
            this.trainingMessage = "Select at least two qualities";
            return;
        }
        this.hasSelectedTrainingQuality = false;
        this.selectedTrainingQuality = undefined;
        const randomOctave = this.trainingUseSameRoot ? this.octave : this.randomIntRange(3, 5);
        this.octave = randomOctave;
        const randomNote = this.trainingUseSameRoot ? (this.displayedChord ? this.displayedChord[0] : 0) : (randomOctave < 4 ? this.randomIntRange(5, 12) :  randomOctave > 4 ? this.randomIntRange(0, 6) : this.randomIntRange(0, 12));
        const possibleQualities = [];
        if(this.trainingDiminishedEnabled){
            possibleQualities.push(2)
        }
        if(this.trainingMinorEnabled){
            possibleQualities.push(1)
        }
        if(this.trainingMajorEnabled){
            possibleQualities.push(0)
        }
        if(this.trainingAugmentedEnabled){
            possibleQualities.push(3)
        }

        const randomQuality = possibleQualities[this.randomIntRange(0, possibleQualities.length - 1)];
        this.currentTrainingQuality = randomQuality;
        this.getAdvancedChord(randomNote, randomOctave, randomQuality); 
    }

    getTrainingQualityPoolSize(){
        let qualityPoolSize = 0;
        if(this.trainingDiminishedEnabled){
            qualityPoolSize ++;
        }
        if(this.trainingMinorEnabled){
            qualityPoolSize ++;
        }
        if(this.trainingMajorEnabled){
            qualityPoolSize ++;
        }
        if(this.trainingAugmentedEnabled){
            qualityPoolSize ++;
        }
        return qualityPoolSize;
    }

    trainingSelect(selection: ChordQuality){
        if(this.getTrainingQualityPoolSize() < 2 || this.hasSelectedTrainingQuality || this.currentTrainingQuality == undefined) return;
        this.hasSelectedTrainingQuality = true;
        this.selectedTrainingQuality = selection;
        this.trainingMessage = ""
        if(this.currentTrainingQuality == selection){
            this.trainingRightAnswers ++;
        }else{
            this.trainingWrongAnswers ++;
        }
    }

    toggleTrainingMode(){
        this.inEarTrainingMode = !this.inEarTrainingMode;
        this.selectedTrainingQuality = undefined;
        if(!this.inEarTrainingMode){
            this.currentTrainingQuality = undefined;
        }else{
            setTimeout(() => {
                this.randomChordTraining();
            }, 300);
        }
    }

    selectedCorrectlyTraining(quality: ChordQuality): boolean{
        return this.hasSelectedTrainingQuality && this.currentTrainingQuality == quality;
    }

    selectedIncorrectlyTraining(quality: ChordQuality): boolean{
        return this.selectedTrainingQuality == quality && this.currentTrainingQuality != this.selectedTrainingQuality;
    }

    getAccuracy(){
        const total = this.trainingRightAnswers + this.trainingWrongAnswers;
        return total == 0 ? 0 : ((this.trainingRightAnswers / total) * 100).toFixed(2);;
    }

    private randomIntRange(min: number, max:number){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //#endregion

    //#region Chord Display

    updateChordNoteNames(){
        if(!this.displayedChord) return;
        let noteNames: string[] = []
        this.displayedChord.forEach(value => {
            if(this.scaleMap){
                const name = this.scaleMap.get(value);
                if(name){
                    noteNames.push(name)
                }
            }
        })
        this.displayedChordNames = noteNames;
        this.updateChordNoteName();
    }

    updateChordNoteNamesAdvanced(overrideQuality?: ChordQuality){
        if(!this.displayedChord) return;
        this.displayedChordNames = this.chordService.getChordNoteNames(this.displayedChord);
        this.updateChordNoteNameAdvanced(overrideQuality);
    }

    onChordTypeChange(){
        if(this.chordType != ChordType.Sus2 && this.chordType != ChordType.Sus4){
            this.chordAlteration = undefined;
        }
        switch (this.chordType) {
            case ChordType.MajorTriad:
                this.chordQualityTriad = ChordQuality.Major;
                this.advancedChordExtension = 3;
                break;
            case ChordType.MinorTriad:
                this.chordQualityTriad = ChordQuality.Minor;
                this.advancedChordExtension = 3;
                break;
            case ChordType.DimTriad:
                this.chordQualityTriad = ChordQuality.Diminished;
                this.advancedChordExtension = 3;
                break;
            case ChordType.AugTriad:
                this.chordQualityTriad = ChordQuality.Augmented;
                this.advancedChordExtension = 3;
                break;
            case ChordType.Sus2:
                this.chordAlteration = ChordAlteration.Sus2;
                this.chordQualityTriad = ChordQuality.Major
                this.advancedChordExtension = 3;
                break;
            case ChordType.Sus4:
                this.chordAlteration = ChordAlteration.Sus4;
                this.chordQualityTriad = ChordQuality.Major
                this.advancedChordExtension = 3;
                break;
            case ChordType.Dom7th:
                this.chordQualityTriad = ChordQuality.Major;
                this.chordQuality7th = ChordQuality.Minor;
                this.advancedChordExtension = 4;
                break;
            case ChordType.Major7th:
                this.chordQualityTriad = ChordQuality.Major;
                this.chordQuality7th = ChordQuality.Major;
                this.advancedChordExtension = 4;
                break;
            case ChordType.Minor7th:
                this.chordQualityTriad = ChordQuality.Minor;
                this.chordQuality7th = ChordQuality.Minor;
                this.advancedChordExtension = 4;
                break;
            case ChordType.MinMaj7th:
                this.chordQualityTriad = ChordQuality.Minor;
                this.chordQuality7th = ChordQuality.Major;
                this.advancedChordExtension = 4;
                break;
            case ChordType.HalfDim7th:
                this.chordQualityTriad = ChordQuality.Diminished;
                this.chordQuality7th = ChordQuality.Minor;
                this.advancedChordExtension = 4;
                break;
            case ChordType.Dim7th:
                this.chordQualityTriad = ChordQuality.Diminished;
                this.chordQuality7th = ChordQuality.Diminished;
                this.advancedChordExtension = 4;
                break;
            case ChordType.Aug7th:
                this.chordQualityTriad = ChordQuality.Augmented;
                this.chordQuality7th = ChordQuality.Minor;
                this.advancedChordExtension = 4;
                break;
            case ChordType.AugMaj7th:
                this.chordQualityTriad = ChordQuality.Augmented;
                this.chordQuality7th = ChordQuality.Major;
                this.advancedChordExtension = 4;
                break;
        }
    }

    getChordDisplayName(){
        return this.displayedChordName ?? "";
    }

    getChordDisplayNotes(){
        if(!this.displayedChordNames) return "";
        let display = "";
        this.displayedChordNames?.forEach(note => {
            display = display + note + " ";
        })
        return display;
    }

    updateChordNoteNameAdvanced(overrideQuality?: ChordQuality){
        if(!this.displayedChordNames) return;

        let chordName = this.displayedChordNames[0];
        const extension = overrideQuality == undefined ? this.advancedChordExtension : 3;
        const alteration = overrideQuality == undefined ? this.chordAlteration : undefined;
        const triadQuality = overrideQuality == undefined ? this.chordQualityTriad : overrideQuality;
        if(extension < 3 || extension > 4){
            this.displayedChordName = "";
            return;
        }
        let quality = "";
        if(alteration == ChordAlteration.Sus2){
            quality = "sus2";
        }else if(alteration == ChordAlteration.Sus4){
            quality = "sus4";
        }else{
            switch (triadQuality) {
                case ChordQuality.Major:
                    if(extension == 3){
                        quality = "M"
                    }else{
                        switch (this.chordQuality7th) {
                            case ChordQuality.Major:
                                quality = "M⁷"
                                break;
                            case ChordQuality.Minor:
                                quality = "⁷"
                                break;
                        }
                    }
                    break;
                case ChordQuality.Minor:
                    if(extension == 3){
                        quality = "m"
                    }else{
                        switch (this.chordQuality7th) {
                            case ChordQuality.Major:
                                quality = "mᴹ⁷";
                                break;
                            case ChordQuality.Minor:
                                quality = "m⁷"
                        }
                    }
                    break;
                case ChordQuality.Diminished:
                    if(extension == 3){
                        quality = "°"
                    }else{
                        switch (this.chordQuality7th) {
                            case ChordQuality.Minor:
                                quality = "ø⁷";
                                break;
                            case ChordQuality.Diminished:
                                quality = "°⁷"
                        }
                    }
                    break;
                case ChordQuality.Augmented:
                    if(extension == 3){
                        quality = "⁺"
                    }else{
                        switch (this.chordQuality7th) {
                            case ChordQuality.Major:
                                quality = "+ᴹ⁷";
                                break;
                            case ChordQuality.Minor:
                                quality = "+⁷"
                        }
                    }
                    break;
            }
        }
        chordName = chordName + quality;

        this.displayedChordName = chordName;
    }

    updateChordNoteName(){
        if(!this.displayedChordNames) return;

        this.displayedChordName = this.chordService.getScaleChordName(this.displayedChordNames[0], this.selectedScale, this.chordData.scaleDegree, this.chordData.extension);
    }

    //#endregion

    //#region Other
    
    onInstrumentChange(){
        this.audioService.loadSamplerInstrument(this.instrument.fileName as string);
    }

    onVolumeChange(){
        this.audioService.changeVolume(this.volume);
    }

    //#endregion

}