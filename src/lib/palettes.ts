export type PaletteId = 'midnight' | 'silver' | 'carbon' | 'warm-sand' | 'sage' | 'arctic';

export interface PaletteTheme {
  id: PaletteId;
  name: string;
  subtitle: string;
  description: string;
  swatches: {
    bg: string;
    card: string;
    border: string;
    accent: string;
  };
  cssVars: Record<string, string>;
  threeJs: {
    particleColors: number[];
    orbitRings: number[];
    geo: {
      ico: number;
      torus: number;
      sphere: number;
    };
    ambientLight: number;
    ambientIntensity: number;
    pointLight1: { color: number; intensity: number; x: number; y: number; z: number };
    pointLight2: { color: number; intensity: number; x: number; y: number; z: number };
  };
}

export const PALETTES: Record<PaletteId, PaletteTheme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    subtitle: 'Black & Graphite',
    description: 'Deep obsidian black with rich graphite panels, hairline slate borders, and crisp luminescent silver text.',
    swatches: {
      bg: '#07080a',
      card: '#111317',
      border: '#272a30',
      accent: '#f1f5f9',
    },
    cssVars: {
      '--bg-root': '#060709',
      '--canvas-border': 'rgba(255, 255, 255, 0.08)',
      '--glass-card': 'rgba(15, 17, 21, 0.58)',
      '--glass-card-border': 'rgba(255, 255, 255, 0.08)',
      '--glass-card-hover': 'rgba(241, 245, 249, 0.22)',
      '--glass-highlight': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
      '--glass-inner-glow': 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(255, 255, 255, 0.03), transparent)',
      '--fg-primary': '#ffffff',
      '--fg-secondary': '#cbd5e1',
      '--fg-muted': '#94a3b8',
      '--accent-primary': '#f8fafc',
      '--accent-secondary': '#94a3b8',
      '--accent-btn-bg': 'linear-gradient(135deg, #27272a 0%, #18181b 100%)',
      '--accent-btn-hover': 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)',
      '--accent-btn-text': '#ffffff',
      '--accent-glow': 'rgba(255, 255, 255, 0.12)',
      '--badge-bg': 'rgba(255, 255, 255, 0.06)',
      '--badge-border': 'rgba(255, 255, 255, 0.12)',
      '--badge-text': '#f1f5f9',
    },
    threeJs: {
      particleColors: [0xffffff, 0xe2e8f0, 0x94a3b8],
      orbitRings: [0xe2e8f0, 0x94a3b8, 0x64748b],
      geo: { ico: 0xd4d4d8, torus: 0xa1a1aa, sphere: 0xf4f4f5 },
      ambientLight: 0x18181b,
      ambientIntensity: 1.2,
      pointLight1: { color: 0xffffff, intensity: 2.2, x: 12, y: 10, z: 12 },
      pointLight2: { color: 0x94a3b8, intensity: 1.8, x: -12, y: -10, z: 10 },
    },
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    subtitle: 'White & Cool Grey',
    description: 'Luminous cool grey & frosted glass with polished platinum accents and high-clarity graphite typography.',
    swatches: {
      bg: '#0c0e12',
      card: '#181c24',
      border: '#334155',
      accent: '#e2e8f0',
    },
    cssVars: {
      '--bg-root': '#0a0c10',
      '--canvas-border': 'rgba(226, 232, 240, 0.12)',
      '--glass-card': 'rgba(22, 27, 36, 0.55)',
      '--glass-card-border': 'rgba(226, 232, 240, 0.12)',
      '--glass-card-hover': 'rgba(226, 232, 240, 0.3)',
      '--glass-highlight': 'linear-gradient(90deg, transparent, rgba(226, 232, 240, 0.4), transparent)',
      '--glass-inner-glow': 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(226, 232, 240, 0.05), transparent)',
      '--fg-primary': '#ffffff',
      '--fg-secondary': '#cbd5e1',
      '--fg-muted': '#94a3b8',
      '--accent-primary': '#e2e8f0',
      '--accent-secondary': '#94a3b8',
      '--accent-btn-bg': 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      '--accent-btn-hover': 'linear-gradient(135deg, #475569 0%, #334155 100%)',
      '--accent-btn-text': '#ffffff',
      '--accent-glow': 'rgba(226, 232, 240, 0.18)',
      '--badge-bg': 'rgba(226, 232, 240, 0.08)',
      '--badge-border': 'rgba(226, 232, 240, 0.18)',
      '--badge-text': '#f8fafc',
    },
    threeJs: {
      particleColors: [0xffffff, 0xcbd5e1, 0x94a3b8],
      orbitRings: [0xf1f5f9, 0xcbd5e1, 0x94a3b8],
      geo: { ico: 0xf8fafc, torus: 0xcbd5e1, sphere: 0xe2e8f0 },
      ambientLight: 0x1e293b,
      ambientIntensity: 1.4,
      pointLight1: { color: 0xf8fafc, intensity: 2.4, x: 14, y: 10, z: 12 },
      pointLight2: { color: 0x94a3b8, intensity: 1.8, x: -14, y: -10, z: 10 },
    },
  },
  carbon: {
    id: 'carbon',
    name: 'Carbon',
    subtitle: 'Charcoal & Silver',
    description: 'Technical matte charcoal textures with brushed steel borders and sharp titanium highlights.',
    swatches: {
      bg: '#09090b',
      card: '#18181b',
      border: '#3f3f46',
      accent: '#d4d4d8',
    },
    cssVars: {
      '--bg-root': '#09090b',
      '--canvas-border': 'rgba(212, 212, 216, 0.1)',
      '--glass-card': 'rgba(24, 24, 27, 0.58)',
      '--glass-card-border': 'rgba(212, 212, 216, 0.1)',
      '--glass-card-hover': 'rgba(212, 212, 216, 0.28)',
      '--glass-highlight': 'linear-gradient(90deg, transparent, rgba(212, 212, 216, 0.38), transparent)',
      '--glass-inner-glow': 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(212, 212, 216, 0.04), transparent)',
      '--fg-primary': '#fafafa',
      '--fg-secondary': '#d4d4d8',
      '--fg-muted': '#a1a1aa',
      '--accent-primary': '#e4e4e7',
      '--accent-secondary': '#a1a1aa',
      '--accent-btn-bg': 'linear-gradient(135deg, #27272a 0%, #18181b 100%)',
      '--accent-btn-hover': 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)',
      '--accent-btn-text': '#fafafa',
      '--accent-glow': 'rgba(212, 212, 216, 0.16)',
      '--badge-bg': 'rgba(212, 212, 216, 0.08)',
      '--badge-border': 'rgba(212, 212, 216, 0.16)',
      '--badge-text': '#f4f4f5',
    },
    threeJs: {
      particleColors: [0xf4f4f5, 0xd4d4d8, 0xa1a1aa],
      orbitRings: [0xd4d4d8, 0xa1a1aa, 0x71717a],
      geo: { ico: 0xe4e4e7, torus: 0xa1a1aa, sphere: 0xd4d4d8 },
      ambientLight: 0x18181b,
      ambientIntensity: 1.2,
      pointLight1: { color: 0xf4f4f5, intensity: 2.2, x: 12, y: 12, z: 10 },
      pointLight2: { color: 0x71717a, intensity: 1.6, x: -12, y: -12, z: 8 },
    },
  },
  'warm-sand': {
    id: 'warm-sand',
    name: 'Warm Sand',
    subtitle: 'Beige & Cream',
    description: 'Warm stone, desert dune undertones, soft linen borders, and gentle incandescent amber glow.',
    swatches: {
      bg: '#0e0d0b',
      card: '#1c1916',
      border: '#443a32',
      accent: '#e7dfd5',
    },
    cssVars: {
      '--bg-root': '#0c0b09',
      '--canvas-border': 'rgba(231, 223, 213, 0.12)',
      '--glass-card': 'rgba(28, 24, 21, 0.58)',
      '--glass-card-border': 'rgba(231, 223, 213, 0.12)',
      '--glass-card-hover': 'rgba(231, 223, 213, 0.32)',
      '--glass-highlight': 'linear-gradient(90deg, transparent, rgba(231, 223, 213, 0.4), transparent)',
      '--glass-inner-glow': 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(231, 223, 213, 0.05), transparent)',
      '--fg-primary': '#fdfbf7',
      '--fg-secondary': '#e7dfd5',
      '--fg-muted': '#b8aba0',
      '--accent-primary': '#f5ede3',
      '--accent-secondary': '#d6c7b2',
      '--accent-btn-bg': 'linear-gradient(135deg, #383029 0%, #241f1a 100%)',
      '--accent-btn-hover': 'linear-gradient(135deg, #4a4038 0%, #383029 100%)',
      '--accent-btn-text': '#fdfbf7',
      '--accent-glow': 'rgba(231, 223, 213, 0.18)',
      '--badge-bg': 'rgba(231, 223, 213, 0.08)',
      '--badge-border': 'rgba(231, 223, 213, 0.18)',
      '--badge-text': '#fdfbf7',
    },
    threeJs: {
      particleColors: [0xfdfbf7, 0xe7dfd5, 0xd6c7b2],
      orbitRings: [0xe7dfd5, 0xd6c7b2, 0xa89987],
      geo: { ico: 0xf5ede3, torus: 0xd6c7b2, sphere: 0xe7dfd5 },
      ambientLight: 0x241e18,
      ambientIntensity: 1.3,
      pointLight1: { color: 0xfdfbf7, intensity: 2.3, x: 12, y: 10, z: 12 },
      pointLight2: { color: 0xcbb7a2, intensity: 1.7, x: -12, y: -10, z: 10 },
    },
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    subtitle: 'Muted Grey & Soft Green',
    description: 'Earthy slate grey infused with whisper-quiet eucalyptus and matcha green accents for serene focus.',
    swatches: {
      bg: '#0a0e0c',
      card: '#151c18',
      border: '#2d3b32',
      accent: '#a3b899',
    },
    cssVars: {
      '--bg-root': '#080c0a',
      '--canvas-border': 'rgba(163, 184, 153, 0.12)',
      '--glass-card': 'rgba(19, 27, 22, 0.58)',
      '--glass-card-border': 'rgba(163, 184, 153, 0.12)',
      '--glass-card-hover': 'rgba(163, 184, 153, 0.32)',
      '--glass-highlight': 'linear-gradient(90deg, transparent, rgba(163, 184, 153, 0.4), transparent)',
      '--glass-inner-glow': 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(163, 184, 153, 0.05), transparent)',
      '--fg-primary': '#f3f7f4',
      '--fg-secondary': '#c9d9cb',
      '--fg-muted': '#8e9f90',
      '--accent-primary': '#b8ccad',
      '--accent-secondary': '#8ea384',
      '--accent-btn-bg': 'linear-gradient(135deg, #233428 0%, #16221a 100%)',
      '--accent-btn-hover': 'linear-gradient(135deg, #304737 0%, #233428 100%)',
      '--accent-btn-text': '#f3f7f4',
      '--accent-glow': 'rgba(163, 184, 153, 0.18)',
      '--badge-bg': 'rgba(163, 184, 153, 0.08)',
      '--badge-border': 'rgba(163, 184, 153, 0.18)',
      '--badge-text': '#f3f7f4',
    },
    threeJs: {
      particleColors: [0xf3f7f4, 0xc9d9cb, 0xa3b899],
      orbitRings: [0xb8ccad, 0x8ea384, 0x5a7052],
      geo: { ico: 0xc9d9cb, torus: 0x9fb595, sphere: 0xb8ccad },
      ambientLight: 0x152119,
      ambientIntensity: 1.3,
      pointLight1: { color: 0xf3f7f4, intensity: 2.2, x: 12, y: 10, z: 12 },
      pointLight2: { color: 0x8ea384, intensity: 1.7, x: -12, y: -10, z: 10 },
    },
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic',
    subtitle: 'Frost White & Steel Grey',
    description: 'Glacial crystalline frost with sub-zero steel grey sheens and crisp diamond highlights.',
    swatches: {
      bg: '#070b10',
      card: '#121822',
      border: '#27354a',
      accent: '#bae6fd',
    },
    cssVars: {
      '--bg-root': '#06090e',
      '--canvas-border': 'rgba(186, 230, 253, 0.12)',
      '--glass-card': 'rgba(16, 23, 34, 0.58)',
      '--glass-card-border': 'rgba(186, 230, 253, 0.12)',
      '--glass-card-hover': 'rgba(186, 230, 253, 0.32)',
      '--glass-highlight': 'linear-gradient(90deg, transparent, rgba(186, 230, 253, 0.4), transparent)',
      '--glass-inner-glow': 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(186, 230, 253, 0.05), transparent)',
      '--fg-primary': '#f0f9ff',
      '--fg-secondary': '#cbd5e1',
      '--fg-muted': '#94a3b8',
      '--accent-primary': '#e0f2fe',
      '--accent-secondary': '#93c5fd',
      '--accent-btn-bg': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      '--accent-btn-hover': 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      '--accent-btn-text': '#f0f9ff',
      '--accent-glow': 'rgba(186, 230, 253, 0.18)',
      '--badge-bg': 'rgba(186, 230, 253, 0.08)',
      '--badge-border': 'rgba(186, 230, 253, 0.18)',
      '--badge-text': '#f0f9ff',
    },
    threeJs: {
      particleColors: [0xffffff, 0xe0f2fe, 0xbae6fd],
      orbitRings: [0xe0f2fe, 0x93c5fd, 0x64748b],
      geo: { ico: 0xf0f9ff, torus: 0x93c5fd, sphere: 0xbae6fd },
      ambientLight: 0x0f172a,
      ambientIntensity: 1.3,
      pointLight1: { color: 0xffffff, intensity: 2.3, x: 12, y: 10, z: 12 },
      pointLight2: { color: 0x7dd3fc, intensity: 1.8, x: -12, y: -10, z: 10 },
    },
  },
};

export const PALETTE_LIST: PaletteTheme[] = Object.values(PALETTES);
export const DEFAULT_PALETTE_ID: PaletteId = 'midnight';
