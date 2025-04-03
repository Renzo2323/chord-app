import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms'

@Component({
    selector: 'app-number-input',
    standalone: true,
    imports: [FormsModule],
    template: `
        <div class="number-input-container">
            <div (click)="subtract()" class="down-arrow arrow">-</div>
            <input (ngModelChange)="modelChange.emit($event)" type="number" id="octave" name="octave" [(ngModel)]="model" [style.width]="width" [attr.min]="min" [attr.max]="max">
            <div (click)="add()" class="up-arrow arrow">+</div>
        </div>
    `,
    styles: `
        .number-input-container{
            display: flex;
        }

        .arrow{
            width: 10px;
            height: 20px;
            padding: 2px 5px;
            border-radius: 5px;
            border-width: 2px;
            border-style: solid;
            text-align: center;
            cursor: pointer;
            border-color: #f58d498f;
            background-color: #892318;
            color: #ffffff;
        }

        .arrow:hover{
            background-color: #78170c;
        }

        .up-arrow{
            border-left: unset;
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
        }

        .down-arrow{
            border-right: unset;
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        input{
            border-left: unset;
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
            border-right: unset;
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
            text-align: center;

            background-color: #892318;
            color: #ffffff;
            width: 20px;
            border-color: #f58d498f;
            box-shadow: unset;
        }
    `,
})
export class NumberInputComponent {
    @Input() model!: number;
    @Output() modelChange = new EventEmitter<number>();
    @Input() width: string = "100px";
    @Input() max: number | undefined;
    @Input() min: number | undefined;

    subtract(){
        if(this.min && (this.model - 1 < this.min)){
            return;
        }
        this.model = this.model - 1;
        this.modelChange.emit(this.model)
    }

    add(){
        if(this.max && (this.model + 1 > this.max)){
            return;
        }
        this.model = this.model + 1;
        this.modelChange.emit(this.model)
    }
}