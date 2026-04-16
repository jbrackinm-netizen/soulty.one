import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { DetectedObject } from '../types/smartDetection';
import { getCategoryIcon, getCategoryLabel } from '../services/objectCategory';

const TIER_META = {
  top_match:      { text: 'High Confidence',                   color: '#00E5A0' },
  maybe_match:    { text: 'Moderate Confidence',               color: '#FFB800' },
  low_confidence: { text: 'Low Confidence — please verify',    color: '#FF6B6B' },
};

type Props = {
  object:          DetectedObject;
  imageUri:        string;
  onConfirm:       () => void;
  onReject:        () => void;
  onManualSearch:  (query: string) => void;
};

export function DetectionConfirmationCard({
  object, imageUri, onConfirm, onReject, onManualSearch,
}: Props) {
  const [showInput, setShowInput] = useState(false);
  const [query,     setQuery]     = useState('');

  const tier     = TIER_META[object.confidenceTier];
  const icon     = getCategoryIcon(object.category ?? 'unknown');
  const catLabel = getCategoryLabel(object.category ?? 'unknown');
  const pct      = Math.round(object.confidence * 100);

  const submitManual = () => {
    const q = query.trim();
    if (q) onManualSearch(q);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.wrapper}
    >
      <View style={styles.container}>
        <Text style={styles.question}>Is this the right item?</Text>
        <Text style={styles.subtitle}>Confirm to load tutorials, tools, and materials.</Text>

        {/* Object preview card */}
        <View style={styles.previewCard}>
          {object.boundingBox && imageUri ? (
            <View style={styles.cropBox}>
              <Image source={{ uri: imageUri }} style={styles.cropImage} resizeMode="cover" />
              <View style={styles.cropScrim} />
            </View>
          ) : (
            <View style={styles.iconFallback}>
              <Text style={styles.iconFallbackText}>{icon}</Text>
            </View>
          )}

          <View style={styles.objectInfo}>
            <Text style={styles.objectLabel}>{object.label}</Text>
            <Text style={styles.objectCat}>{catLabel}</Text>

            <View style={styles.confidenceRow}>
              <View style={[styles.dot, { backgroundColor: tier.color }]} />
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.text}</Text>
              <Text style={styles.pctText}>{pct}% match</Text>
            </View>

            {object.description ? (
              <Text style={styles.description}>{object.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Action buttons or manual input */}
        {!showInput ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.confirmBtnText}>Yes, find tutorials →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
              <Text style={styles.rejectBtnText}>No, that's not it</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualTrigger}
              onPress={() => setShowInput(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.manualTriggerText}>Search manually instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.manualBlock}>
            <Text style={styles.manualLabel}>What are you working on?</Text>
            <TextInput
              style={styles.manualInput}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. repair concrete crack, build pergola"
              placeholderTextColor="#3A3A3A"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={submitManual}
            />
            <View style={styles.manualActions}>
              <TouchableOpacity
                style={[styles.searchBtn, !query.trim() && styles.btnDisabled]}
                onPress={submitManual}
                disabled={!query.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowInput(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 20 },

  question: {
    fontSize:   22,
    fontWeight: '800',
    color:      '#F0F0F0',
    marginBottom: 5,
  },
  subtitle: {
    fontSize:    14,
    color:       '#555',
    marginBottom: 20,
  },

  // Preview card
  previewCard: {
    backgroundColor: '#141414',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     '#1E1E1E',
    overflow:        'hidden',
    marginBottom:    24,
  },
  cropBox: {
    width:           '100%',
    height:          140,
    backgroundColor: '#0A0A0A',
  },
  cropImage: {
    width:  '100%',
    height: '100%',
  },
  cropScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  iconFallback: {
    height:          100,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#0E0E0E',
  },
  iconFallbackText: { fontSize: 52 },

  objectInfo: { padding: 16 },
  objectLabel: {
    fontSize:      20,
    fontWeight:    '800',
    color:         '#F0F0F0',
    textTransform: 'capitalize',
    marginBottom:  2,
  },
  objectCat: {
    fontSize:     12,
    color:        '#555',
    fontWeight:   '500',
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  10,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
  },
  tierText: {
    fontSize:   12,
    fontWeight: '600',
    flex:       1,
  },
  pctText: {
    fontSize:   12,
    color:      '#444',
    fontWeight: '600',
  },
  description: {
    fontSize:   13,
    color:      '#666',
    lineHeight: 19,
  },

  // Primary actions
  actions: { gap: 10 },
  confirmBtn: {
    backgroundColor: '#00E5A0',
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
  },
  confirmBtnText: {
    fontSize:      16,
    fontWeight:    '800',
    color:         '#000',
    letterSpacing: 0.2,
  },
  rejectBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius:    14,
    paddingVertical: 15,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#2A2A2A',
  },
  rejectBtnText: {
    fontSize:   15,
    fontWeight: '600',
    color:      '#CCC',
  },
  manualTrigger: {
    paddingVertical: 13,
    alignItems:      'center',
  },
  manualTriggerText: {
    fontSize:          14,
    color:             '#555',
    textDecorationLine: 'underline',
  },

  // Manual search block
  manualBlock: { gap: 12 },
  manualLabel: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#CCC',
  },
  manualInput: {
    backgroundColor: '#141414',
    borderRadius:    12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize:        15,
    color:           '#F0F0F0',
    borderWidth:     1,
    borderColor:     '#2A2A2A',
  },
  manualActions: {
    flexDirection: 'row',
    gap:           10,
  },
  searchBtn: {
    flex:            1,
    backgroundColor: '#00E5A0',
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
  },
  btnDisabled: { opacity: 0.35 },
  searchBtnText: {
    fontSize:   15,
    fontWeight: '800',
    color:      '#000',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       '#2A2A2A',
    alignItems:        'center',
  },
  cancelBtnText: {
    fontSize:   15,
    color:      '#666',
    fontWeight: '500',
  },
});
