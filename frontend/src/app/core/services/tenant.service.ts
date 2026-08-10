import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly apiUrl = 'http://localhost:3000/api/tenants';

  constructor(private http: HttpClient) {}

  getTenants(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTenantBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/slug/${slug}`);
  }

  createTenant(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateTenant(uid: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${uid}`, data);
  }

  deleteTenant(uid: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${uid}`);
  }
}
