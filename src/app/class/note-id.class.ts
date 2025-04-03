export class NoteId{
    value: number;
    static sharpNameMap = new Map([
        [1, "C"], 
        [2, "C#"], 
        [3, "D"], 
        [4, "D#"], 
        [5, "E"], 
        [6, "F"], 
        [7, "F#"], 
        [8, "G"],  
        [9, "G#"], 
        [10, "A"], 
        [11, "A#"],
        [12, "B"], 
    ]);
    static flatNameMap = new Map([
        [1, "C"],
        [2, "Db"],
        [3, "D"],
        [4, "Eb"],
        [5, "E"],
        [6, "F"],
        [7, "Gb"],
        [8, "G"],
        [9, "Ab"],
        [10, "A"],
        [11, "Bb"],
        [12, "B"],
    ]);
    constructor(value: number = 1){
        this.value = this.constrainToChromaticScale(value);
    }

    getValue(){
        return this.value;
    }

    getDefaultNoteName(){
        return NoteId.sharpNameMap.get(this.value);
    }
    
    getName(accidental : "sharp" | "flat"){
        if(accidental == "sharp"){
            return NoteId.sharpNameMap.get(this.value) ?? "Null";
        }else{
            return NoteId.flatNameMap.get(this.value) ?? "Null";
        }
    }

    increaseValue(value: number){
        this.value = this.constrainToChromaticScale(this.value + value);
    }

    decreaseValue(value: number){
        this.value = this.constrainToChromaticScale(this.value - value);
    }

    private constrainToChromaticScale(value: number){
        const chromaticScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const length = chromaticScale.length;
        return chromaticScale[((value - 1) % length + length) % length];
    }
}