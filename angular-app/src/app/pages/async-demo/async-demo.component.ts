import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-async-demo',
  standalone: true,
  imports: [MatButtonModule, MatTableModule, MatProgressBarModule, MatCardModule],
  templateUrl: './async-demo.component.html',
  styleUrl: './async-demo.component.scss',
})
export class AsyncDemoComponent {
  protected readonly showTable = signal(false);
  protected readonly showAsync = signal(false);
  protected readonly jobStatus = signal<'Idle' | 'Starting...' | 'Processing...' | 'Completed'>('Idle');

  protected readonly columns: string[] = ['name', 'role'];
  protected readonly rows = [
    { name: 'Asha', role: 'Engineer' },
    { name: 'Noor', role: 'Designer' },
  ];

  protected loadTable(): void {
    this.showTable.set(false);
    window.setTimeout(() => this.showTable.set(true), 2000);
  }

  protected slowApi(): void {
    this.showAsync.set(false);
    window.setTimeout(() => this.showAsync.set(true), 3500);
  }

  protected startJob(): void {
    this.jobStatus.set('Starting...');
    window.setTimeout(() => this.jobStatus.set('Processing...'), 700);
    window.setTimeout(() => this.jobStatus.set('Completed'), 1700);
  }
}
