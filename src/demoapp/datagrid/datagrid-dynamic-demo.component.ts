import {
    Component,
    AfterContentInit,
    ElementRef,
    ViewChild,
    AfterViewInit,
    ChangeDetectionStrategy
} from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import {
    SoHoDataGridComponent,
    SoHoButtonComponent,
    GridColumn
} from '../';

import {
    DataGridDemoService
} from './datagrid-demo.service';

@Component({
    moduleId: module.id,
    selector: 'sample-datagrid',
    templateUrl: 'datagrid-dynamic-demo.component.html',
    providers: [ DataGridDemoService ],
    directives: [ SoHoDataGridComponent, SoHoButtonComponent ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataGridDynamicDemoComponent implements AfterContentInit, AfterViewInit {
    @ViewChild(SoHoDataGridComponent) dataGrid: SoHoDataGridComponent;

    private _subject$ = <BehaviorSubject<any[]>>new BehaviorSubject([]);

    public data = this._subject$.asObservable();

    constructor(private el: ElementRef,
        private service: DataGridDemoService) {
    }

    public get columns(): Observable<GridColumn[]> {
        return Observable.of(this.service.getColumns());
    }

    addRows() {
        this.service.getData(null).subscribe((d: any[]) => {
            let newData = new Array<any>(...d);
            newData.forEach((r) => r.orderDate = new Date());
            this._subject$.next(newData);

            setTimeout(() => this.addRows(), 2000);
        });
    }

    addRow() {
        this.service.getData(null).subscribe((d: any[]) => {
            let newData = new Array<any>(d[0]);
            newData.forEach((r) => r.orderDate = new Date());
            this.dataGrid.addRow(newData[0], 'top');
        });
    }

    busy() {
        // @todo!
    }

    ngAfterContentInit() {
    }

    ngAfterViewInit() {
        setTimeout(() => this.addRows(), 1000);
    }
}