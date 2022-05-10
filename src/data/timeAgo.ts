// From: https://muffinman.io/blog/javascript-time-ago-function/

import { DateTime } from 'luxon';

// const MONTH_NAMES = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December'
// ];

/** Determine the human readable time difference between two dates
 * This returns the difference in either nr of days, hours or minutes.
 * If the difference exceeds 365 days, it returns n/a
 */
export function timeAgo(datim?: DateTime, comparedTo?: DateTime): string {
  let ago: string = ""
  if (!datim) {
    return "";
  }
  if (!comparedTo) {
    comparedTo = DateTime.now()
  }
  let delta = comparedTo.diff(datim, ['days', 'hours', 'minutes', 'seconds'])
  if (delta.days > 365) {
    ago = "n/a"
  } else if (delta.days > 1) {
    ago = `${delta.days} days ago`
  } else if (delta.days > 0) {
    ago = `${delta.days} day ago`
  } else if (delta.hours > 1) {
    ago = `${delta.hours} hours ago`
  } else if (delta.hours > 0) {
    ago = `${delta.hours} hour ago`
  } else if (delta.minutes == 1) {
    ago = `${delta.minutes} minute ago`
  } else {
    ago = `${delta.minutes} minutes ago`
  }
  return ago

}