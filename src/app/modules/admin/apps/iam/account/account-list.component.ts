import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { accountColumnsConfig, AccountService } from '@apps/iam/account';
import { IamAccount } from '@apps/iam/iam.types';
import { Action, AuthenticationService, AuthorizationService, ColumnConfig, ColumnDataType, Crumb, defaultListImports, exportRows, GridColumnsConfigStorageService, GridData, GridFiltersStorageService, GridState, GridStateService, log, QueryStatementHandler, ViewBaseComponent } from '@aurora';
import { lastValueFrom, Observable, takeUntil } from 'rxjs';

export const accountMainGridListId = 'iam::account.list.mainGridList';

@Component({
    selector       : 'iam-account-list',
    templateUrl    : './account-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [
        ...defaultListImports,
    ],
})
export class AccountListComponent extends ViewBaseComponent
{
    // ---- customizations ----
    // ..

    breadcrumb: Crumb[] = [
        { translation: 'App', routerLink: ['/']},
        { translation: 'iam.Accounts' },
    ];
    gridId: string = accountMainGridListId;
    gridData$: Observable<GridData<IamAccount>>;
    gridState: GridState = {};
    columnsConfig$: Observable<ColumnConfig[]>;
    originColumnsConfig: ColumnConfig[] = [
        {
            type   : ColumnDataType.ACTIONS,
            field  : 'Actions',
            sticky : true,
            actions: row =>
            {
                const actions = [];

                actions.push(
                    {
                        id         : 'iam::account.list.edit',
                        translation: 'edit',
                        icon       : 'mode_edit',
                    },
                    {
                        id         : 'iam::account.list.delete',
                        translation: 'delete',
                        icon       : 'delete',
                    },
                );

                if (this.authorizationService.can('oAuth.credential.impersonalize'))
                {
                    actions.push(
                        {
                            id          : 'iam::account.list.impersonalize',
                            isViewAction: false,
                            translation : 'impersonalize',
                            iconFontSet : 'material-symbols-outlined',
                            icon        : 'photo_auto_merge',
                        },
                    );
                }

                return actions;
            },
        },
        {
            type       : ColumnDataType.CHECKBOX,
            field      : 'select',
            translation: 'Selects',
            sticky     : true,
        },
        ...accountColumnsConfig,
    ];

    constructor(
        private readonly gridColumnsConfigStorageService: GridColumnsConfigStorageService,
        private readonly gridFiltersStorageService: GridFiltersStorageService,
        private readonly gridStateService: GridStateService,
        private readonly accountService: AccountService,
        private readonly authenticationService: AuthenticationService,
        private readonly authorizationService: AuthorizationService,
    )
    {
        super();
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
            case 'iam::account.list.view':
                this.columnsConfig$ = this.gridColumnsConfigStorageService
                    .getColumnsConfig(this.gridId, this.originColumnsConfig)
                    .pipe(takeUntil(this.unsubscribeAll$));

                this.gridState = {
                    columnFilters: this.gridFiltersStorageService.getColumnFilterState(this.gridId),
                    page         : this.gridStateService.getPage(this.gridId),
                    sort         : this.gridStateService.getSort(this.gridId),
                    search       : this.gridStateService.getSearchState(this.gridId),
                };

                this.gridData$ = this.accountService.pagination$;
                break;

            case 'iam::account.list.pagination':
                await lastValueFrom(
                    this.accountService.pagination({
                        query: action.meta.query ?
                            action.meta.query :
                            QueryStatementHandler
                                .init({ columnsConfig: accountColumnsConfig })
                                .setColumFilters(this.gridFiltersStorageService.getColumnFilterState(this.gridId))
                                .setSort(this.gridStateService.getSort(this.gridId))
                                .setPage(this.gridStateService.getPage(this.gridId))
                                .setSearch(this.gridStateService.getSearchState(this.gridId))
                                .getQueryStatement(),
                    }),
                );
                break;

            case 'iam::account.list.edit':
                this.router
                    .navigate([
                        'iam/account/edit',
                        action.meta.row.id,
                    ]);
                break;

            case 'iam::account.list.delete':
                const deleteDialogRef = this.confirmationService.open({
                    title  : `${this.translocoService.translate('Delete')} ${this.translocoService.translate('iam.Account')}`,
                    message: this.translocoService.translate('DeletionWarning', { entity: this.translocoService.translate('iam.Account') }),
                    icon   : {
                        show : true,
                        name : 'heroicons_outline:exclamation-triangle',
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
                                    this.accountService
                                        .deleteById<IamAccount>({
                                            id: action.meta.row.id,
                                        }),
                                );

                                this.actionService.action({
                                    id          : 'iam::account.list.pagination',
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

            case 'iam::account.list.export':
                const rows = await lastValueFrom(
                    this.accountService
                        .get({
                            query: action.meta.query,
                        }),
                );

                // format export rows
                (rows.objects as any[]).forEach(row =>
                {
                    // row.id = row.id;
                });

                const columns: string[] = accountColumnsConfig.map(accountColumnConfig => accountColumnConfig.field);
                const headers: string[] = columns.map(column => this.translocoService.translate('iam.' + column.toPascalCase()));

                exportRows(
                    rows.objects,
                    'accounts.' + action.meta.format,
                    columns,
                    headers,
                    action.meta.format,
                );
                break;

            case 'iam::account.list.impersonalize':
                await lastValueFrom(
                    this.authenticationService
                        .impersonalize(action.meta.row.id)
                );
                await this.router.navigate(['/']);
                window.location.reload();
                break
        }
    }
}
