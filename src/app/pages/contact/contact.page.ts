import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonList, IonSelectOption, IonSelect, IonTextarea, IonText, IonButton, IonSpinner, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { ToastService } from 'src/app/core/services/toast.service';
import { ContactsFormApiService } from 'src/app/core/rest/contacts-form-api.service';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';

@Component({
	selector: 'app-contact',
	templateUrl: './contact.page.html',
	styleUrls: ['./contact.page.scss'],
	standalone: true,
	imports: [IonBackButton, IonButtons, IonSpinner, IonButton, IonText, IonList, IonItem, IonContent, IonHeader, IonTitle, IonToolbar,
		IonSelect, IonSelectOption, IonTextarea,
		CommonModule, FormsModule, ReactiveFormsModule]
})
export class ContactPage implements OnInit {

	submitted = false;
	isSubmitting = false;
	formData = new FormGroup({
		subject: new FormControl('General Support', [Validators.required]),
		message: new FormControl('', [Validators.required, Validators.minLength(2), this.noWhitespaceValidator()])
	});
	communicationTypes = ['General Support', 'Report User'];


	noWhitespaceValidator(): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			const value = control.value || '';
			console.log(value.trim().length);
			if (value.trim().length === 0) {
				return { whitespace: true };
			}
			return null;
		};
	}

	constructor(private contactsFormApiService: ContactsFormApiService,
		private toast: ToastService) {
		addIcons({ chevronBack });
	}

	ngOnInit() {
	}

	onSubmit() {
		this.isSubmitting = true;
		this.contactsFormApiService.submitContactsForm(this.formData.value)
			.subscribe(() => {
				this.isSubmitting = false;
				this.toast.show('Message sent successfully', 'Contacts & Support');
				this.submitted = true;
				this.formData.reset();
			})
	}

}
