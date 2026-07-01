import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Downloads invoice PDFs (per booking or consolidated per trip). */
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/invoices`;

  downloadForBooking(bookingId: string, reference: string): void {
    this.fetch(`${this.base}/booking/${bookingId}`, `fattura-${reference}.pdf`);
  }

  downloadForTrip(tripGroupId: string): void {
    this.fetch(`${this.base}/trip/${tripGroupId}`, `fattura-viaggio.pdf`);
  }

  private fetch(url: string, filename: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    });
  }
}
