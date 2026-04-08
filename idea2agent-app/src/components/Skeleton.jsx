import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

function ShimmerBar({ width = '100%', height = 14, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width,
        height,
        backgroundColor: colors.borderLight,
        borderRadius: radius.sm,
        opacity: anim,
        marginBottom: 8,
      }}
    />
  );
}

export default function Skeleton() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1100, useNativeDriver: true })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      {/* Header group */}
      <ShimmerBar width="65%" height={22} delay={0} />
      <ShimmerBar width="45%" height={14} delay={80} />

      <View style={{ height: 20 }} />

      {/* Section 1 */}
      <ShimmerBar width="40%" height={16} delay={0} />
      <ShimmerBar width="100%" delay={60} />
      <ShimmerBar width="85%" delay={100} />
      <ShimmerBar width="75%" delay={140} />

      <View style={{ height: 16 }} />

      {/* Section 2 */}
      <ShimmerBar width="50%" height={16} delay={0} />
      <ShimmerBar width="100%" delay={60} />
      <ShimmerBar width="90%" delay={100} />
      <ShimmerBar width="70%" delay={140} />
      <ShimmerBar width="80%" delay={180} />

      <View style={{ height: 16 }} />

      {/* Code block */}
      <View style={styles.codeBlock}>
        <ShimmerBar width="30%" height={10} delay={0} />
        <ShimmerBar width="70%" height={10} delay={80} />
        <ShimmerBar width="55%" height={10} delay={120} />
        <ShimmerBar width="65%" height={10} delay={160} />
      </View>

      {/* Spinner label */}
      <View style={styles.spinnerRow}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        <Animated.Text style={styles.spinnerText}>炼金炉正在运转...</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  codeBlock: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderTopColor: colors.ember,
  },
  spinnerText: {
    fontSize: 14,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
});
