import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '../theme';

function Toast({ message, type = 'info' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }),
    ]).start();
  }, []);

  const bgColor = type === 'success' ? colors.successTint : type === 'error' ? colors.errorTint : colors.surface;
  const textColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.inkLight;
  const borderColor = type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : colors.borderLight;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, borderColor, opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
}

export function ToastContainer({ toasts }) {
  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 340,
  },
  icon: { fontSize: 14, marginRight: 8, fontWeight: '600' },
  message: { fontSize: 13.5, lineHeight: 20, flex: 1 },
});
