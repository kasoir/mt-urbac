import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../models/mt-urbac.models';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = 'http://localhost:3000/roles';

  constructor(private http: HttpClient) {}

  public getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  public getRoleById(uid: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${uid}`);
  }

  public createRole(roleData: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, roleData);
  }

  public updateRole(uid: string, roleData: Partial<Role>): Observable<Role> {
    return this.http.patch<Role>(`${this.apiUrl}/${uid}`, roleData);
  }

  public deleteRole(uid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uid}`);
  }

  public assignPrivilegesToRole(roleUid: string, privilegeUids: string[]): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/${roleUid}/privileges`, { privilegeUids });
  }
}
