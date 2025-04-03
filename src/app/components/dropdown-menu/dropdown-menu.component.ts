import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ChangeDetectorRef} from '@angular/core';
import { MenuItem } from '../../model/menu-item.model';



@Component({
    selector: 'app-dropdown-menu',
    standalone: true,
    imports: [],
    template: `
        <div class="wrapper">
            <ng-content class="menu-button"></ng-content>
            @if(visible){
                <div class="menu" [class.left-menu]="direction == 'left'">
                    <ul class="menu-content">
                        @for (item of menuItems; track $index) {
                            <li><button (click)="selectItem(item)" class="menu-item">{{item.description}}</button></li>
                        }
                    </ul>
                    
                </div>
            }
        </div>
        
    `,
    styles: `
        .wrapper{
            position: relative;
        }
        
        .menu{
            position: absolute;
            z-index: 10;
            background-color: white;
            border-radius: 3px;
            border-style: solid;
            border-width: 2px;
            border-color: rgb(144 44 0 / 68%)
            box-shadow: 0px 2px 4px 0px rgb(6 6 212 / 20%);

        }

        .left-menu{
            right: 0px;
        }

        .menu-content{
            white-space: nowrap;

        }

        button{
            background: unset;
            border: unset;
            padding: 4px 20px 4px 7px;
            cursor: pointer;
            width: 100%;
            text-align: left;
        }

        button:hover{
            background-color: #ffe7b5;
        }

        ul{
            list-style: none; 
            padding: 0;
            margin: 0;
            border: solid 0.5px #ffdba5;
        }
    `,
})
export class DropdownMenuComponent {
    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() menuItems: MenuItem[] = []
    @Output() itemSelected: EventEmitter<MenuItem> = new EventEmitter<MenuItem>();
    @Input() direction: "left" | "right" = "right";

    constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {}

    private close(){
        this.visible = false;
        this.visibleChange.emit(false);
    }
    
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (this.visible && !this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }

    selectItem(item: MenuItem){
        this.itemSelected.emit(item);
        this.close();
    }
}