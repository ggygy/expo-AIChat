import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { useRef } from 'react';
import Slider from '@react-native-community/slider';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ValueSliderProps {
  label: string;
  hint?: string;
  value: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  formatValue?: (value: number) => string;
}

export function ValueSlider({
  label,
  hint,
  value,
  onValueChange,
  onSlidingComplete,
  minimumValue,
  maximumValue,
  step,
  formatValue = (v) => v.toString(),
}: ValueSliderProps) {
  const valueRef = useRef<Text>(null);
  const textColor = useThemeColor({}, 'text');

  const updateDisplayValue = (newValue: number) => {
    if (valueRef.current) {
      valueRef.current.setNativeProps({ text: formatValue(newValue) });
    }
  };

  const valueStyle: TextStyle = {
    textAlign: 'right',
    fontSize: 14,
    color: textColor,
    flex: 1,
    marginRight: 8,
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Slider
        value={value}
        onValueChange={(v) => {
          updateDisplayValue(v);
          onValueChange?.(v);
        }}
        onSlidingComplete={onSlidingComplete}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        style={styles.slider}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#DEDEDE"
      />
      <View style={styles.valueRow}>
        {hint && <ThemedText style={styles.hint}>{hint}</ThemedText>}
        <Text ref={valueRef} style={valueStyle}>
          {formatValue(value)}
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  slider: {
    height: 40,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    flex: 2,
  },
});
