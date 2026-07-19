import { m } from '$lib/paraglide/messages.js';
import type { DayOfWeek } from './types';

export function dayOfWeekToLocalizedString(day: DayOfWeek): string {
	switch (day) {
		case 'h':
			return m.monday();
		case 'k':
			return m.tuesday();
		case 's':
			return m.wednesday();
		case 'c':
			return m.thursday();
		case 'p':
			return m.friday();
	}
}

export function detailedTimeToLocalizedString(detailedTime: string): string {
	const [day, time, weekLabel, ...week] = detailedTime.split(' ');

	const localizedDay =
		day === 'Hétfo'
			? m.monday()
			: day === 'Kedd'
				? m.tuesday()
				: day === 'Szerda'
					? m.wednesday()
					: day === 'Csütörtök'
						? m.thursday()
						: m.friday();

	const localizedWeekLabel = m.weeks() + ':';

	return [localizedDay, time, localizedWeekLabel, ...week].join(' ');
}

export function courseTypeToLocalizedString(courseType: string) {
	switch (courseType) {
		case 'gyakorlat':
			return m.practice();
		case 'előadás':
			return m.lecture();
		case 'konzultáció':
			return m.consultation();
		case 'munka':
			return m.work();
		case 'egyéb':
			return m.other();
		default:
			return courseType;
	}
}
