import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly features = [
    { title: 'Products', description: 'Async loading, filters, and sorting.', route: '/products', testid: 'feature-products' },
    { title: 'Form demo', description: 'Reactive forms, drag-drop, uploads, validation.', route: '/form-demo', testid: 'feature-form' },
    { title: 'Async demo', description: 'Tables, slow APIs, background jobs.', route: '/async-demo', testid: 'feature-async' },
    { title: 'Counter', description: 'Live regions, keyboard-friendly controls.', route: '/counter-demo', testid: 'feature-counter' },
    { title: 'Animation', description: 'CSS transitions and completion signals.', route: '/animation-demo', testid: 'feature-animation' },
    { title: 'About', description: 'What pw-craft is and why it exists.', route: '/about', testid: 'feature-about' },
  ] as const;
}
