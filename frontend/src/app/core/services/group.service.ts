import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group } from '../models/mt-urbac.models';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = 'http://localhost:3000/groups';

  constructor(private http: HttpClient) {}

  public getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl);
  }

  public getGroupById(uid: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${uid}`);
  }

  public createGroup(groupData: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, groupData);
  }

  public updateGroup(uid: string, groupData: Partial<Group>): Observable<Group> {
    return this.http.patch<Group>(`${this.apiUrl}/${uid}`, groupData);
  }

  public deleteGroup(uid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uid}`);
  }

  public assignRolesToGroup(groupUid: string, roleUids: string[]): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${groupUid}/roles`, { roleUids });
  }
}
