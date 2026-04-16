import { ObjectCategory } from '../types/smartDetection';

// ─── Category Lookup Map ──────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, ObjectCategory> = {
  // Furniture
  couch: 'furniture', sofa: 'furniture', recliner: 'furniture',
  chair: 'furniture', 'dining chair': 'furniture', 'bar stool': 'furniture',
  ottoman: 'furniture', loveseat: 'furniture', sectional: 'furniture',
  armchair: 'furniture', bench: 'furniture', dresser: 'furniture',
  cabinet: 'furniture', bookshelf: 'furniture', desk: 'furniture',
  table: 'furniture', 'coffee table': 'furniture', 'end table': 'furniture',
  bed: 'furniture', headboard: 'furniture',

  // Concrete / Masonry
  driveway: 'concrete_masonry', concrete: 'concrete_masonry', patio: 'concrete_masonry',
  slab: 'concrete_masonry', crack: 'concrete_masonry', 'stamped concrete': 'concrete_masonry',
  brick: 'concrete_masonry', mortar: 'concrete_masonry', 'retaining wall': 'concrete_masonry',
  'block wall': 'concrete_masonry', walkway: 'concrete_masonry', sidewalk: 'concrete_masonry',
  foundation: 'concrete_masonry', step: 'concrete_masonry', curb: 'concrete_masonry',

  // Tools
  'circular saw': 'tools', drill: 'tools', grinder: 'tools',
  'angle grinder': 'tools', 'pressure washer': 'tools', 'table saw': 'tools',
  router: 'tools', sander: 'tools', 'orbital sander': 'tools',
  jigsaw: 'tools', 'miter saw': 'tools', nailer: 'tools',
  compressor: 'tools', welder: 'tools', chainsaw: 'tools',
  'reciprocating saw': 'tools',

  // Plumbing
  faucet: 'plumbing', sink: 'plumbing', 'shower valve': 'plumbing',
  toilet: 'plumbing', 'water heater': 'plumbing', pipe: 'plumbing',
  drain: 'plumbing', 'garbage disposal': 'plumbing', valve: 'plumbing',
  'p-trap': 'plumbing', 'supply line': 'plumbing',

  // Electrical
  outlet: 'electrical', switch: 'electrical', 'breaker box': 'electrical',
  'light fixture': 'electrical', 'ceiling fan': 'electrical', conduit: 'electrical',
  wire: 'electrical', panel: 'electrical', 'gfci outlet': 'electrical', dimmer: 'electrical',

  // Automotive
  hood: 'automotive', coilover: 'automotive', 'brake pad': 'automotive',
  battery: 'automotive', headlight: 'automotive', 'air filter': 'automotive',
  'oil filter': 'automotive', bumper: 'automotive', 'spark plug': 'automotive',
  tire: 'automotive', rotors: 'automotive',

  // Carpentry
  door: 'carpentry', window: 'carpentry', trim: 'carpentry',
  'crown molding': 'carpentry', baseboard: 'carpentry', frame: 'carpentry',
  stair: 'carpentry', railing: 'carpentry', deck: 'carpentry',
  'deck board': 'carpentry', fence: 'carpentry',

  // Outdoor
  pergola: 'outdoor', 'fire pit': 'outdoor', 'outdoor kitchen': 'outdoor',
  grill: 'outdoor', 'raised bed': 'outdoor', 'garden bed': 'outdoor',
  shed: 'outdoor', gazebo: 'outdoor',

  // Flooring
  tile: 'flooring', hardwood: 'flooring', laminate: 'flooring',
  vinyl: 'flooring', carpet: 'flooring', grout: 'flooring', subfloor: 'flooring',

  // Roofing
  shingle: 'roofing', gutter: 'roofing', flashing: 'roofing',
  'roof vent': 'roofing', 'ridge cap': 'roofing', fascia: 'roofing', soffit: 'roofing',

  // Painting
  wall: 'painting', ceiling: 'painting', primer: 'painting',
  texture: 'painting', stucco: 'painting',
};

export function getObjectCategory(label: string): ObjectCategory {
  const normalized = label.toLowerCase().trim();
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];

  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return category;
  }

  return 'unknown';
}

export function getCategoryLabel(category: ObjectCategory): string {
  const labels: Record<ObjectCategory, string> = {
    furniture:        'Furniture',
    concrete_masonry: 'Concrete & Masonry',
    tools:            'Power Tools',
    plumbing:         'Plumbing',
    electrical:       'Electrical',
    automotive:       'Automotive',
    carpentry:        'Carpentry',
    outdoor:          'Outdoor Projects',
    flooring:         'Flooring',
    roofing:          'Roofing',
    painting:         'Painting & Drywall',
    unknown:          'General DIY',
  };
  return labels[category];
}

export function getCategoryIcon(category: ObjectCategory): string {
  const icons: Record<ObjectCategory, string> = {
    furniture:        '🛋️',
    concrete_masonry: '🧱',
    tools:            '🔧',
    plumbing:         '🚰',
    electrical:       '⚡',
    automotive:       '🚗',
    carpentry:        '🪚',
    outdoor:          '🌿',
    flooring:         '🏠',
    roofing:          '🏗️',
    painting:         '🎨',
    unknown:          '🔨',
  };
  return icons[category];
}
