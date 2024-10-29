import { Component, InjectionToken, Provider, Signal, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Route, RouterOutlet } from "@angular/router";

type ExtractRouteParams<T extends string> =
    T extends `${infer Before}/:${infer Param}/${infer After}`
    ? Param | ExtractRouteParams<Before> | ExtractRouteParams<After>
    : T extends `${infer Before}/:${infer Param}`
    ? Param | ExtractRouteParams<Before>
    : never;

function provideRouteStateParam<T>(token: InjectionToken<Signal<T>>, param: string): Provider {
    return {
        provide: token,
        useFactory: () => {
            const activatedRoute = inject(ActivatedRoute);
            const paramMap = toSignal(activatedRoute.paramMap, { requireSync: true });

            return computed(() => {
                const value = paramMap().get(param);
                assert(value, `missing required param ${param}`);
                return value;
            });
        },
    }
}

export function guaranteeRoute<T extends string>(path: T, tokens: Record<ExtractRouteParams<T>, InjectionToken<Signal<string>>>, children: Route[]): Route {
    @Component({
        template: '<router-outlet />',
        standalone: true,
        imports: [RouterOutlet],
        providers: objectEntries(tokens).map(([param, token]) => provideRouteStateParam(token, param)),
    })
    class NoOp { }

    return {
        path,
        children: [{
            path: '',
            component: NoOp,
            children,
        }],
    };
}

type ValueOf<T> = T[keyof T]
type Entries<T> = [keyof T, ValueOf<T>][]

// Same as `Object.entries()` but with type inference
function objectEntries<T extends object>(obj: T): Entries<T> {
    return Object.entries(obj) as Entries<T>
}

function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg);
    }
}