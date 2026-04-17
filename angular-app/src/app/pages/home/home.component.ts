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
  protected readonly stats = [
    { num: '10+', label: 'helpers' },
    { num: '35+', label: 'locators' },
    { num: '50+', label: 'actions' },
    { num: '40+', label: 'assertions' },
  ] as const;

  /** Visual accent per card (maps to `.feature--{accent}` in SCSS). */
  protected readonly featureAccents = ['sky', 'violet', 'emerald', 'amber', 'rose', 'slate'] as const;

  protected readonly features = [
    {
      title: 'Products',
      tag: 'Catalog',
      description: 'Async loading, filters, and sorting.',
      route: '/products',
      testid: 'feature-products',
    },
    {
      title: 'Form demo',
      tag: 'Input',
      description: 'Reactive forms, drag-drop, uploads, validation.',
      route: '/form-demo',
      testid: 'feature-form',
    },
    {
      title: 'Async demo',
      tag: 'Timing',
      description: 'Tables, slow APIs, background jobs.',
      route: '/async-demo',
      testid: 'feature-async',
    },
    {
      title: 'Counter',
      tag: 'A11y',
      description: 'Live regions, keyboard-friendly controls.',
      route: '/counter-demo',
      testid: 'feature-counter',
    },
    {
      title: 'Animation',
      tag: 'Motion',
      description: 'CSS transitions and completion signals.',
      route: '/animation-demo',
      testid: 'feature-animation',
    },
    {
      title: 'About',
      tag: 'Overview',
      description: 'What pw-craft is and why it exists.',
      route: '/about',
      testid: 'feature-about',
    },
  ] as const;
}
