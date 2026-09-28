import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { greeting } from '@lib/greeting';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <h1>Hello, {{ title() }}</h1>
    <p>{{ greeting }}</p>

    <router-outlet />
  `,
  styles: [],
})
export class App {
  protected readonly title = signal('issue-watcher');
  protected readonly greeting = greeting;
}
