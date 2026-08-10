import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/mt-urbac.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  public getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  public getUserById(uid: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${uid}`);
  }

  public createUser(userData: Partial<User> & { password?: string }): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  public updateUser(uid: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${uid}`, userData);
  }

  public deleteUser(uid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uid}`);
  }

  public assignGroups(userUid: string, payload: { groupUids: string[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userUid}/groups`, payload);
  }
}
