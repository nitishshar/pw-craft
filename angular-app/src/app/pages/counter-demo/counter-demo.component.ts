import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-counter-demo',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './counter-demo.component.html',
  styleUrl: './counter-demo.component.scss',
})
export class CounterDemoComponent {
  protected readonly count = signal(0);
  protected step = 1;

  protected increment(): void {
    this.count.update((c) => c + this.step);
  }

  protected decrement(): void {
    this.count.update((c) => c - this.step);
  }

  protected reset(): void {
    this.count.set(0);
  }
}
