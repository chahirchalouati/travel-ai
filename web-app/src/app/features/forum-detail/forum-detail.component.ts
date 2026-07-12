import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { ForumService } from '../../core/services/forum.service';
import { AuthService } from '../../core/services/auth.service';
import type { ForumQuestionDetail, ForumAnswerResponse } from '../../core/models/api.models';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { UiTextareaComponent } from '../../shared/ui/ui-textarea.component';

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TranslocoModule, RevealDirective, UiTextareaComponent],
  templateUrl: './forum-detail.component.html',
  styleUrl: './forum-detail.component.scss',
})
export class ForumDetailComponent implements OnInit {
  private readonly forum = inject(ForumService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly detail = signal<ForumQuestionDetail | null>(null);
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly submitting = signal(false);
  answerText = '';

  readonly answers = computed(() => this.detail()?.answers ?? []);

  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.router.navigate(['/forum']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.forum
      .get(this.id)
      .pipe(catchError(() => of(null)))
      .subscribe(d => {
        this.detail.set(d);
        this.loading.set(false);
      });
  }

  submitAnswer(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/forum', this.id], { queryParams: { auth: 'login' } });
      return;
    }
    if (!this.answerText.trim()) {
      return;
    }
    this.submitting.set(true);
    this.forum
      .answer(this.id, { body: this.answerText.trim() })
      .pipe(catchError(() => of(null)))
      .subscribe(created => {
        this.submitting.set(false);
        if (created) {
          this.answerText = '';
          this.load();
        }
      });
  }

  markHelpful(answer: ForumAnswerResponse): void {
    if (!this.isAuthenticated()) {
      return;
    }
    this.forum
      .markHelpful(answer.id)
      .pipe(catchError(() => of(null)))
      .subscribe(updated => {
        if (updated) {
          this.detail.update(d =>
            d
              ? { ...d, answers: d.answers.map(a => (a.id === updated.id ? updated : a)) }
              : d,
          );
        }
      });
  }

  back(): void {
    this.router.navigate(['/forum']);
  }
}
