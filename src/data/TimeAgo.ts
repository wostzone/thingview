// From: https://muffinman.io/blog/javascript-time-ago-function/

import { DateTime } from 'luxon';

// const MONTH_NAMES = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December'
// ];


// function getFormattedDate(date: Date, prefomattedDate = false, hideYear = false) {
//   const day = date.getDate();
//   const month = MONTH_NAMES[date.getMonth()];
//   const year = date.getFullYear();
//   const hours = date.getHours();
//   let minutes = date.getMinutes();

//   if (minutes < 10) {
//     // Adding leading zero to minutes
//     minutes = `0${minutes}`;
//   }

//   if (prefomattedDate) {
//     // Today at 10:20
//     // Yesterday at 10:20
//     return `${prefomattedDate} at ${hours}:${minutes}`;
//   }

//   if (hideYear) {
//     // 10. January at 10:20
//     return `${day}. ${month} at ${hours}:${minutes}`;
//   }

//   // 10. January 2017. at 10:20
//   return `${day}. ${month} ${year}. at ${hours}:${minutes}`;
// }

// --- Main function
export function timeAgo(datim: DateTime): string {
  let ago: string = ""
  if (!datim) {
    return "";
  }
  let delta = DateTime.now().diff(datim, ['days', 'hours', 'minutes', 'seconds'])
  if (delta.days > 1) {
    ago = `${delta.days} days ago`
  } else if (delta.days > 0) {
    ago = `${delta.days} day ago`
  } else if (delta.hours > 1) {
    ago = `${delta.hours} hours ago`
  } else if (delta.hours > 0) {
    ago = `${delta.hours} hour ago`
  } else if (delta.minutes > 1) {
    ago = `${delta.minutes} minutes ago`
  } else if (delta.minutes > 0) {
    ago = `${delta.minutes} minute ago`
  } else {
    ago = `${delta.seconds.toFixed()} seconds ago`
  }
  return ago

}