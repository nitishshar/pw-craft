import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatTooltipModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './form-demo.component.html',
  styleUrl: './form-demo.component.scss',
})
export class FormDemoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly form = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    message: [''],
    category: ['General', [Validators.required]],
    newsletter: [false],
    terms: [false, [Validators.requiredTrue]],
    shipping: ['standard', [Validators.required]],
  });

  protected readonly fileName = signal('');
  protected readonly showSuccess = signal(false);

  protected pendingDragItems = ['Drag item A', 'Drag item B', 'Drag item C'];
  protected droppedDragItems: string[] = [];

  private successTimer: number | undefined;

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileName.set(file?.name ?? '');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.showSuccess.set(true);
    window.clearTimeout(this.successTimer);
    this.successTimer = window.setTimeout(() => this.showSuccess.set(false), 4000);
  }

  protected drop(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.cdr.detectChanges();
      return;
    }
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();
  }

  /** Test hook: moves the first pending item into the drop list without relying on browser drag simulation. */
  protected simulateDropFirstItem(): void {
    if (!this.pendingDragItems.length) return;
    const [first] = this.pendingDragItems.splice(0, 1);
    this.droppedDragItems.push(first);
    this.cdr.detectChanges();
  }
}
