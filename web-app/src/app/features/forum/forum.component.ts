import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { ForumService } from '../../core/services/forum.service';
import { AuthService } from '../../core/services/auth.service';
import type { ForumQuestionResponse } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TranslocoModule, RevealDirective],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss',
})
export class ForumComponent implements OnInit {
  private readonly forum = inject(ForumService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly headerImg = HEADER_IMG;
  readonly questions = signal<ForumQuestionResponse[]>([]);
  readonly loading = signal(true);
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly showForm = signal(false);
  readonly submitting = signal(false);
  search = '';
  formTitle = '';
  formBody = '';
  formLocation = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.forum
      .list(this.search.trim() || undefined)
      .pipe(catchError(() => of([] as ForumQuestionResponse[])))
      .subscribe(list => {
        this.questions.set(list);
        this.loading.set(false);
      });
  }

  toggleForm(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/forum'], { queryParams: { auth: 'login' } });
      return;
    }
    this.showForm.update(v => !v);
  }

  submit(): void {
    if (!this.formTitle.trim() || !this.formBody.trim()) {
      return;
    }
    this.submitting.set(true);
    this.forum
      .ask({ title: this.formTitle.trim(), body: this.formBody.trim(), location: this.formLocation.trim() || null })
      .pipe(catchError(() => of(null)))
      .subscribe(created => {
        this.submitting.set(false);
        if (created) {
          this.showForm.set(false);
          this.formTitle = '';
          this.formBody = '';
          this.formLocation = '';
          this.router.navigate(['/forum', created.id]);
        }
      });
  }

  open(id: string): void {
    this.router.navigate(['/forum', id]);
  }
}
