// Logic to convert between Solar and Lunar calendars.
// This is a complex topic, and this implementation is a simplified version based on common algorithms.
// For production use, a well-tested library is recommended.

// Data for Lunar calendar calculations (from 1900 to 2099)
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  // Continue data for more years if needed
];

function getLeapMonth(year: number) {
  return lunarInfo[year - 1900] & 0xf;
}

function getLeapMonthDays(year: number) {
  if (getLeapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function getMonthDays(year: number, month: number) {
  return (lunarInfo[year - 1900] & (0x8000 >> month)) ? 30 : 29;
}

function getYearDays(year: number) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (lunarInfo[year - 1900] & i) sum += 1;
  }
  return sum + getLeapMonthDays(year);
}

const MS_PER_DAY = 86400000;

export function solarToLunar(solarYear: number, solarMonth: number, solarDay: number): { day: number, month: number, year: number, isLeap: boolean } {
  let i;
  let temp = 0;
  let lunarYear, lunarMonth, lunarDay;
  let isLeap = false;
  
  const baseDate = Date.UTC(1900, 0, 31);
  const solarDate = Date.UTC(solarYear, solarMonth - 1, solarDay);
  let offset = (solarDate - baseDate) / MS_PER_DAY;

  for (i = 1900; i < 2100 && offset > 0; i++) {
    temp = getYearDays(i);
    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    i--;
  }

  lunarYear = i;
  let leap = getLeapMonth(i);

  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i;
      isLeap = true;
      temp = getLeapMonthDays(lunarYear);
    } else {
      temp = getMonthDays(lunarYear, i);
    }

    if (isLeap && i === (leap + 1)) isLeap = false;

    offset -= temp;
  }

  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }

  if (offset < 0) {
    offset += temp;
    --i;
  }

  lunarMonth = i;
  lunarDay = Math.floor(offset) + 1;

  return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap };
}

export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean): number[] {
    let leapMonth = getLeapMonth(lunarYear);
    let days = 0;

    for (let i = 1900; i < lunarYear; i++) {
        days += getYearDays(i);
    }

    for (let i = 1; i < lunarMonth; i++) {
        days += getMonthDays(lunarYear, i);
    }

    if (leapMonth < lunarMonth && leapMonth !== 0) {
        days += getLeapMonthDays(lunarYear);
    }

    if (isLeapMonth && leapMonth === lunarMonth) {
        days += getMonthDays(lunarYear, lunarMonth);
    }
    
    days += lunarDay - 1;

    const baseTimestamp = Date.UTC(1900, 0, 31);
    const targetTimestamp = baseTimestamp + days * MS_PER_DAY;
    const targetDate = new Date(targetTimestamp);
    
    return [targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, targetDate.getUTCDate()];
}