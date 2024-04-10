import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DatePipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation, inject } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { lastValueFrom, takeUntil } from 'rxjs';
import { MessageInbox } from '../message.types';
import { InboxService } from '../inbox';
import { MessageService } from '../message/message.service';
import { GridData, ViewBaseComponent } from '@aurora';
import { TranslocoModule } from '@ngneat/transloco';

export const messageQuickViewMessages = 'message::QuickViewMessages';

@Component({
    selector       : 'au-message-quick-view',
    templateUrl    : './message-quick-view.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'messageQuickView',
    standalone     : true,
    imports        : [
        MatButtonModule, NgIf, MatIconModule, MatTooltipModule,
        NgFor, NgClass, NgTemplateOutlet, RouterLink, TranslocoModule, DatePipe,
    ],
})
export class MessageQuickViewComponent extends ViewBaseComponent
{
    actionScope: string = 'message::quickViewMessages';
    @ViewChild('messagesOrigin') private messagesOrigin: MatButton;
    @ViewChild('messagesPanel') private messagesPanel: TemplateRef<any>;

    inboxCustomerPagination: GridData<MessageInbox>;
    unreadCount: number = 0;

    private inboxService = inject(InboxService);
    private messageService = inject(MessageService);
    private overlayRef: OverlayRef;

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------
    get messages(): MessageInbox[]
    {
        return this.inboxCustomerPagination?.rows;
    }

    /**
     * Constructor
     */
    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private overlay: Overlay,
        private viewContainerRef: ViewContainerRef,
    )
    {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    async init(): Promise<void>
    {
        // Get the messages
        await lastValueFrom(
            this.inboxService
                .paginateCustomerQuickVewMessagesInbox({
                    query: {
                        limit : 10,
                        offset: 0,
                        order : [['sort', 'desc']],
                    },
                }),
        );

        // Subscribe to message changes
        this.inboxService
            .getScopePagination(messageQuickViewMessages)
            .pipe(takeUntil(this.unsubscribeAll$))
            .subscribe((inboxCustomerPagination: GridData<MessageInbox>) =>
            {
                // Load the messages
                this.inboxCustomerPagination = inboxCustomerPagination;

                // Calculate the unread count
                this.calculateUnreadCount();

                // Mark for check
                this.changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Dispose the overlay
        if (this.overlayRef)
        {
            this.overlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Open the messages panel
     */
    openPanel(): void
    {
        // Return if the messages panel or its origin is not defined
        if (!this.messagesPanel || !this.messagesOrigin)
        {
            return;
        }

        // Create the overlay if it doesn't exist
        if (!this.overlayRef)
        {
            this.createOverlay();
        }

        // Attach the portal to the overlay
        this.overlayRef.attach(new TemplatePortal(this.messagesPanel, this.viewContainerRef));
    }

    /**
     * Close the messages panel
     */
    closePanel(): void
    {
        this.overlayRef.detach();
    }

    /**
     * Mark all messages as read
     */
    goToMessageCenter(): void
    {
        this.router.navigate(['message', 'message-center']);
    }

    /**
     * Delete the given message
     */
    deleteMessage(message: MessageInbox): void
    {
        console.log('deleteMessage');
        // Delete the message
        // this.messagesService.delete(message.id).subscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create the overlay
     */
    private createOverlay(): void
    {
        // Create the overlay
        this.overlayRef = this.overlay.create({
            hasBackdrop     : true,
            backdropClass   : 'fuse-backdrop-on-mobile',
            scrollStrategy  : this.overlay.scrollStrategies.block(),
            positionStrategy: this.overlay.position()
                .flexibleConnectedTo(this.messagesOrigin._elementRef.nativeElement)
                .withLockedPosition(true)
                .withPush(true)
                .withPositions([
                    {
                        originX : 'start',
                        originY : 'bottom',
                        overlayX: 'start',
                        overlayY: 'top',
                    },
                    {
                        originX : 'start',
                        originY : 'top',
                        overlayX: 'start',
                        overlayY: 'bottom',
                    },
                    {
                        originX : 'end',
                        originY : 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                    },
                    {
                        originX : 'end',
                        originY : 'top',
                        overlayX: 'end',
                        overlayY: 'bottom',
                    },
                ]),
        });

        // Detach the overlay from the portal on backdrop click
        this.overlayRef.backdropClick().subscribe(() =>
        {
            this.overlayRef.detach();
        });
    }

    /**
     * Calculate the unread count
     *
     * @private
     */
    private calculateUnreadCount(): void
    {
        let count = 0;

        if (this.inboxCustomerPagination?.rows?.length)
        {
            count = this.inboxCustomerPagination.rows.filter(message => !message.isRead).length;
        }

        this.unreadCount = count;
    }
}
