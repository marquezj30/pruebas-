// Calcula el cobro: hora completa o fracción (mínimo 1), cada 24 h se cobra un día
// y las horas sueltas nunca cuestan más que un día.
const calculateFee = (minutes, hourlyPrice, dailyPrice) => {
  const hourly = Number(hourlyPrice);
  const daily = Number(dailyPrice);

  const hoursCharged = Math.max(1, Math.ceil(minutes / 60));
  const days = Math.floor(hoursCharged / 24);
  const extraHours = hoursCharged % 24;
  const amount = days * daily + Math.min(extraHours * hourly, daily);

  return {
    minutes,
    hours_charged: hoursCharged,
    days,
    extra_hours: extraHours,
    amount: Math.round(amount * 100) / 100,
  };
};

module.exports = { calculateFee };
