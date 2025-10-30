export const dateHelpers = {
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatShortDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  },

  formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  },

  getTimeFromDate(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  isToday(date: string | Date): boolean {
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(date).toISOString().split('T')[0];
    return today === checkDate;
  },

  getDaysAgo(date: string | Date): number {
    const today = new Date();
    const checkDate = new Date(date);
    const diffTime = Math.abs(today.getTime() - checkDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  formatRelativeTime(date: string | Date): string {
    const daysAgo = this.getDaysAgo(date);
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return this.formatShortDate(date);
  },

  addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  },

  isFutureTime(date: string | Date): boolean {
    return new Date(date).getTime() > new Date().getTime();
  }
};