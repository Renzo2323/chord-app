import { Accidental } from "../enum/accidental.enum"

export interface TonicOption{
    note: string,
    value: {
        id: number,
        accidental: Accidental
    }
}