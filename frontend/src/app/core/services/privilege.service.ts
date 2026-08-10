import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Privilege } from '../models/mt-urbac.models';

@Injectable({
  providedIn: 'root'
})
export class PrivilegeService {
  private readonly apiUrl = 'http://localhost:3000/privileges';

  constructor(private http: HttpClient) {}

  public getPrivileges(): Observable<Privilege[]> {
    return this.http.get<Privilege[]>(this.apiUrl);
  }

  public getPrivilegeById(uid: string): Observable<Privilege> {
    return this.http.get<Privilege>(`${this.apiUrl}/${uid}`);
  }

  public createPrivilege(privilegeData: Partial<Privilege>): Observable<Privilege> {
    return this.http.post<Privilege>(this.apiUrl, privilegeData);
  }

  public updatePrivilege(uid: string, privilegeData: Partial<Privilege>): Observable<Privilege> {
    return this.http.patch<Privilege>(`${this.apiUrl}/${uid}`, privilegeData);
  }

  public deletePrivilege(uid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uid}`);
  }
}
