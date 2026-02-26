// ===========================
// AstroCall — Client-side Astrology Utilities
// ===========================

// --- Zodiac Signs ---
export const ZODIAC_SIGNS = [
    { name: 'aries', symbol: '♈', element: 'Fire', ruler: 'Mars', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19, emoji: '🐑', color: '#EF4444' },
    { name: 'taurus', symbol: '♉', element: 'Earth', ruler: 'Venus', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20, emoji: '🐂', color: '#22C55E' },
    { name: 'gemini', symbol: '♊', element: 'Air', ruler: 'Mercury', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20, emoji: '👯', color: '#F59E0B' },
    { name: 'cancer', symbol: '♋', element: 'Water', ruler: 'Moon', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22, emoji: '🦀', color: '#6366F1' },
    { name: 'leo', symbol: '♌', element: 'Fire', ruler: 'Sun', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22, emoji: '🦁', color: '#F97316' },
    { name: 'virgo', symbol: '♍', element: 'Earth', ruler: 'Mercury', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22, emoji: '👩', color: '#84CC16' },
    { name: 'libra', symbol: '♎', element: 'Air', ruler: 'Venus', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22, emoji: '⚖️', color: '#EC4899' },
    { name: 'scorpio', symbol: '♏', element: 'Water', ruler: 'Mars', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21, emoji: '🦂', color: '#DC2626' },
    { name: 'sagittarius', symbol: '♐', element: 'Fire', ruler: 'Jupiter', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21, emoji: '🏹', color: '#8B5CF6' },
    { name: 'capricorn', symbol: '♑', element: 'Earth', ruler: 'Saturn', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19, emoji: '🐐', color: '#64748B' },
    { name: 'aquarius', symbol: '♒', element: 'Air', ruler: 'Saturn', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18, emoji: '🏺', color: '#06B6D4' },
    { name: 'pisces', symbol: '♓', element: 'Water', ruler: 'Jupiter', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20, emoji: '🐟', color: '#2DD4BF' },
];

// --- Planets (for Kundli) ---
export const PLANETS = [
    { id: 'Su', name: 'Sun', symbol: '☉', color: '#F59E0B', orbitalPeriod: 365.25 },
    { id: 'Mo', name: 'Moon', symbol: '☽', color: '#94A3B8', orbitalPeriod: 27.32 },
    { id: 'Ma', name: 'Mars', symbol: '♂', color: '#EF4444', orbitalPeriod: 687 },
    { id: 'Me', name: 'Mercury', symbol: '☿', color: '#22C55E', orbitalPeriod: 88 },
    { id: 'Ju', name: 'Jupiter', symbol: '♃', color: '#F97316', orbitalPeriod: 4333 },
    { id: 'Ve', name: 'Venus', symbol: '♀', color: '#EC4899', orbitalPeriod: 225 },
    { id: 'Sa', name: 'Saturn', symbol: '♄', color: '#6366F1', orbitalPeriod: 10759 },
    { id: 'Ra', name: 'Rahu', symbol: '☊', color: '#78716C', orbitalPeriod: 6793 },
    { id: 'Ke', name: 'Ketu', symbol: '☋', color: '#A3A3A3', orbitalPeriod: 6793 },
];

// --- Get zodiac sign from birth date ---
export function getZodiacSign(dateOfBirth) {
    const d = new Date(dateOfBirth);
    const month = d.getMonth() + 1; // 1-12
    const day = d.getDate();

    for (const sign of ZODIAC_SIGNS) {
        if (sign.name === 'capricorn') {
            if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return sign;
        } else {
            if (
                (month === sign.startMonth && day >= sign.startDay) ||
                (month === sign.endMonth && day <= sign.endDay)
            ) return sign;
        }
    }
    return ZODIAC_SIGNS[0]; // fallback
}

// --- Simple deterministic hash for daily variation ---
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit int
    }
    return Math.abs(hash);
}

// --- Calculate approximate planetary positions for a birth date ---
// This is a simplified estimation, not an astronomical calculation.
// It maps planets to the 12 Kundli houses based on their orbital periods.
export function calculatePlanetaryPositions(dateOfBirth, timeOfBirth = '12:00') {
    const d = new Date(dateOfBirth + 'T' + timeOfBirth);
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const daysSinceJ2000 = (d - J2000) / (1000 * 60 * 60 * 24);

    // Calculate ascendant (Lagna) — approximate from time of day & date
    const hours = d.getHours() + d.getMinutes() / 60;
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const ascendantDegree = ((dayOfYear * 360 / 365.25) + (hours * 15) + 180) % 360;
    const ascendantHouse = Math.floor(ascendantDegree / 30); // 0–11

    const positions = {};

    PLANETS.forEach(planet => {
        let house;
        if (planet.id === 'Ra') {
            // Rahu — opposite direction, 18.6 year cycle
            const degree = (360 - (daysSinceJ2000 * 360 / planet.orbitalPeriod) % 360 + 360) % 360;
            house = Math.floor(degree / 30);
        } else if (planet.id === 'Ke') {
            // Ketu — always opposite to Rahu
            const rahuDeg = (360 - (daysSinceJ2000 * 360 / planet.orbitalPeriod) % 360 + 360) % 360;
            house = (Math.floor(rahuDeg / 30) + 6) % 12;
        } else {
            const degree = ((daysSinceJ2000 * 360 / planet.orbitalPeriod) % 360 + 360) % 360;
            house = Math.floor(degree / 30);
        }

        // Offset by ascendant to get Kundli house number (1-indexed)
        const kundliHouse = ((house - ascendantHouse + 12) % 12) + 1;
        positions[planet.id] = {
            ...planet,
            house: kundliHouse,
            signIndex: house,
            sign: ZODIAC_SIGNS[house].name,
        };
    });

    return {
        ascendant: ascendantHouse,
        ascendantSign: ZODIAC_SIGNS[ascendantHouse],
        positions,
    };
}

// --- Daily Horoscope Generator ---
const HOROSCOPE_TEMPLATES = {
    general: [
        "Today brings a wave of positive energy. Trust your instincts and take bold steps forward.",
        "A day of reflection and inner growth. Take time to meditate and connect with your spiritual side.",
        "Opportunities are knocking at your door. Stay alert and seize the moment when it comes.",
        "Your creative energy is at its peak today. Channel it into something meaningful and productive.",
        "Today is about balance. Focus on harmonizing your personal and professional life.",
        "The stars favor new beginnings today. Don't hesitate to start that project you've been dreaming about.",
        "A day of healing and renewal. Let go of past burdens and embrace the fresh energy around you.",
        "Your communication skills shine today. Express your thoughts clearly and connect with loved ones.",
        "Financial matters look favorable. A wise investment or savings plan could yield great results.",
        "Today is perfect for learning something new. Your mind is sharp and ready to absorb knowledge.",
        "An unexpected encounter may change your perspective. Stay open to new ideas and connections.",
        "Your patience will be tested today, but the rewards of staying calm will be worth it.",
        "A day of celebration and joy. Share your happiness with those around you.",
        "Trust the process. Even if things seem uncertain now, the universe has a plan for you.",
        "Your hard work is about to pay off. Stay focused and keep pushing toward your goals.",
    ],
    love: [
        "Romance is in the air! Express your feelings openly to your partner.",
        "Single? Today might bring an exciting connection. Keep your heart open.",
        "Strengthen your bonds by showing appreciation and gratitude to your loved ones.",
        "A meaningful conversation could deepen your relationship today.",
        "Love requires patience. Give your partner space and understanding today.",
        "Your charm is irresistible today. Use it to spread warmth and love.",
        "Past misunderstandings may resolve today. Forgiveness leads to stronger bonds.",
        "Plan a surprise for someone special — small gestures make big impacts.",
    ],
    career: [
        "A promising day for career growth. Your efforts will be noticed by superiors.",
        "Collaboration is key today. Team projects will yield excellent results.",
        "Take initiative on a project you believe in. Your leadership will inspire others.",
        "A new opportunity may present itself. Evaluate carefully before making decisions.",
        "Focus on skill development today. Learning something new will pay off soon.",
        "Your creativity will solve a complex problem at work. Think outside the box.",
        "Networking today could lead to valuable professional connections.",
        "Stay organized and prioritize tasks. Efficiency will be your superpower today.",
    ],
    health: [
        "Your energy levels are high today. Make the most of it with some exercise.",
        "Pay attention to your diet today. Nourish your body with healthy choices.",
        "Mental health matters. Take breaks and practice mindfulness throughout the day.",
        "A good day for outdoor activities. Fresh air and nature will rejuvenate you.",
        "Stay hydrated and get enough rest. Your body is asking for care.",
        "Try a new wellness routine. Yoga or meditation could bring great balance.",
        "Listen to your body's signals. Rest if you feel tired — it's not a weakness.",
        "Your vitality is strong today. Channel it into activities that bring you joy.",
    ],
};

const LUCKY_COLORS = [
    'Red', 'Blue', 'Green', 'Gold', 'Purple', 'White', 'Orange',
    'Pink', 'Silver', 'Turquoise', 'Yellow', 'Maroon', 'Teal',
];

export function getDailyHoroscope(zodiacSign, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0]; // e.g., "2026-02-26"
    const signName = zodiacSign?.name || zodiacSign || 'aries';

    const seed = simpleHash(dateStr + '-' + signName);

    const general = HOROSCOPE_TEMPLATES.general[seed % HOROSCOPE_TEMPLATES.general.length];
    const love = HOROSCOPE_TEMPLATES.love[(seed >> 3) % HOROSCOPE_TEMPLATES.love.length];
    const career = HOROSCOPE_TEMPLATES.career[(seed >> 6) % HOROSCOPE_TEMPLATES.career.length];
    const health = HOROSCOPE_TEMPLATES.health[(seed >> 9) % HOROSCOPE_TEMPLATES.health.length];

    const luckyNumber = ((seed % 9) + 1); // 1–9
    const luckyColor = LUCKY_COLORS[(seed >> 4) % LUCKY_COLORS.length];
    const compatibility = ZODIAC_SIGNS[(seed >> 2) % 12].name;

    // Mood score 60–98
    const moodScore = 60 + (seed % 39);

    return {
        date: dateStr,
        sign: signName,
        general,
        love,
        career,
        health,
        luckyNumber,
        luckyColor,
        compatibility,
        moodScore,
    };
}

// --- Element descriptions ---
export const ELEMENT_INFO = {
    Fire: { emoji: '🔥', traits: 'Passionate, dynamic, adventurous' },
    Earth: { emoji: '🌍', traits: 'Practical, stable, grounded' },
    Air: { emoji: '💨', traits: 'Intellectual, social, communicative' },
    Water: { emoji: '💧', traits: 'Emotional, intuitive, nurturing' },
};
