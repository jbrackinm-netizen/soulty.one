import { ObjectCategory } from '../types/smartDetection';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueryIntent =
  | 'repair' | 'install' | 'how_to_use' | 'build' | 'maintain' | 'replace' | 'restore';

type QueryTemplate = {
  primary: string;
  variations: string[];
  intent: QueryIntent;
};

export type NormalizedQuery = QueryTemplate & {
  category: ObjectCategory;
  rawLabel: string;
};

// ─── Query Map ────────────────────────────────────────────────────────────────
// Maps common detection labels to high-quality search intent strings.
// Each entry has a primary query (best match) plus variations for fallback use.

const QUERY_MAP: Record<string, QueryTemplate> = {
  // Furniture
  couch: {
    primary: 'how to reupholster a couch DIY tutorial',
    variations: ['couch repair DIY guide', 'sofa reupholstery beginner tutorial', 'fix sagging couch cushions'],
    intent: 'restore',
  },
  sofa: {
    primary: 'how to reupholster a sofa DIY tutorial',
    variations: ['sofa frame repair tutorial', 'reupholster sofa cushions DIY', 'sofa leg replacement guide'],
    intent: 'restore',
  },
  chair: {
    primary: 'chair upholstery tutorial DIY beginner',
    variations: ['how to reupholster a chair seat', 'dining chair repair guide', 'chair leg repair tutorial'],
    intent: 'restore',
  },
  recliner: {
    primary: 'how to repair a recliner mechanism DIY',
    variations: ['recliner reupholstery tutorial', 'recliner spring repair DIY', 'recliner handle fix guide'],
    intent: 'repair',
  },
  dresser: {
    primary: 'how to refinish a dresser DIY tutorial',
    variations: ['dresser painting tutorial beginners', 'dresser hardware replacement guide', 'dresser drawer repair'],
    intent: 'restore',
  },
  bench: {
    primary: 'how to build a wood bench DIY tutorial',
    variations: ['reupholster a bench seat DIY', 'bench leg repair guide', 'outdoor bench build tutorial'],
    intent: 'build',
  },

  // Concrete / Masonry
  driveway: {
    primary: 'repair cracked concrete driveway DIY tutorial',
    variations: [
      'how to resurface a concrete driveway step by step',
      'concrete driveway overlay DIY guide',
      'how to seal a concrete driveway',
    ],
    intent: 'repair',
  },
  patio: {
    primary: 'how to repair concrete patio cracks DIY tutorial',
    variations: [
      'stamped concrete patio overlay tutorial',
      'concrete patio resurfacing DIY guide',
      'how to build a concrete patio from scratch',
    ],
    intent: 'repair',
  },
  concrete: {
    primary: 'how to work with concrete DIY beginner guide',
    variations: ['pouring concrete basics tutorial', 'concrete mixing and finishing guide', 'DIY concrete project tips'],
    intent: 'how_to_use',
  },
  crack: {
    primary: 'how to repair concrete cracks DIY tutorial',
    variations: [
      'concrete crack filler tutorial step by step',
      'hairline crack concrete repair guide',
      'epoxy concrete crack repair DIY',
    ],
    intent: 'repair',
  },
  brick: {
    primary: 'how to repoint brick mortar DIY tuckpointing',
    variations: ['tuckpointing brick wall tutorial', 'how to replace a damaged brick', 'brick repair step by step'],
    intent: 'repair',
  },

  // Tools
  'circular saw': {
    primary: 'how to use a 7 1/4 circular saw beginner guide safety',
    variations: [
      'circular saw safety tutorial for beginners',
      'how to make straight cuts with a circular saw',
      'circular saw blade selection guide',
    ],
    intent: 'how_to_use',
  },
  drill: {
    primary: 'how to use a power drill beginner tutorial',
    variations: [
      'drill bit guide for beginners all materials',
      'how to drill into concrete with a hammer drill',
      'cordless drill tips tricks beginners',
    ],
    intent: 'how_to_use',
  },
  'angle grinder': {
    primary: 'how to use an angle grinder safely complete tutorial',
    variations: [
      'angle grinder disc types cutting vs grinding',
      'angle grinder safety rules beginners',
      'best uses for an angle grinder DIY',
    ],
    intent: 'how_to_use',
  },
  'pressure washer': {
    primary: 'how to use a pressure washer tutorial beginner tips',
    variations: [
      'pressure washing concrete driveway guide',
      'pressure washer nozzle selection guide',
      'pressure washing house siding correctly',
    ],
    intent: 'how_to_use',
  },
  'table saw': {
    primary: 'table saw safety for beginners complete tutorial',
    variations: ['table saw rip cut guide', 'table saw fence adjustment tutorial', 'table saw crosscut sled DIY'],
    intent: 'how_to_use',
  },
  welder: {
    primary: 'MIG welding for beginners complete tutorial',
    variations: ['how to set up a MIG welder step by step', 'beginner welding basics safety', 'TIG welding tutorial beginners'],
    intent: 'how_to_use',
  },
  sander: {
    primary: 'how to use an orbital sander beginner guide',
    variations: ['sanding wood furniture properly tutorial', 'orbital vs belt sander which to use', 'sanding grits guide wood finishing'],
    intent: 'how_to_use',
  },

  // Plumbing
  faucet: {
    primary: 'how to replace a kitchen faucet DIY step by step',
    variations: [
      'how to fix a dripping leaky faucet DIY',
      'bathroom faucet installation tutorial',
      'faucet cartridge replacement guide',
    ],
    intent: 'replace',
  },
  toilet: {
    primary: 'how to replace a toilet DIY complete tutorial',
    variations: [
      'how to fix a running toilet DIY guide',
      'toilet flapper replacement step by step',
      'toilet wax ring replacement tutorial',
    ],
    intent: 'replace',
  },
  'water heater': {
    primary: 'how to replace a water heater DIY tutorial',
    variations: [
      'water heater installation step by step guide',
      'tankless water heater installation DIY',
      'water heater flush maintenance how to',
    ],
    intent: 'replace',
  },
  sink: {
    primary: 'how to install a kitchen sink DIY tutorial',
    variations: ['undermount sink installation guide', 'bathroom sink replacement DIY', 'sink drain assembly install'],
    intent: 'install',
  },

  // Electrical
  outlet: {
    primary: 'how to replace an electrical outlet DIY safely',
    variations: [
      'how to install a GFCI outlet step by step',
      'outlet not working troubleshooting guide',
      'how to add a new electrical outlet DIY',
    ],
    intent: 'replace',
  },
  'ceiling fan': {
    primary: 'how to install a ceiling fan DIY complete tutorial',
    variations: [
      'ceiling fan wiring tutorial for beginners',
      'ceiling fan remote control installation',
      'ceiling fan wobble fix guide',
    ],
    intent: 'install',
  },
  'light fixture': {
    primary: 'how to replace a light fixture DIY tutorial',
    variations: ['recessed lighting installation tutorial', 'how to hang a chandelier DIY', 'light switch replacement guide'],
    intent: 'replace',
  },

  // Automotive
  'brake pad': {
    primary: 'how to replace brake pads DIY complete tutorial',
    variations: [
      'disc brake pad and rotor replacement guide',
      'rear brake pad replacement DIY tutorial',
      'brake caliper replacement step by step',
    ],
    intent: 'replace',
  },
  battery: {
    primary: 'how to replace a car battery DIY step by step',
    variations: [
      'car battery installation tutorial safely',
      'dead car battery troubleshooting guide',
      'how to jump start a car correctly',
    ],
    intent: 'replace',
  },
  headlight: {
    primary: 'how to replace a headlight bulb DIY tutorial',
    variations: ['headlight assembly replacement guide', 'LED headlight upgrade install DIY', 'foggy headlight restoration guide'],
    intent: 'replace',
  },

  // Carpentry
  deck: {
    primary: 'how to build a wood deck DIY complete tutorial',
    variations: [
      'deck board replacement and repair tutorial',
      'how to stain and seal a deck DIY guide',
      'composite deck installation step by step',
    ],
    intent: 'build',
  },
  fence: {
    primary: 'how to build a wood privacy fence DIY tutorial',
    variations: [
      'fence post installation concrete footing guide',
      'how to repair a wood fence panel',
      'picket fence building tutorial beginner',
    ],
    intent: 'build',
  },
  door: {
    primary: 'how to hang a door DIY tutorial beginner guide',
    variations: ['interior door installation step by step', 'how to fix a door that wont close', 'door frame repair tutorial'],
    intent: 'install',
  },

  // Outdoor
  'fire pit': {
    primary: 'how to build a DIY fire pit with blocks tutorial',
    variations: [
      'DIY round fire pit with retaining wall blocks step by step',
      'how to build a stone fire pit tutorial',
      'paver fire pit build guide with drainage',
    ],
    intent: 'build',
  },
  pergola: {
    primary: 'how to build a pergola DIY complete tutorial',
    variations: [
      'attached pergola build guide step by step',
      'freestanding pergola construction tutorial',
      'pergola post and beam installation guide',
    ],
    intent: 'build',
  },
  shed: {
    primary: 'how to build a shed DIY step by step tutorial',
    variations: ['shed foundation options guide', 'shed framing tutorial beginners', 'shed door and roof installation'],
    intent: 'build',
  },

  // Flooring
  tile: {
    primary: 'how to tile a floor DIY tutorial for beginners',
    variations: ['subway tile installation tutorial bathroom', 'how to cut and lay floor tile', 'tile grouting tutorial step by step'],
    intent: 'install',
  },
  hardwood: {
    primary: 'how to install hardwood floors DIY tutorial',
    variations: ['nail down hardwood flooring installation guide', 'hardwood floor refinishing tutorial', 'how to fix squeaky hardwood floors'],
    intent: 'install',
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function normalizeSearchQuery(label: string, category: ObjectCategory): NormalizedQuery {
  const normalized = label.toLowerCase().trim();

  if (QUERY_MAP[normalized]) {
    return { ...QUERY_MAP[normalized], category, rawLabel: label };
  }

  for (const [key, template] of Object.entries(QUERY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { ...template, category, rawLabel: label };
    }
  }

  return buildFallback(label, category);
}

function buildFallback(label: string, category: ObjectCategory): NormalizedQuery {
  const intentByCategory: Record<ObjectCategory, QueryIntent> = {
    furniture:        'restore',
    concrete_masonry: 'repair',
    tools:            'how_to_use',
    plumbing:         'replace',
    electrical:       'install',
    automotive:       'replace',
    carpentry:        'build',
    outdoor:          'build',
    flooring:         'install',
    roofing:          'repair',
    painting:         'how_to_use',
    unknown:          'how_to_use',
  };

  const prefixByIntent: Record<QueryIntent, string> = {
    repair:     'how to repair',
    install:    'how to install',
    how_to_use: 'how to use',
    build:      'how to build',
    maintain:   'how to maintain',
    replace:    'how to replace',
    restore:    'how to restore',
  };

  const intent = intentByCategory[category];
  const prefix = prefixByIntent[intent];

  return {
    primary:    `${prefix} ${label} DIY tutorial step by step`,
    variations: [`${label} DIY guide beginners`, `${label} tutorial how to`, `${label} step by step instructions`],
    intent,
    category,
    rawLabel: label,
  };
}
