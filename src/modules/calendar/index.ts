import { container, createToken, registerModule } from '@/core';
import { CalendarService } from './service';

export const CALENDAR_SERVICE = createToken<CalendarService>('CalendarService');

export function initCalendarModule() {
  container.registerFactory(CALENDAR_SERVICE, () => new CalendarService());
}

registerModule({
  name: 'calendar',
  initialize: initCalendarModule,
});

export type { Event, CreateEventDTO, UpdateEventDTO } from './types';
export { CalendarService } from './service';
