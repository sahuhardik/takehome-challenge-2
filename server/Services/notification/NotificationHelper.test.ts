import { TimeZone } from '@common/enums';
import { Test } from '@nestjs/testing';
import { NotificationHelper } from './NotificationHelper';
import moment = require('moment-timezone');

describe('Notification Helper', () => {
  let service: NotificationHelper = null;
  let date: Date;
  let start, stop, window;
  const timeZone = TimeZone.US_CENTRAL;
  const now = moment.tz('2020-04-01T11:45:57', timeZone).toISOString();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [NotificationHelper],
    }).compile();

    date = moment.tz('2020-04-01', timeZone).toDate();
    start = '07:30';
    stop = '20:00';

    service = moduleRef.get(NotificationHelper);
    window = service.getNotificationWindowForDate(date, { start, stop }, timeZone);
  });

  it('reproduce bug', () => {
    const now = moment('2020-02-03T16:00:00', TimeZone.US_PACIFIC).toDate();

    const window = service.getNotificationWindowForDate(now, { start: '07:30', stop: '21:30' }, TimeZone.US_PACIFIC);

    expect(service.getScheduledTimestampFromNotificationWindow(now, window.start, window.stop)).toBe(now);
  });

  it('Should get notification window from provided date', () => {
    expect(window.start.toISOString()).toBe(moment.tz('2020-04-01T07:30:00', timeZone).toISOString());

    expect(window.stop.toISOString()).toBe(moment.tz('2020-04-01T20:00:59', timeZone).toISOString());
  });

  it('Should return the same date since it is between the given time window', () => {
    expect(
      service.getScheduledTimestampFromNotificationWindow(new Date(now), window.start, window.stop).toISOString()
    ).toBe(now);
  });

  it('Should return the start of the time window (same day) since it is before the within the given time window', () => {
    const now = moment.tz('2020-04-01T6:23:37', timeZone).toISOString();
    expect(
      service.getScheduledTimestampFromNotificationWindow(new Date(now), window.start, window.stop).toISOString()
    ).toBe(window.start.toISOString());
  });

  it('Should return the start of the time window (next day) since it is after the within the given time window', () => {
    const now = moment.tz('2020-04-01T23:47:18', timeZone).toISOString();
    expect(
      service.getScheduledTimestampFromNotificationWindow(new Date(now), window.start, window.stop).toISOString()
    ).toBe(moment(window.start).add({ days: 1 }).toISOString());
  });
  it('Should return the same date since it is the same as the start of the time window', () => {
    const now = moment.tz('2020-04-01T07:30', timeZone).toISOString();
    expect(
      service.getScheduledTimestampFromNotificationWindow(new Date(now), window.start, window.stop).toISOString()
    ).toBe(now);
  });
  it('Should return the same date since it is the same as the end of the time window', () => {
    const now = moment.tz('2020-04-01T20:00:59', timeZone).toISOString();
    expect(
      service.getScheduledTimestampFromNotificationWindow(new Date(now), window.start, window.stop).toISOString()
    ).toBe(now);
  });
});
