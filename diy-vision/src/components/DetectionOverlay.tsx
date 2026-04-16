import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { DetectedObject, BoundingBox } from '../types/smartDetection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 260;

// Maps model coordinates → rendered image coordinates
function scaleBox(
  box:     BoundingBox,
  natural: { width: number; height: number },
  rW:      number,
  rH:      number,
): BoundingBox {
  return {
    x:      box.x      * (rW / natural.width),
    y:      box.y      * (rH / natural.height),
    width:  box.width  * (rW / natural.width),
    height: box.height * (rH / natural.height),
  };
}

const TIER_COLOR: Record<string, string> = {
  top_match:      '#00E5A0',
  maybe_match:    '#FFB800',
  low_confidence: '#FF6B6B',
};

type Props = {
  imageUri:         string;
  detectedObjects:  DetectedObject[];
  selectedObjectId?: string;
  /** Natural (model) image size. Defaults to screen width × IMAGE_HEIGHT. */
  imageNaturalSize?: { width: number; height: number };
};

export function DetectionOverlay({
  imageUri,
  detectedObjects,
  selectedObjectId,
  imageNaturalSize,
}: Props) {
  const natural = imageNaturalSize ?? { width: SCREEN_WIDTH, height: IMAGE_HEIGHT };

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

      {/* Bounding boxes */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {detectedObjects.map(obj => {
          if (!obj.boundingBox) return null;
          const scaled     = scaleBox(obj.boundingBox, natural, SCREEN_WIDTH, IMAGE_HEIGHT);
          const isSelected = obj.id === selectedObjectId;
          const color      = TIER_COLOR[obj.confidenceTier] ?? '#888';

          return (
            <View
              key={obj.id}
              style={[
                styles.box,
                {
                  left:        scaled.x,
                  top:         scaled.y,
                  width:       scaled.width,
                  height:      scaled.height,
                  borderColor: isSelected ? '#FFF' : color,
                  borderWidth: isSelected ? 2.5 : 1.5,
                  opacity:     isSelected ? 1 : 0.65,
                },
              ]}
            >
              <View style={[styles.chip, { backgroundColor: isSelected ? '#FFF' : color }]}>
                <Text style={styles.chipText}>{obj.label}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Bottom fade so content below feels connected */}
      <View style={styles.bottomFade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width:          '100%',
    height:         IMAGE_HEIGHT,
    backgroundColor: '#0A0A0A',
    overflow:       'hidden',
  },
  image: {
    width:  '100%',
    height: '100%',
  },
  box: {
    position:     'absolute',
    borderRadius: 4,
  },
  chip: {
    position:        'absolute',
    top:             -20,
    left:            0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius:    4,
  },
  chipText: {
    fontSize:      10,
    fontWeight:    '700',
    color:         '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bottomFade: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          60,
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
});
