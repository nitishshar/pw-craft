import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

type Category = 'all' | 'electronics' | 'accessories' | 'books';

interface Product {
  id: string;
  name: string;
  price: number;
  category: Exclude<Category, 'all'>;
  image: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, MatProgressSpinnerModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly allProducts = signal<Product[]>([]);

  protected category = signal<Category>('all');
  protected sort = signal<'name' | 'price'>('name');

  protected readonly filteredProducts = computed(() => {
    const cat = this.category();
    const s = this.sort();
    const items = this.allProducts().filter((p) => (cat === 'all' ? true : p.category === cat));
    return [...items].sort((a, b) => (s === 'name' ? a.name.localeCompare(b.name) : a.price - b.price));
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const c = (params.get('category') as Category | null) ?? 'all';
      const s = (params.get('sort') as 'name' | 'price' | null) ?? 'name';
      this.category.set(c === 'electronics' || c === 'accessories' || c === 'books' || c === 'all' ? c : 'all');
      this.sort.set(s === 'price' ? 'price' : 'name');
    });

    this.simulateLoad();
  }

  private simulateLoad(): void {
    this.loading.set(true);
    window.setTimeout(() => {
      this.allProducts.set([
        {
          id: '1',
          name: 'Noise canceller',
          price: 199,
          category: 'electronics',
          image: 'https://placehold.co/640x360/4f46e5/ffffff/png?text=Electronics+A',
        },
        {
          id: '2',
          name: 'Desk lamp',
          price: 49,
          category: 'accessories',
          image: 'https://placehold.co/640x360/0ea5e9/ffffff/png?text=Accessories+B',
        },
        {
          id: '3',
          name: 'Paperback guide',
          price: 18,
          category: 'books',
          image: 'https://placehold.co/640x360/22c55e/ffffff/png?text=Books+C',
        },
        {
          id: '4',
          name: 'USB hub',
          price: 39,
          category: 'electronics',
          image: 'https://placehold.co/640x360/f97316/ffffff/png?text=Electronics+D',
        },
      ]);
      this.loading.set(false);
    }, 800);
  }

  protected onCategoryChange(value: Category): void {
    this.category.set(value);
  }

  protected onSortChange(value: 'name' | 'price'): void {
    this.sort.set(value);
  }
}
