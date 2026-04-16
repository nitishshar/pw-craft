import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-animation-demo',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './animation-demo.component.html',
  styleUrl: './animation-demo.component.scss',
})
export class AnimationDemoComponent {
  protected readonly moved = signal(false);
  protected readonly animationComplete = signal(false);
  protected readonly fadedIn = signal(true);

  private moveTimer: number | undefined;

  protected triggerMove(): void {
    window.clearTimeout(this.moveTimer);
    this.animationComplete.set(false);
    this.moved.set(true);
    this.moveTimer = window.setTimeout(() => this.animationComplete.set(true), 50);
  }

  protected toggleFade(): void {
    this.fadedIn.update((v) => !v);
  }
}
