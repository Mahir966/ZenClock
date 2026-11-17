import { SoundDefinition, DesignStyle } from './types';

export const SOUND_DEFINITIONS: SoundDefinition[] = [
  { id: 'custom_alarm_1', name: 'Alarm 1 (Melody)', description: 'Uploaded melodious wake-up alarm', file: 'sounds/custom_alarm_1.mp3' },
  { id: 'custom_alarm_2', name: 'Alarm 2 (Pulse)', description: 'Uploaded rhythmic pulsing alert', file: 'sounds/custom_alarm_2.mp3' },
  { id: 'custom_alarm_3', name: 'Alarm 3 (Crystal Bell)', description: 'Uploaded crystal bell chime', file: 'sounds/custom_alarm_3.wav' },
  { id: 'custom_alarm_4', name: 'Alarm 4 (Deep Chime)', description: 'Uploaded deep harmonic resonance chime', file: 'sounds/custom_alarm_4.wav' },
  { id: 'custom_alarm_5', name: 'Alarm 5 (Serene Wave)', description: 'Uploaded serene ambient sound wave', file: 'sounds/custom_alarm_5.wav' },
  { id: 'oxygen', name: 'Oxygen', description: 'Warm Android marimba & dual chime', file: 'sounds/oxygen.wav' },
  { id: 'argon', name: 'Argon', description: 'Upbeat rhythmic electro-chime alarm', file: 'sounds/argon.wav' },
  { id: 'cesium', name: 'Cesium', description: 'Cascading harp bells with rich harmonics', file: 'sounds/cesium.wav' },
  { id: 'digital_beep', name: 'Digital Beep', description: 'Classic dual-frequency crisp beeper', file: 'sounds/digital_beep.wav' },
  { id: 'zen_bowl', name: 'Zen Bowl', description: 'Tibetan singing bowl with deep resonance', file: 'sounds/zen_bowl.wav' },
  { id: 'gentle_chime', name: 'Gentle Chimes', description: 'Crystalline wind chimes & bell pan', file: 'sounds/gentle_chime.wav' },
  { id: 'morning_breeze', name: 'Morning Breeze', description: 'Pentatonic morning flute harmony', file: 'sounds/morning_breeze.wav' },
];

export const DESIGN_STYLES: { id: DesignStyle; name: string; tag: string }[] = [
  { id: 'zen', name: 'Zen Minimal', tag: 'Breathing silver ring & specular glass' },
  { id: 'studio', name: 'Studio Modern', tag: 'Bauhaus segmented tick dial & graphite accent' },
  { id: 'cyber', name: 'Cyber HUD', tag: 'Technical titanium HUD framing & starlight glow' },
  { id: 'spatial', name: 'Spatial 3D', tag: 'Gyroscopic 3D orbital particle halo' },
];

export const QUICK_PRESETS = [
  { label: '+1m', sec: 60 },
  { label: '+5m', sec: 300 },
  { label: '+10m', sec: 600 },
  { label: '+15m', sec: 900 },
  { label: '+25m', sec: 1500 },
  { label: '+45m', sec: 2700 },
  { label: '+60m', sec: 3600 },
];

export interface MotivationalQuote {
  text: string;
  author: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  { text: "Do not wait; the time will never be 'just right'. Start where you stand.", author: "Napoleon Hill" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Focus is a muscle. The more you practice single-tasking, the stronger it gets.", author: "Zen Mind" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Simplicity is the prerequisite for great focus and mastery.", author: "Edsger W. Dijkstra" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
  { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "One hour of deep focus beats an entire day of distracted multitasking.", author: "Cal Newport" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "You don't have to be extreme, just consistent.", author: "James Clear" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "Breathe in clarity, breathe out distraction.", author: "Zen Proverb" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "Energy flows where attention goes.", author: "Tony Robbins" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The present moment is filled with joy and peace. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Patience and perseverance have a magical effect before which difficulties disappear.", author: "John Quincy Adams" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
  { text: "Be like water making its way through cracks. Adjust to the object.", author: "Bruce Lee" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "Guard your time as your most precious treasure.", author: "Seneca" },
  { text: "Begin anywhere. Just do not stand still.", author: "John Cage" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Calmness is the cradle of power.", author: "Josiah Gilbert Holland" },
  { text: "Nothing is impossible, the word itself says 'I'm possible'!", author: "Audrey Hepburn" },
  { text: "An ounce of practice is worth more than tons of preaching.", author: "Mahatma Gandhi" },
  { text: "Flow with whatever is happening and let your mind be free.", author: "Zhuangzi" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Every morning we are born again. What we do today is what matters most.", author: "Buddha" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The art of living is more like wrestling than dancing.", author: "Marcus Aurelius" },
  { text: "Step by step walk the thousand-mile road.", author: "Miyamoto Musashi" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
  { text: "Today is an opportunity to achieve clarity. Don't waste it.", author: "Zen Master" }
];
