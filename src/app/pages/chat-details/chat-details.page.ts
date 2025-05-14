import {
    ApplicationRef,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild, ViewChildren
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonModal,
    IonButton,
    IonIcon,
    IonChip,
    IonProgressBar,
    IonFooter,
    IonTextarea,
    IonBadge,
    ActionSheetButton,
    ActionSheetController,
    LoadingController,
    AlertController,
    ModalController
} from '@ionic/angular/standalone';
import {EventItem} from 'src/app/core/models/event-item.model';
import {UserEventStatusEnum} from 'src/app/core/models/type/user-event-status-enum.models';
import {User} from 'src/app/core/models/user.models';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ChatService} from 'src/app/core/services/chat.service';
import {SharedService} from 'src/app/core/services/shared.service';
import {UserAvatar} from 'src/app/core/models/user-avatar.model';
import {addIcons} from 'ionicons';
import {chevronBack, close, ellipse, send, ellipsisHorizontal} from 'ionicons/icons';
import {UserAuthService} from 'src/app/auth/user-auth.service';
import {AvatarModule} from 'ngx-avatars';
import {combineLatest, debounce, debounceTime, filter, Subscription, take, tap} from 'rxjs';
import {EventApiService} from 'src/app/core/rest/event-api.service';
import {TimeAgoPipe} from "../../pipes/time-ago.pipe";
import {ChatMessage, UpdateChatLastRead} from 'src/app/core/models/chat/chat-message.model';
import {Keyboard, KeyboardResize} from '@capacitor/keyboard';
import {Capacitor, PluginListenerHandle} from '@capacitor/core';
import {DateTime} from 'luxon';
import {ChatApiService} from 'src/app/core/rest/chat-api.service';
import {UserEventAvatar} from 'src/app/core/models/user-event-avatar.model';
import {BlockService} from 'src/app/core/rest/block.service';
import {KickOutUserComponent} from 'src/app/shared/kick-out-user/kick-out-user.component';
import {ReportUserComponent} from 'src/app/shared/report-user/report-user.component';
import {KickReasons, ReportReasons} from 'src/app/core/models/block.model';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
    selector: 'app-chat-details',
    templateUrl: './chat-details.page.html',
    styleUrls: ['./chat-details.page.scss'],
    standalone: true,
    imports: [IonBadge, IonTextarea, IonFooter, IonProgressBar, IonChip, IonIcon, IonButton, IonModal, IonBackButton, IonButtons, IonContent, IonHeader,
        AvatarModule, RouterLink,
        IonTitle, IonToolbar, CommonModule, FormsModule, TimeAgoPipe]
})
export class ChatDetailsPage implements OnInit, OnDestroy {

    @ViewChild(IonContent) content!: IonContent;
    public messages: ChatMessage[] = [];
    public messageToBeSend = '';
    public isSendingMessage = false;
    private eventId!: string;

    event!: EventItem;
    isLoading = true;
    chatInitialized = false;
    selfUser!: User;
    @ViewChild(IonTextarea) textArea!: IonTextarea;
    paddingBottom = 0;
    isKeyboardVisible = false;
    showKeyBoardListener!: PluginListenerHandle;
    hideKeyBoardListener!: PluginListenerHandle;
    kickReasons: KickReasons[] = [];
    reportReasons: ReportReasons[] = [];
    isReasonsLoading = true;

    acceptedParticipants: any;

    constructor(private router: Router, private cdr: ChangeDetectorRef,
                private eventApiService: EventApiService,
                private route: ActivatedRoute, private blockService: BlockService,
                private actionSheetCtrl: ActionSheetController,
                private loadingCtrl: LoadingController,
                private alertCtrl: AlertController,
                private toast: ToastService,
                private changeDetectorRef: ChangeDetectorRef,
                private modalCtrl: ModalController,
                private chatApiService: ChatApiService,
                private userAuthService: UserAuthService,
                public sharedService: SharedService,
                public chatService: ChatService,) {
        addIcons({chevronBack, ellipse, ellipsisHorizontal, send, close});
    }


    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')
        if (id) {
            this.eventId = id;
        }
        this.selfUser = this.userAuthService.currentUser();

        const nav = this.router.getCurrentNavigation();
        const state: any = nav?.extras.state;
        if (state && state.event) {
            this.initEvent(state.event);
        } else {
            this.fetchEvent();
        }
        if (Capacitor.isNativePlatform()) {
            try {
                await Keyboard.setResizeMode({mode: KeyboardResize.None});
            } catch (error) {

            }
            this.showKeyBoardListener = await Keyboard.addListener('keyboardWillShow', info => {
                console.log('keyboard will show with height:', info.keyboardHeight);
                if (Capacitor.getPlatform() === 'ios') {
                    this.paddingBottom = info.keyboardHeight;
                    this.isKeyboardVisible = true;
                }
					this.content.scrollToBottom(100);
                    // window.dispatchEvent(new Event('resize'));
            });

            this.hideKeyBoardListener = await Keyboard.addListener('keyboardWillHide', () => {
                this.isKeyboardVisible = false;
                setTimeout(() => {
                    // window.dispatchEvent(new Event('resize'));
                }, 500);
            });
        }

    }

    fetchEvent() {
        this.eventApiService
            .getEvent(this.eventId)
            .pipe(take(1))
            .subscribe(async event => {
                this.initEvent(event);
            });
    }

    initEvent(event: EventItem) {
        console.log("[ChatDetailsPage] Joining chat for the event: " + this.event);
        this.isLoading = false;
        this.event = event;
        this.eventId = this.event.eventId;
        this.acceptedParticipants = this.sharedService.getAcceptedParticipants(event);
        this.chatInitialized = false;
        if (this.chatService.getChatRoom(this.eventId)) {
            this.initChat();
        }
        this.listenJoinChatRoom();

        // Fetch kick / report reasons
        if (this.selfUser.userId === this.event.owner.userId) {
            combineLatest([this.blockService.getKickReasons(), this.blockService.getReportReasons()])
                .subscribe(([kickReasons, reportReasons]) => {
                    this.kickReasons = kickReasons;
                    this.reportReasons = reportReasons;
                    this.isReasonsLoading = false;
                    console.log(this.kickReasons);
                })
        } else {
            this.blockService.getReportReasons().subscribe(reportReasons => {
                this.reportReasons = reportReasons;
                this.isReasonsLoading = false;
                console.log(this.reportReasons);
            })
        }
    }

    private initChat() {
        this.chatService.setActiveChatRoom(this.event.eventId);
        this.chatService.resetUnreadCount(this.event.eventId);
        this.messages = this.chatService.getMessages(this.event.eventId);
        this.chatInitialized = true
        this.setLastTimeRead();
        this.chatService.messageReceived$
            .pipe(filter(eventId => eventId === this.eventId))
            .subscribe(() => this.content.scrollToBottom());

        this.chatService.initChat$
            .subscribe((eventId: string) => {
                if (eventId === this.eventId) {
                    console.log(`[ChatDetailsPage] Chat initialized successfully`);
                    this.chatInitialized = true
                } else {
                    console.log(`[ChatDetailsPage] WARN: unexpected chat initialized`);
                }
            });
        this.refreshViewAndScrollToBottom();
    }

    /**
     * ===============
     * CHAT FUNCTIONS
     * ================
     */
    listenJoinChatRoom() {
        this.chatService.status$
            .pipe(
                filter(joinedId => joinedId === this.eventId || joinedId === "ALL")
            ).subscribe(connected => {
                if (!this.chatInitialized) {
                    console.log(`[ChatDetailsPage] status$ → connected=${connected}`);
                    this.initChat();
                } else {
                    console.log(`[ChatDetailsPage] WARN: trying to re-instantiate a chat`);
                }
        });
    }

    public sendGroupMessage(): void {
        if (this.isSendingMessage || !this.messageToBeSend.trim()) {
            console.log('[ChatDetailsPage] send aborted: isSending or empty message');
            return;
        }
        this.isSendingMessage = true;
        console.log(`[ChatDetailsPage] Sending message: ${this.messageToBeSend}`);
        this.chatService.sendGroupMessage(this.eventId, this.messageToBeSend.trim());
        this.messageToBeSend = '';
        this.isSendingMessage = false;
        if (Capacitor.isNativePlatform()) {
            Keyboard.hide();
        }
        this.refreshViewAndScrollToBottom();
    }

    isOnline(userAvatar: UserAvatar) {
        return this.chatService.isOnline(userAvatar);
    }

    private setLastTimeRead() {
        this.chatService.updateChatLastRead(this.eventId);
    }
    /**
     * ==================
     * END CHAT FUNCTIONS
     * ==================
     */

    /**
     * ====================
     * KICK / REPORT USER
     * ====================
     */
    async onOpenActionSheet(participant: UserEventAvatar) {
        const actionSheetButtons: ActionSheetButton[] = [];
        if (this.selfUser.userId === this.event.owner.userId) {
            actionSheetButtons.push(
                {
                    text: 'Kick Out',
                    handler: () => {
                        this.kickOutUser(participant.userAvatar, this.event);
                    }
                }
            )
        }
        actionSheetButtons.push({
            text: 'Block',
            handler: () => {
                this.blockUser(participant.userAvatar);
            },
        });

        if (this.selfUser.userId !== this.event.owner.userId) {
            actionSheetButtons.push({
                text: 'Report',
                handler: () => {
                    this.reportUser(participant.userAvatar, this.event);
                }
            })
        }

        console.log(actionSheetButtons);

        const actionSheet = await this.actionSheetCtrl.create({
            header: 'Actions',
            buttons: actionSheetButtons
        });
        await actionSheet.present();
    }

    async kickOutUser(user: UserAvatar, event: EventItem) {
        const modal = await this.modalCtrl.create({
            component: KickOutUserComponent,
            componentProps: {
                user,
                eventId: event.eventId,
                reasons: this.kickReasons
            },
            initialBreakpoint: 1,
            breakpoints: [0, 1],
            cssClass: 'filter-modal'
        });
        await modal.present();
        modal.onDidDismiss().then(res => {
            console.log(res);
            if (res.data && res.data.success) {
            }
        })
    }

    async reportUser(user: UserAvatar, event: EventItem) {
        const modal = await this.modalCtrl.create({
            component: ReportUserComponent,
            componentProps: {
                user,
                eventId: event.eventId,
                reasons: this.reportReasons
            },
            initialBreakpoint: 1,
            breakpoints: [0, 1],
            cssClass: 'filter-modal'
        });
        await modal.present();
        modal.onDidDismiss().then(res => {
            console.log(res);
            if (res.data && res.data.success) {

            }
        })
    }

    async onBlockUser(user: UserAvatar) {
        const loader = await this.loadingCtrl.create({backdropDismiss: false});
        await loader.present();
        this.blockService.blockUser(user.userId).subscribe(async res => {
            await loader.dismiss();
            this.toast.show(`${user.firstName} has been blocked`);
        }, async err => {
            await loader.dismiss();
            this.toast.show(`Failed to block ${user.firstName}`, 'Error', 'danger');
        })
    }

    async blockUser(user: UserAvatar) {
        const alert = await this.alertCtrl.create({
            header: 'Block',
            message: `Are you sure you want to block ${user.firstName}?`,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Confirm',
                    handler: () => {
                        this.onBlockUser(user);
                    }
                }
            ]
        });
        await alert.present();
    }
    /**
     * ====================
     * END KICK / REPORT USER
     * ====================
     */

    ngOnDestroy(): void {
        console.log('[ChatDetailsPage] ngOnDestroy');
        this.setLastTimeRead();
        if (Capacitor.isNativePlatform()) {
            this.showKeyBoardListener.remove();
            this.hideKeyBoardListener.remove();
            if (Capacitor.getPlatform() === 'ios') {
                Keyboard.setResizeMode({
                    mode: KeyboardResize.Native
                })
            }
        }
    }

    /**
     * =============
     *  UI FUNCTIONS
     * =============
     */
    private refreshViewAndScrollToBottom() {
        this.changeDetectorRef.detectChanges();
        setTimeout(() => {
            this.content.scrollToBottom();
        }, 200);
    }

    onFocusTextArea() {
        setTimeout(() => {
            console.log('focus');
            const footerEl = document.querySelector('ion-footer') as HTMLElement;
            const contentEl = document.querySelector('ion-content') as HTMLElement;

            if (footerEl) {
                footerEl.scrollIntoView({behavior: 'smooth', block: 'end', inline: 'nearest'});
            }

            // This triggers Ionic to re-measure layout
            window.dispatchEvent(new Event('resize'));
        }, 300);
    }
}
