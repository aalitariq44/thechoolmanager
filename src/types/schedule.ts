export interface Schedule {
  id: string;
  name: string;
  dailyLessons: number;
  workingDays: string[];
  classes: string[];
  schedules: { [className: string]: { [key: string]: string[] } };
  createdAt: string;
  isCurrent?: boolean;
}
