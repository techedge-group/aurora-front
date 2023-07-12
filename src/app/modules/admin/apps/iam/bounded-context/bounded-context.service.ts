import { IamBoundedContext, IamCreateBoundedContext, IamPermission, IamUpdateBoundedContextById, IamUpdateBoundedContexts } from '../iam.types';
import { createMutation, deleteByIdMutation, deleteMutation, fields, findByIdQuery, findByIdWithRelationsQuery, findQuery, getQuery, paginationQuery, updateByIdMutation, updateMutation } from './bounded-context.graphql';
import { Injectable } from '@angular/core';
import { DocumentNode, FetchResult } from '@apollo/client/core';
import { GraphQLHeaders, GraphQLService, GridData, parseGqlFields, QueryStatement } from '@aurora';
import { BehaviorSubject, first, map, Observable, tap } from 'rxjs';

// ---- customizations ----
import { PermissionService } from '../permission/permission.service';

@Injectable({
    providedIn: 'root',
})
export class BoundedContextService
{
    paginationSubject$: BehaviorSubject<GridData<IamBoundedContext> | null> = new BehaviorSubject(null);
    boundedContextSubject$: BehaviorSubject<IamBoundedContext | null> = new BehaviorSubject(null);
    boundedContextsSubject$: BehaviorSubject<IamBoundedContext[] | null> = new BehaviorSubject(null);

    constructor(
        private readonly graphqlService: GraphQLService,
        private readonly permissionService: PermissionService,
    ) {}

    /**
    * Getters
    */
    get pagination$(): Observable<GridData<IamBoundedContext>>
    {
        return this.paginationSubject$.asObservable();
    }

    get boundedContext$(): Observable<IamBoundedContext>
    {
        return this.boundedContextSubject$.asObservable();
    }

    get boundedContexts$(): Observable<IamBoundedContext[]>
    {
        return this.boundedContextsSubject$.asObservable();
    }

    pagination(
        {
            graphqlStatement = paginationQuery,
            query = {},
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            query?: QueryStatement;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<GridData<IamBoundedContext>>
    {
        // get result, map ang throw data across observable
        return this.graphqlService
            .client()
            .watchQuery<{ pagination: GridData<IamBoundedContext>; }>({
                query    : graphqlStatement,
                variables: {
                    query,
                    constraint,
                },
                context: {
                    headers,
                },
            })
            .valueChanges
            .pipe(
                first(),
                map(result => result.data.pagination),
                tap(pagination => this.paginationSubject$.next(pagination)),
            );
    }

    findById(
        {
            graphqlStatement = findByIdQuery,
            id = '',
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            id?: string;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<{
        object: IamBoundedContext;
    }>
    {
        return this.graphqlService
            .client()
            .watchQuery<{
                object: IamBoundedContext;
            }>({
                query    : parseGqlFields(graphqlStatement, fields, constraint),
                variables: {
                    id,
                    constraint,
                },
                context: {
                    headers,
                },
            })
            .valueChanges
            .pipe(
                first(),
                map(result => result.data),
                tap(data =>
                {
                    this.boundedContextSubject$.next(data.object);
                }),
            );
    }

    find(
        {
            graphqlStatement = findQuery,
            query = {},
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            query?: QueryStatement;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<{
        object: IamBoundedContext;
    }>
    {
        return this.graphqlService
            .client()
            .watchQuery<{
                object: IamBoundedContext;
            }>({
                query    : parseGqlFields(graphqlStatement, fields, query, constraint),
                variables: {
                    query,
                    constraint,
                },
                context: {
                    headers,
                },
            })
            .valueChanges
            .pipe(
                first(),
                map(result => result.data),
                tap(data =>
                {
                    this.boundedContextSubject$.next(data.object);
                }),
            );
    }

    get(
        {
            graphqlStatement = getQuery,
            query = {},
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            query?: QueryStatement;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<{
        objects: IamBoundedContext[];
    }>
    {
        return this.graphqlService
            .client()
            .watchQuery<{
                objects: IamBoundedContext[];
            }>({
                query    : parseGqlFields(graphqlStatement, fields, query, constraint),
                variables: {
                    query,
                    constraint,
                },
                context: {
                    headers,
                },
            })
            .valueChanges
            .pipe(
                first(),
                map(result => result.data),
                tap(data =>
                {
                    this.boundedContextsSubject$.next(data.objects);
                }),
            );
    }

    create<T>(
        {
            graphqlStatement = createMutation,
            object = null,
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            object?: IamCreateBoundedContext;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<FetchResult<T>>
    {
        return this.graphqlService
            .client()
            .mutate({
                mutation : graphqlStatement,
                variables: {
                    payload: object,
                },
                context: {
                    headers,
                },
            });
    }

    updateById<T>(
        {
            graphqlStatement = updateByIdMutation,
            object = null,
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            object?: IamUpdateBoundedContextById;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<FetchResult<T>>
    {
        return this.graphqlService
            .client()
            .mutate({
                mutation : graphqlStatement,
                variables: {
                    payload: object,
                },
                context: {
                    headers,
                },
            });
    }

    update<T>(
        {
            graphqlStatement = updateMutation,
            object = null,
            query = {},
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            object?: IamUpdateBoundedContexts;
            query?: QueryStatement;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<FetchResult<T>>
    {
        return this.graphqlService
            .client()
            .mutate({
                mutation : graphqlStatement,
                variables: {
                    payload: object,
                    query,
                    constraint,
                },
                context: {
                    headers,
                },
            });
    }

    deleteById<T>(
        {
            graphqlStatement = deleteByIdMutation,
            id = '',
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            id?: string;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<FetchResult<T>>
    {
        return this.graphqlService
            .client()
            .mutate({
                mutation : graphqlStatement,
                variables: {
                    id,
                    constraint,
                },
                context: {
                    headers,
                },
            });
    }

    delete<T>(
        {
            graphqlStatement = deleteMutation,
            query = {},
            constraint = {},
            headers = {},
        }: {
            graphqlStatement?: DocumentNode;
            query?: QueryStatement;
            constraint?: QueryStatement;
            headers?: GraphQLHeaders;
        } = {},
    ): Observable<FetchResult<T>>
    {
        return this.graphqlService
            .client()
            .mutate({
                mutation : graphqlStatement,
                variables: {
                    query,
                    constraint,
                },
                context: {
                    headers,
                },
            });
    }

    // ---- customizations ----
    findByIdWithRelations(
        {
            graphqlStatement = findByIdWithRelationsQuery,
            id = '',
            constraint = {},
            queryPaginatePermissions = {},
            constraintPaginatePermissions = {},
        }: {
            graphqlStatement?: DocumentNode;
            id?: string;
            constraint?: QueryStatement;
            queryPaginatePermissions?: QueryStatement;
            constraintPaginatePermissions?: QueryStatement;
        } = {},
    ): Observable<{
        object: IamBoundedContext;
        iamPaginatePermissions: GridData<IamPermission>;
    }>
    {
        return this.graphqlService
            .client()
            .watchQuery<{
                object: IamBoundedContext;
                iamPaginatePermissions: GridData<IamPermission>;
            }>({
                query    : parseGqlFields(graphqlStatement, fields, constraint),
                variables: {
                    id,
                    constraint,
                    queryPaginatePermissions: {
                        ...queryPaginatePermissions,
                        where: {
                            ...queryPaginatePermissions.where,
                            boundedContextId: id,
                        },
                    },
                    constraintPaginatePermissions,
                },
            })
            .valueChanges
            .pipe(
                first(),
                map<{
                    data: {
                        object: IamBoundedContext;
                        iamPaginatePermissions: GridData<IamPermission>;
                    };
                },
                {
                    object: IamBoundedContext;
                    iamPaginatePermissions: GridData<IamPermission>;
                }>(result => result.data),
                tap((data: {
                    object: IamBoundedContext;
                    iamPaginatePermissions: GridData<IamPermission>;
                }) =>
                {
                    this.boundedContextSubject$.next(data.object);
                    this.permissionService.paginationSubject$.next(data.iamPaginatePermissions);
                }),
            );
    }
}