import { Component, Input, Output, EventEmitter, effect} from '@angular/core';

import { FormsModule } from '@angular/forms'
import { Key } from '../../model/key.model';
import { ChordService } from '../../service/chord.service';
import { AudioService } from '../../service/audio.service';

@Component({
    selector: 'app-visual-piano',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './visual-piano.component.html',
    styleUrl: './visual-piano.component.css',
})
export class VisualPianoComponent {
    heldKeys: string[] = [];
    private _scaleMap: Map<number, string> | undefined = undefined;
    @Input() set scaleMap(value: Map<number, string> | undefined){
        this._scaleMap = value;
        if(value) this.highlightScale(value);
    }
    get scaleMap(): Map<number, string> | undefined {
        return this._scaleMap;
    }

    @Output() keyPress = new EventEmitter<Key>()

    keys: Key[] = [];
    size: number = 3;
    highlightKeys = false;
    showLabels = true;

    constructor(private chordService: ChordService, private audioService: AudioService){
        this.generateKeys();
        effect(() => {
            this.heldKeys = this.audioService.heldNotes() ?? [];
            this.updateHeldKeys(this.heldKeys);
          });
    }
    
    // This currently generates an 40 key piano. But it could be adjusted or parameterized
    // to use a different number of keys.
    generateKeys(){
        
        this.keys = [];
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        const octaveCount = 5;
        const lowestOctave = 2;
        for (let octave = lowestOctave; octave <= octaveCount; octave++) {
                notes.forEach((note, index) => {
                if(octave == lowestOctave && index < 9) return;
                const name = note + octave;
                this.keys.push({id: index + 1 ,defaultName: name, octave: octave, scaleName: "", held: false, highlighted: false, scaleDegree: 0});
            })
        };
        this.keys.push({id: 1 ,defaultName: "C" + (octaveCount + 1).toString(), octave: (octaveCount + 1), scaleName: "", held: false, highlighted: false, scaleDegree: 0});
    }

    highlightAll(){

    }
    
    private updateHeldKeys(heldKeys: string[]){
        this.keys.forEach(key => {
            key.held = heldKeys.includes(key.defaultName)
        });    
    }

    private highlightScale(scale : Map<number, string>){
        this.keys.forEach(key =>{
            key.highlighted = scale.has(key.id);
            key.scaleName = key.highlighted ? scale.get(key.id) ?? "" : "";
            key.scaleDegree = key.highlighted ? ([...scale.keys()].indexOf(key.id) + 1) : 0;
        })
    }

    getKeyLook(id: number, name: string, index: number): string{
        
        if(index == 0) return "first";
        if(index == (this.keys.length -1)) return "last";

        switch (id) {
            case 5: 
            case 12:
                return "white-left";
            case 1: 
            case 6:
                return "white-right";
            case 3: 
            case 8:
            case 10:
                return "white-left-right";
            case 2: 
            case 4:
            case 7:
            case 9:
            case 11:
                return "black";
            default:
                return "null"
        }
    }

    onSizeChange(){
        document.documentElement.style.setProperty("--scale-multiplier", this.size.toString());
    }

    pressingKey(key: Key){
        this.keyPress.emit(key);
    }
}