import { ChangeDetectionStrategy, Component, Injector, ViewEncapsulation } from '@angular/core';
import { Action, ColumnConfig, ColumnDataType, Crumb, exportRows, GridColumnsConfigStorageService, GridData, GridFiltersStorageService, GridState, GridStateService, LangService, log, QueryStatementHandler, ViewBaseComponent } from '@aurora';
import { lastValueFrom, Observable, takeUntil } from 'rxjs';
import { CommonCountry } from '../common.types';
import { CountryService } from './country.service';
import { countryColumnsConfig } from './country.columns-config';

@Component({
    selector       : 'common-country-list',
    templateUrl    : './country-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryListComponent extends ViewBaseComponent
{
    // ---- customizations ----
    // ..

    breadcrumb: Crumb[] = [
        { translation: 'App', routerLink: ['/']},
        { translation: 'common.Countries' },
    ];
    gridId: string = 'common::country.list.mainGridList';
    gridData$: Observable<GridData<CommonCountry>>;
    gridState: GridState = {};
    columnsConfig$: Observable<ColumnConfig[]>;
    originColumnsConfig: ColumnConfig[] = [
        {
            type   : ColumnDataType.ACTIONS,
            field  : 'Actions',
            sticky : true,
            actions: row =>
            {
                return [
                    {
                        id         : 'common::country.list.edit',
                        translation: 'edit',
                        icon       : 'mode_edit',
                    },
                    {
                        id         : 'common::country.list.delete',
                        translation: 'delete',
                        icon       : 'delete',
                    },
                ];
            },
        },
        {
            type       : ColumnDataType.CHECKBOX,
            field      : 'select',
            translation: 'Selects',
            sticky     : true,
        },
        ...countryColumnsConfig,
    ];

    constructor(
        protected readonly injector: Injector,
        private readonly gridColumnsConfigStorageService: GridColumnsConfigStorageService,
        private readonly gridFiltersStorageService: GridFiltersStorageService,
        private readonly gridStateService: GridStateService,
        private readonly countryService: CountryService,
        private readonly langService: LangService,
    )
    {
        super(injector);
    }

    // this method will be called after the ngOnInit of
    // the parent class you can use instead of ngOnInit
    init(): void
    { /**/ }

    async handleAction(action: Action): Promise<void>
    {
        // add optional chaining (?.) to avoid first call where behaviour subject is undefined
        switch (action?.id)
        {
            case 'common::country.list.view':
                this.columnsConfig$ = this.gridColumnsConfigStorageService
                    .getColumnsConfig(this.gridId, this.originColumnsConfig)
                    .pipe(takeUntil(this.unsubscribeAll$));

                this.gridState = {
                    columnFilters: this.gridFiltersStorageService.getColumnFilterState(this.gridId),
                    page         : this.gridStateService.getPage(this.gridId),
                    sort         : this.gridStateService.getSort(this.gridId),
                    search       : this.gridStateService.getSearchState(this.gridId),
                };

                this.gridData$ = this.countryService.pagination$;
                break;

            case 'common::country.list.pagination':
                await lastValueFrom(
                    this.countryService.pagination({
                        query: action.data.query ?
                            action.data.query :
                            QueryStatementHandler
                                .init({ columnsConfig: countryColumnsConfig })
                                .setColumFilters(this.gridFiltersStorageService.getColumnFilterState(this.gridId))
                                .setSort(this.gridStateService.getSort(this.gridId))
                                .setPage(this.gridStateService.getPage(this.gridId))
                                .setSearch(this.gridStateService.getSearchState(this.gridId))
                                .getQueryStatement(),
                    }),
                );
                break;

            case 'common::country.list.edit':
                this.router.navigate(['common/country/edit', action.data.row.id]);
                break;

            case 'common::country.list.delete':
                const deleteDialogRef = this.confirmationService.open({
                    title  : `${this.translocoService.translate('Delete')} ${this.translocoService.translate('common.Country')}`,
                    message: this.translocoService.translate('DeletionWarning', { entity: this.translocoService.translate('common.Country') }),
                    icon   : {
                        show : true,
                        name : 'heroicons_outline:exclamation',
                        color: 'warn',
                    },
                    actions: {
                        confirm: {
                            show : true,
                            label: this.translocoService.translate('Remove'),
                            color: 'warn',
                        },
                        cancel: {
                            show : true,
                            label: this.translocoService.translate('Cancel'),
                        },
                    },
                    dismissible: true,
                });

                deleteDialogRef.afterClosed()
                    .subscribe(async result =>
                    {
                        if (result === 'confirmed')
                        {
                            try
                            {
                                await lastValueFrom(
                                    this.countryService
                                        .deleteById<CommonCountry>(action.data.row.id),
                                );
                                this.actionService.action({
                                    id          : 'common::country.list.pagination',
                                    isViewAction: false,
                                });
                            }
                            catch(error)
                            {
                                log(`[DEBUG] Catch error in ${action.id} action: ${error}`);
                            }
                        }
                    });
                break;

            case 'common::country.list.export':
                const rows = await lastValueFrom(
                    this.countryService
                        .get({
                            query: action.data.query,
                        }),
                );

                // format export rows
                (rows.objects as any[]).forEach(row =>
                {
                    // row.id = row.id;
                });

                const columns: string[] = countryColumnsConfig.map(countryColumnConfig => countryColumnConfig.field);
                const headers: string[] = columns.map(column => this.translocoService.translate('common.' + column.toPascalCase()));

                exportRows(
                    rows.objects,
                    'countries.' + action.data.format,
                    columns,
                    headers,
                    action.data.format,
                );
                break;
        }
    }
}
