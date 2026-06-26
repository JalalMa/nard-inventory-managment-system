import { fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it('adds a notification with the correct type', () => {
    service.success('Saved');
    const list = service.notifications();
    expect(list.length).toBe(1);
    expect(list[0]).toEqual(jasmine.objectContaining({ type: 'success', message: 'Saved' }));
  });

  it('dismisses a notification by id', () => {
    service.error('Boom');
    const id = service.notifications()[0].id;
    service.dismiss(id);
    expect(service.notifications().length).toBe(0);
  });

  it('auto-dismisses after the timeout', fakeAsync(() => {
    service.info('Hi');
    expect(service.notifications().length).toBe(1);
    tick(4000);
    expect(service.notifications().length).toBe(0);
  }));
});
