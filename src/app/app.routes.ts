import { Component, InjectionToken, Signal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet, Routes } from '@angular/router';

const PARENT_ID = new InjectionToken<Signal<string>>('parentId');

@Component({
    selector: 'parent',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    standalone: true,
    providers: [{
        provide: PARENT_ID,
        useFactory: () => {
            const activatedRoute = inject(ActivatedRoute);
            const paramMap = toSignal(activatedRoute.paramMap, { requireSync: true });

            return computed(() => {
                const parentId = paramMap().get('parentId');
                assert(parentId, 'missing required project id');
                return parentId;
            });
        },
    }],
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

export const routes: Routes = [{
    path: 'parent/:parentId',
    component: Parent,
    children: [{
        path: 'child',
        component: Child
    }]
}, {
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