// From: https://muffinman.io/blog/javascript-time-ago-function/

// This module provides reactive functions to present the age of a timestamp.
// It uses vue3's ref to periodically update the computed age.
import { DateTime } from 'luxon';
import { ref } from 'vue';


// currentTime, updated periodically. Intended for live update of data age indicators. 
export const currentTime = ref(DateTime.now())
setInterval(() => {
  currentTime.value = DateTime.now()
}, 20000)


/** Determine the human readable time difference between an iso date and a DateTime date
 */
export function isoTimeAgo(isoTime: string, comparedTo?: DateTime): string {
  let fromTime = DateTime.fromISO(isoTime)
  return timeAgo(fromTime, comparedTo)
}

/** Computed reactive age of a timestamp.
 * This updates periodicially to provide the age in minutes, hours or days
 */
export function isoAge(isoTime: string): string {
  return isoTimeAgo(isoTime, currentTime.value)
}

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