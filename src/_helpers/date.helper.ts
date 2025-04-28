import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type Period = [Date, Date];

export const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);

  return date.toLocaleString('en-US', { month: 'long' });
};

export const getLastWeekPeriod = (): Period => {
  const currentDate = new Date();

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const offset = startOfCurrentWeek.getTimezoneOffset();
  startOfCurrentWeek.setMinutes(startOfCurrentWeek.getMinutes() - offset);

  const startDate = startOfCurrentWeek;
  const endDate = endOfWeek(startOfCurrentWeek, { weekStartsOn: 1 });
  endDate.setHours(23, 59, 59, 999);
  endDate.setMinutes(endDate.getMinutes() - offset);

  return [startDate, endDate];
};

export const getLastMonthPeriod = (): Period => {
  const currentDate = new Date();

  const startOfCurrentMonth = startOfMonth(currentDate);
  startOfCurrentMonth.setHours(0, 0, 0, 0);

  const offset = startOfCurrentMonth.getTimezoneOffset();
  startOfCurrentMonth.setMinutes(startOfCurrentMonth.getMinutes() - offset);

  const endOfCurrentMonth = endOfMonth(currentDate);
  endOfCurrentMonth.setHours(23, 59, 59, 999);
  endOfCurrentMonth.setMinutes(endOfCurrentMonth.getMinutes() - offset);

  return [startOfCurrentMonth, endOfCurrentMonth];
};
