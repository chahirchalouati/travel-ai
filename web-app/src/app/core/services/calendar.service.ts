import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Downloads booking calendar (.ics) files and triggers a browser save. */
@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);

  /** Fetches the .ics for a booking and triggers a download named after its reference. */
  downloadIcs(bookingId: string, reference?: string): Observable<Blob> {
    return this.http
      .get(`${environment.apiUrl}/bookings/${bookingId}/calendar.ics`, {
        responseType: 'blob',
      })
      .pipe(tap(blob => this.saveBlob(blob, `booking-${reference || bookingId}.ics`)));
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
