import { Pipe, PipeTransform } from '@angular/core';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from 'date-fns';

@Pipe({
	name: 'timeAgo',
	standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
	transform(value: Date | string): string {
		const date = new Date(value);
		const now = new Date();

		const seconds = differenceInSeconds(now, date);
		if (seconds < 60) return `Just now`;

		const minutes = differenceInMinutes(now, date);
		if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

		const hours = differenceInHours(now, date);
		if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

		const days = differenceInDays(now, date);
		if (days === 1) return `Yesterday`; // Special case for "Yesterday"
		if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

		const weeks = differenceInWeeks(now, date);
		if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

		const months = differenceInMonths(now, date);
		if (months === 0) {
			// Fix for "0 months ago" → Show weeks instead
			return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
		}
		if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
		const years = differenceInYears(now, date);
		return `${years} year${years > 1 ? 's' : ''} ago`;
	}
}
