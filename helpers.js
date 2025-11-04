// Funciones helper
 export function generateAvailableDates() {
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push({
      id: date.toISOString().split('T')[0],
      title: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    });
  }
  return dates;
}

export function generateAvailableTimes() {
  return [
    { id: "09:00", title: "9:00 AM", enabled: true },
    { id: "09:30", title: "9:30 AM", enabled: true },
    { id: "10:00", title: "10:00 AM", enabled: true },
    { id: "10:30", title: "10:30 AM", enabled: false },
    { id: "11:00", title: "11:00 AM", enabled: true }
  ];
}

export function saveAppointment(data) {
  // Aquí guardas en tu base de datos
  const appointmentId = 'APT_' + Date.now();
  console.log('📝 Appointment guardado:', appointmentId, data);
  return appointmentId;
}