import { Component, InjectionToken, Provider, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink, RouterOutlet, Routes } from '@angular/router';

const PARENT_ID = new InjectionToken<Signal<string>>('parentId');

function provideRouteState<T>(token: InjectionToken<Signal<T>>, factoryFn: (
    paramMap: ParamMap,
    queryParamMap: ParamMap,
) => T | null): Provider {
    return {
        provide: token,
        useFactory: () => {
            const activatedRoute = inject(ActivatedRoute);
            const paramMap = toSignal(activatedRoute.paramMap, { requireSync: true });
            const queryParamMap = toSignal(activatedRoute.queryParamMap, { requireSync: true });

            return computed(() => factoryFn(paramMap(), queryParamMap()));
        }
    };
}

type ParamKey = { param: string };
type QueryParamKey = { queryParam: string };

function isParamKey(key: ParamKey | QueryParamKey): key is ParamKey {
    return key.hasOwnProperty('param');
}

function provideRouteStateFoo<T>(token: InjectionToken<Signal<T>>, prop: ParamKey | QueryParamKey): Provider {
    return {
        provide: token,
        useFactory: () => {
            const activatedRoute = inject(ActivatedRoute);
            const paramMap = toSignal(activatedRoute.paramMap, { requireSync: true });
            const queryParamMap = toSignal(activatedRoute.queryParamMap, { requireSync: true });

            return computed(() => {
                const value = isParamKey(prop) ? paramMap().get(prop.param) : queryParamMap().get(prop.queryParam);
                assert(value);
                return value;
            });
        },
    }
}

@Component({
    selector: 'parent',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    standalone: true,
    providers: [
        //     {
        //     provide: PARENT_ID,
        //     useFactory: () => {
        //         const activatedRoute = inject(ActivatedRoute);
        //         const paramMap = toSignal(activatedRoute.paramMap, { requireSync: true });

        //         return computed(() => {
        //             const parentId = paramMap().get('parentId');
        //             assert(parentId, 'missing required project id');
        //             return parentId;
        //         });
        //     },
        // },
        // provideRouteStateFoo(PARENT_ID, { param: 'parentId' }),
        // provideRouteStateFoo(new InjectionToken<string>(''), { param: 'other' }),
        // provideRouteState(PARENT_ID, (paramMap, queryParamMap) => {
        //     const parentId = paramMap.get('parentId');
        //     assert(parentId, 'missing required parent id');
        //     return parentId;
        // }),
    ],
})
class Parent { }

@Component({
    selector: 'child',
    template: `
        hey there: {{ name() }}
    `,
    imports: [RouterLink],
    standalone: true,
})
class Child {
    readonly name = inject(PARENT_ID);
}

@Component({
    selector: 'nope',
    template: 'not project scoped',
    standalone: true,
})
class NotProjectScoped { }

type ExtractRouteParams<T extends string> =
    T extends `${infer Before}/:${infer Param}/${infer After}`
    ? Param | ExtractRouteParams<Before> | ExtractRouteParams<After>
    : T extends `${infer Before}/:${infer Param}`
    ? Param | ExtractRouteParams<Before>
    : never;

type ValueOf<T> = T[keyof T]
type Entries<T> = [keyof T, ValueOf<T>][]

// Same as `Object.entries()` but with type inference
function objectEntries<T extends object>(obj: T): Entries<T> {
    return Object.entries(obj) as Entries<T>
}

function guaranteedRoute<
    Path extends string,
    RouteParams extends ExtractRouteParams<Path>
>(path: Path, tokens: Record<RouteParams, InjectionToken<string>>, children: Routes) {
    @Component({
        selector: 'noop',
        template: '<router-outlet />',
        standalone: true,
        imports: [RouterOutlet],
        providers: objectEntries(tokens).map(([key, value]) => provideRouteStateFoo(value, { param: key })),
    }) class NoOp { }

    return {
        path, children: [{
            path: '',
            component: NoOp,
            children,
        }]
    };
}

export const routes: Routes = [
    //     {
    //     path: 'parent/:parentId',
    //     component: Parent,
    //     // providers: [provideRouteStateFoo(PARENT_ID, { param: 'parentId' })],
    //     children: [{
    //         path: 'child',
    //         component: Child
    //     }]
    // }, 
    // guaranteedRoute('parent/:parentId', { parentId: PARENT_ID }, [{
    //     path: 'child',
    //     component: Child,
    // }]),
    {
        ...guaranteedRoute('parent/:parentId', { parentId: PARENT_ID }, [{
            path: 'child',
            component: Child,
        }]),
        canMatch: [() => true],
    },
    {
        path: 'nah',
        component: NotProjectScoped
    }, {
        path: "**",
        redirectTo: "nah"
    }];

function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg);
    }
}