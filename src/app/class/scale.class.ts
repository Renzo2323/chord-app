import { NoteId } from "../class/note-id.class";
import { Accidental } from "../enum/accidental.enum";
import { Mode } from "../enum/mode.enum";

export class Scale{
    tonic: NoteId;
    mode: Mode;
    accidental: Accidental;

    constructor(tonic: NoteId, mode: Mode, accidental: Accidental = Accidental.Natural){
        this.tonic = tonic;
        this.mode = mode;
        this.accidental = accidental;
    }
}