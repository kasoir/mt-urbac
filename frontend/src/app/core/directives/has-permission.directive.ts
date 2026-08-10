import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ContextService } from '../services/context.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private requiredPermissions: string[] = [];
  private subscription?: Subscription;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private contextService: ContextService
  ) {}

  @Input() set hasPermission(val: string | string[]) {
    if (typeof val === 'string') {
      this.requiredPermissions = [val];
    } else if (Array.isArray(val)) {
      this.requiredPermissions = val;
    } else {
      this.requiredPermissions = [];
    }
    this.updateView();
  }

  ngOnInit(): void {
    this.subscription = this.contextService.privileges$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    if (this.requiredPermissions.length === 0) {
      this.showView();
      return;
    }

    const isAuthorized = this.requiredPermissions.some(permission => 
      this.contextService.hasPermission(permission)
    );

    if (isAuthorized && !this.hasView) {
      this.showView();
    } else if (!isAuthorized && this.hasView) {
      this.clearView();
    }
  }

  private showView(): void {
    this.viewContainer.createEmbeddedView(this.templateRef);
    this.hasView = true;
  }

  private clearView(): void {
    this.viewContainer.clear();
    this.hasView = false;
  }
}
