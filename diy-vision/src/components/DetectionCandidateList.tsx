import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { DetectedObject } from '../types/smartDetection';
import { getCategoryIcon, getCategoryLabel } from '../services/objectCategory';

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER = {
  top_match:      { label: 'Top Match',       color: '#00E5A0', bg: 'rgba(0,229,160,0.10)'   },
  maybe_match:    { label: 'Maybe',           color: '#FFB800', bg: 'rgba(255,184,0,0.10)'   },
  low_confidence: { label: 'Low Confidence',  color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)' },
};

// ─── Single candidate card ────────────────────────────────────────────────────

function CandidateCard({
  object,
  isSelected,
  onPress,
}: {
  object:     DetectedObject;
  isSelected: boolean;
  onPress:    () => void;
}) {
  const tier     = TIER[object.confidenceTier];
  const icon     = getCategoryIcon(object.category ?? 'unknown');
  const catLabel = getCategoryLabel(object.category ?? 'unknown');
  const pct      = Math.round(object.confidence * 100);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {/* Category icon */}
      <View style={[styles.iconBox, { backgroundColor: tier.bg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      {/* Label + description */}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{object.label}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
            <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
            <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>

        <Text style={styles.category}>{catLabel}</Text>

        {object.description ? (
          <Text style={styles.description} numberOfLines={2}>{object.description}</Text>
        ) : null}
      </View>

      {/* Vertical confidence bar */}
      <View style={styles.confidenceCol}>
        <Text style={[styles.confidencePct, { color: tier.color }]}>{pct}%</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: tier.color }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

type Props = {
  objects:     DetectedObject[];
  selectedId?: string;
  onSelect:    (obj: DetectedObject) => void;
};

export function DetectionCandidateList({ objects, selectedId, onSelect }: Props) {
  if (objects.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Nothing detected</Text>
        <Text style={styles.emptySub}>Try a clearer photo, or use manual search below.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        {objects.length} object{objects.length !== 1 ? 's' : ''} detected — tap to select
      </Text>

      <FlatList
        data={objects}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CandidateCard
            object={item}
            isSelected={item.id === selectedId}
            onPress={() => onSelect(item)}
          />
        )}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop:        20,
  },
  sectionHeader: {
    fontSize:      12,
    color:         '#555',
    fontWeight:    '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom:  12,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection:   'row',
    backgroundColor: '#141414',
    borderRadius:    14,
    padding:         14,
    borderWidth:     1,
    borderColor:     '#1E1E1E',
    alignItems:      'center',
    gap:             12,
  },
  cardSelected: {
    borderColor:     '#00E5A0',
    backgroundColor: 'rgba(0,229,160,0.05)',
  },
  iconBox: {
    width:          44,
    height:         44,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  iconText: {
    fontSize: 22,
  },
  body: {
    flex: 1,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            8,
    marginBottom:   2,
  },
  label: {
    fontSize:      15,
    fontWeight:    '700',
    color:         '#F0F0F0',
    textTransform: 'capitalize',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:  20,
    flexShrink:    0,
  },
  tierDot: {
    width:        5,
    height:       5,
    borderRadius: 2.5,
  },
  tierLabel: {
    fontSize:   10,
    fontWeight: '600',
  },
  category: {
    fontSize:     11,
    color:        '#555',
    fontWeight:   '500',
    marginBottom: 4,
  },
  description: {
    fontSize:   12,
    color:      '#777',
    lineHeight: 17,
  },
  confidenceCol: {
    alignItems: 'center',
    gap:        5,
    flexShrink: 0,
  },
  confidencePct: {
    fontSize:   11,
    fontWeight: '700',
  },
  barBg: {
    width:          4,
    height:         40,
    backgroundColor: '#1E1E1E',
    borderRadius:   2,
    justifyContent: 'flex-end',
    overflow:       'hidden',
  },
  barFill: {
    width:        '100%',
    borderRadius: 2,
  },
  empty: {
    alignItems:      'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize:     40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize:     17,
    fontWeight:   '700',
    color:        '#F0F0F0',
    marginBottom: 8,
  },
  emptySub: {
    fontSize:   14,
    color:      '#555',
    textAlign:  'center',
    lineHeight: 20,
  },
});
