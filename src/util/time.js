/* @flow */

// TODO this probably isn't super-robust, but it should work for common cases
let max = null;

// Guarantees uniqueness
export const timestamp = () => {
  const x = current_time();
  if (max === null || x > max) {
    max = x;
  } else {
    ++max;
  }
  return max;
};


export type Time = number;

export type Difference = {
  millisecond: number,
  second: number,
  minute: number,
  hour: number,
  day: number,
  week: number,
  year: number
};

export const millisecond = 1;
export const second      = 1000   * millisecond;
export const minute      = 60     * second;
export const hour        = 60     * minute;
export const day         = 24     * hour;
export const week        = 7      * day;
export const year        = 365.25 * day;


export const current_time = (): Time =>
  Date.now();

// TODO test this
export const to_local_time = (x: Time): Time =>
  x - (new Date(x).getTimezoneOffset() * minute);

export const round_to_second = (x: Time): Time => {
  const t = new Date(x);
  t.setMilliseconds(0);
  return +t;
};

export const round_to_minute = (x: Time): Time => {
  const t = new Date(x);
  t.setSeconds(0, 0);
  return +t;
};

export const round_to_hour = (x: Time): Time => {
  const t = new Date(x);
  t.setMinutes(0, 0, 0);
  return +t;
};

export const round_to_day = (x: Time): Time => {
  const t = new Date(x);
  t.setHours(0, 0, 0, 0);
  return +t;
};

export const round_to_month = (x: Time): Time => {
  const t = new Date(x);
  t.setDate(1);
  t.setHours(0, 0, 0, 0);
  return +t;
};

export const round_to_year = (x: Time): Time => {
  const t = new Date(x);
  t.setMonth(0, 1);
  t.setHours(0, 0, 0, 0);
  return +t;
};

// TODO test this
export const difference = (x: Time, y: Time): Difference => {
  let diff = Math.abs(y - x);

  const years = Math.floor(diff / year);
  diff -= (years * year);

  const weeks = Math.floor(diff / week);
  diff -= (weeks * week);

  const days = Math.floor(diff / day);
  diff -= (days * day);

  const hours = Math.floor(diff / hour);
  diff -= (hours * hour);

  const minutes = Math.floor(diff / minute);
  diff -= (minutes * minute);

  const seconds = Math.floor(diff / second);
  diff -= (seconds * second);

  return {
    millisecond: diff,
    second: seconds,
    minute: minutes,
    hour: hours,
    day: days,
    week: weeks,
    year: years
  }
};
