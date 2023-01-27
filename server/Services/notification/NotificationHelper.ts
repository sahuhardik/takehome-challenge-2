import { TimeZone } from '@common/enums';
import { NotificationWindow } from '@server/model/member.entity';
import moment from 'moment-timezone';

/**
 * For easier testing without TypeORM recursion issues (see Performable <> Task importing)
 */
export class NotificationHelper {
  getNotificationWindowForDate(date: Date, window: NotificationWindow, tz: TimeZone): { start: Date; stop: Date } {
    const dateStr = moment(date).tz(tz).format('YYYY-MM-DD');
    const start = moment.tz(dateStr + ' ' + window.start, tz).toDate();
    const stop = moment.tz(dateStr + ' ' + window.stop, tz).toDate();

    // Get up to the end of the last minute...
    stop.setSeconds(59);

    return { start, stop };
  }

  getScheduledTimestampFromNotificationWindow(date: Date, start: Date, stop: Date) {
    return moment(date).isBefore(start)
      ? start
      : moment(date).isAfter(stop)
      ? moment(start).add({ days: 1 }).toDate()
      : date;
  }
}
