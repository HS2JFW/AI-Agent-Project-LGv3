export function calculateNextTimerSeconds(params: any): number {
  const mode = params.timerMode || 'interval';
  const now = new Date();
  
  if (mode === 'calendarSpecific') {
    const dates = params.calendarSpecificDates || [];
    let minDiff = Infinity;
    for (const dtStr of dates) {
      const dt = new Date(dtStr);
      if (!isNaN(dt.getTime())) {
        const diffSecs = Math.floor((dt.getTime() - now.getTime()) / 1000);
        if (diffSecs > 0 && diffSecs < minDiff) {
          minDiff = diffSecs;
        }
      }
    }
    return minDiff !== Infinity ? minDiff : 86400; // default 1 day if no valid future dates
  }
  
  if (mode === 'calendarPattern') {
    const pType = params.calendarPatternType || 'daily';
    let minDiff = Infinity;
    
    if (pType === 'daily') {
      const times = params.calendarPatternDailyTimes || (params.calendarPatternDailyTime ? [params.calendarPatternDailyTime] : ['09:00']);
      
      for (const time of times) {
        const [h, m] = time.split(':').map(Number);
        const target = new Date(now);
        target.setHours(h, m, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        const diffSecs = Math.floor((target.getTime() - now.getTime()) / 1000);
        if (diffSecs > 0 && diffSecs < minDiff) minDiff = diffSecs;
      }
    } else if (pType === 'weekly') {
      const rows = params.calendarPatternWeeklyRows || [];
      const daysMap: Record<string, number> = { 'Sunday':0, 'Monday':1, 'Tuesday':2, 'Wednesday':3, 'Thursday':4, 'Friday':5, 'Saturday':6 };
      for (const row of rows) {
        const targetDay = daysMap[row.day];
        if (targetDay === undefined) continue;
        const [h, m] = (row.time || '09:00').split(':').map(Number);
        const target = new Date(now);
        target.setHours(h, m, 0, 0);
        const dayDiff = (targetDay - now.getDay() + 7) % 7;
        target.setDate(target.getDate() + dayDiff);
        if (target <= now || (dayDiff === 0 && target <= now)) {
          target.setDate(target.getDate() + 7);
        }
        const diffSecs = Math.floor((target.getTime() - now.getTime()) / 1000);
        if (diffSecs > 0 && diffSecs < minDiff) minDiff = diffSecs;
      }
    } else if (pType === 'monthly') {
      const rows = params.calendarPatternMonthlyRows || [];
      for (const row of rows) {
        let targetDay = Number(row.day) || 1;
        const [h, m] = (row.time || '09:00').split(':').map(Number);
        const target = new Date(now);
        target.setHours(h, m, 0, 0);
        
        // Handle max days in month
        const maxDays = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(targetDay, maxDays));
        
        if (target <= now) {
          target.setMonth(target.getMonth() + 1);
          // Recalculate max days for next month
          const nextMaxDays = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
          target.setDate(Math.min(targetDay, nextMaxDays));
        }
        
        const diffSecs = Math.floor((target.getTime() - now.getTime()) / 1000);
        if (diffSecs > 0 && diffSecs < minDiff) minDiff = diffSecs;
      }
    }
    return minDiff !== Infinity ? minDiff : 86400;
  }
  
  // Default interval
  const val = Number(params.intervalValue) || 10;
  const unit = params.intervalUnit || 'seconds';
  let multiplier = 1;
  if (unit === 'seconds') multiplier = 1;
  else if (unit === 'minutes') multiplier = 60;
  else if (unit === 'hours') multiplier = 3600;
  else if (unit === 'days') multiplier = 86400;
  return val * multiplier;
}
