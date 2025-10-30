export const formatTime12Hour = (timeString: string) => {
  if (!timeString) return "";

  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  } catch {
    return timeString;
  }
};
