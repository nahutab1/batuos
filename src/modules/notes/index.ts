import { container, createToken, registerModule } from '@/core';
import { NoteService } from './service';

export const NOTE_SERVICE = createToken<NoteService>('NoteService');

export function initNoteModule() {
  container.registerFactory(NOTE_SERVICE, () => new NoteService());
}

registerModule({
  name: 'notes',
  initialize: initNoteModule,
});

export type { Note, CreateNoteDTO, UpdateNoteDTO } from './types';
export { NoteService } from './service';
