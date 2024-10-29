import { Component, InjectionToken, Signal, inject } from '@angular/core';
import { RouterLink, Routes } from '@angular/router';
import { guaranteeRoute } from './route-state';

const PARENT_ID = new InjectionToken<Signal<string>>('parentId');

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

export const routes: Routes = [
    guaranteeRoute('parent/:parentId', {
        parentId: PARENT_ID
    }, [{
        path: 'child',
        component: Child
    }]),
    {
        path: 'nah',
        component: NotProjectScoped
    }, {
        path: "**",
        redirectTo: "nah"
    },
];