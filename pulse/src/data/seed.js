import { v4 as uuidv4 } from 'uuid';

/**
 * Generates ~14 days of realistic sample entries across all four types.
 * Timestamps are relative to the current date so charts always look fresh.
 */
function generateSeedData() {
  const entries = [];
  const now = new Date();

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // --- Food: 2–3 meals per day ---
    const meals = [
      { name: 'Oatmeal with berries', kcal: 350 },
      { name: 'Grilled chicken salad', kcal: 520 },
      { name: 'Salmon with rice', kcal: 680 },
      { name: 'Yogurt parfait', kcal: 280 },
      { name: 'Turkey sandwich', kcal: 450 },
      { name: 'Pasta with vegetables', kcal: 620 },
      { name: 'Eggs and toast', kcal: 380 },
      { name: 'Stir-fry tofu bowl', kcal: 490 },
      { name: 'Smoothie bowl', kcal: 310 },
      { name: 'Chicken wrap', kcal: 540 },
      { name: 'Lentil soup', kcal: 360 },
      { name: 'Avocado toast', kcal: 420 },
    ];
    const mealCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const mealTimes = [8, 12.5, 18.5]; // breakfast, lunch, dinner hours
    for (let m = 0; m < mealCount; m++) {
      const meal = meals[Math.floor(Math.random() * meals.length)];
      const hour = mealTimes[m] + (Math.random() * 0.5 - 0.25);
      entries.push({
        id: uuidv4(),
        type: 'food',
        timestamp: `${dateStr}T${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}:00.000Z`,
        value: meal.kcal + Math.floor(Math.random() * 60 - 30),
        unit: 'kcal',
        note: meal.name,
      });
    }

    // --- Water: 3–5 entries per day ---
    const waterCount = 3 + Math.floor(Math.random() * 3);
    const waterAmounts = [250, 250, 350, 500, 250];
    for (let w = 0; w < waterCount; w++) {
      const hour = 7 + w * 3 + Math.random() * 2;
      entries.push({
        id: uuidv4(),
        type: 'water',
        timestamp: `${dateStr}T${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}:00.000Z`,
        value: waterAmounts[w % waterAmounts.length],
        unit: 'ml',
        note: '',
      });
    }

    // --- Sleep: 1 entry per night ---
    const sleepHours = 5.5 + Math.random() * 3.5; // 5.5–9 hours
    entries.push({
      id: uuidv4(),
      type: 'sleep',
      timestamp: `${dateStr}T07:00:00.000Z`,
      value: parseFloat(sleepHours.toFixed(1)),
      unit: 'hours',
      note: '',
    });

    // --- Gym: ~3–4 days per week, 45–90 min ---
    if (Math.random() > 0.45) {
      const gymMinutes = 45 + Math.floor(Math.random() * 45);
      const gymHour = 17 + Math.random() * 2; // 5–7 PM
      entries.push({
        id: uuidv4(),
        type: 'gym',
        timestamp: `${dateStr}T${String(Math.floor(gymHour)).padStart(2, '0')}:${String(Math.floor((gymHour % 1) * 60)).padStart(2, '0')}:00.000Z`,
        value: gymMinutes,
        unit: 'minutes',
        note: '',
      });
    }
  }

  return entries;
}

export default generateSeedData;
