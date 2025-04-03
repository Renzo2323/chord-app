import {Injectable, signal} from '@angular/core';
import * as Tone from "tone";
import { Scale } from '../class/scale.class';
import { ChordService } from './chord.service';

@Injectable({
    providedIn: 'root',
})
export class AudioService {

    private _instrument: Tone.Sampler | undefined;
    private _heldNotes = signal<string[]>([]);
    private _loadingInstrument = signal<boolean>(false);
    private chordTimeouts: ReturnType<typeof setTimeout>[] = [];

    constructor(private chordService: ChordService){
        this.changeVolume(-12);
        this.loadSamplerInstrument("synth");
    };
    
    get heldNotes(){
        return this._heldNotes
    }

    updateHeldNotes(notes: string[]) {
        this.heldNotes.set(notes); 
    }

    addHeldNote(note: string){
        this.heldNotes.update(heldNotes => {
            if(heldNotes.includes(note)){
                return heldNotes;
            }
            return[...heldNotes, note]});
    }

    removeHeldNote(note: string){
        this.heldNotes.update(heldNotes => heldNotes.filter(n => n != note));
    }

    emptyHeldNotes(){
        this.heldNotes.set([]);
        Tone.getTransport().cancel();
    }

    get loadingInstrument(){
        return this._loadingInstrument
    }

    updateLoadingInstrument(value: boolean) {
        this.loadingInstrument.set(value); 
    }

    get instrument(){
        return this._instrument;
    }

    set instrument(value: Tone.Sampler | undefined){
        this._instrument?.dispose()
        this._instrument = value;
    }

    async loadSamplerInstrument(name: string){
        this.updateLoadingInstrument(true);
        const baseUrl = `audio/notes/${name}/`;
        const urls: any = {};
        const notes: Map<string, string> = new Map([["C", "01"], ["D#", "04"], ["F#", "07"], ["A", "10"]]);
        for (let octave = 3; octave <= 5; octave++) {          
            for (const [note, id] of notes) {
                const key = note + octave.toString();
                const path = `Note_${octave.toString()}-${id}.mp3`;
                urls[key] = path; 
            }
        }
        this.instrument = new Tone.Sampler({
            urls: urls,
            release: 2,
            baseUrl: baseUrl,
            volume: -10,
            onload: () => {
                this.updateLoadingInstrument(false);
            }
        }).toDestination()

        const reverb = new Tone.Reverb({
            decay: 0.5,
            preDelay: 0.1,
            wet: 0.5
        }).toDestination();

        this.instrument.connect(reverb);

    }

    playNotes(notes: number[] | string[], style: "melodic" | "harmonic", type: "diatonic" | "advanced", octave: number, scale: Scale, bassNote: boolean = false, repeatRoot: boolean = false, longLastNote: boolean = false){
        if(this._loadingInstrument()) return;
        if(!this.instrument){
            return;
        } 

        this.releaseNotes();
        let noteNames: string[];
        if(typeof notes[0] == "number"){
            noteNames = this.chordService.getPlayableNotes(notes as number[], scale, type, octave, bassNote, repeatRoot);

        }else{
            noteNames = notes as string[];
        }

        this.chordTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        })
        if(style == "harmonic"){
            this.instrument.triggerAttack(noteNames, Tone.now());

            noteNames.forEach(note => {
                this.addHeldNote(note);
            });
            
            const timeout = setTimeout(() => {
                this.instrument?.triggerRelease(noteNames);
                noteNames.forEach(note => {
                    this.removeHeldNote(note);
                });
            }, 1000);
            this.chordTimeouts.push(timeout);
        }else{
            for (let i = 0; i < noteNames.length + 1; i++) {
                const timeout = setTimeout(() => {
                    if(i > 0){
                        this.instrument?.triggerRelease(noteNames[i - 1]);
                        this.removeHeldNote(noteNames[i - 1]);
                    } 
                    if(i < noteNames.length){
                        this.instrument?.triggerAttack(noteNames[i]);
                        this.addHeldNote(noteNames[i]);
                    } 
                }, i * (longLastNote && (i == noteNames.length) ? 450 : 300));
                this.chordTimeouts.push(timeout);
            }
        }
    }

    changeVolume(volume: number){
        Tone.getDestination().volume.rampTo(volume, 0.1);
    }
    
    private releaseNotes(){
        this.instrument?.releaseAll();
        this.emptyHeldNotes();
        Tone.getTransport().cancel();
    }

}