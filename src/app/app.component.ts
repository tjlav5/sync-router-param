import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <router-outlet />
    <br />
    <a [routerLink]="['nah']">Not project</a>
    <br />
    <a [routerLink]="['parent/alpha/child']">Alpha</a>
    <br />
    <a [routerLink]="['parent/beta/child']">Beta</a>
  `,
})
export class AppComponent {
}
