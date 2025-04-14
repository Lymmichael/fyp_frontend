import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { Animated } from 'react-native';

const Compass = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [angle, setAngle] = useState(0);

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener(result => {
        setX(result.x);
        setY(result.y);
        setZ(result.z);
        // Calculate the angle using the magnetometer data
        const angleRad = Math.atan2(result.y, result.x);
        const angleDeg = angleRad * (180 / Math.PI);
        setAngle(angleDeg);
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const isFacingNorth = () => {
    // North is between -10° and 10° or between 350° and 360°
    return (angle >= -10 && angle <= 10) || (angle >= 350);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Compass Direction: {angle.toFixed(2)}°</Text>
      <Animated.View style={[styles.arrow, { transform: [{ rotate: `${angle}deg` }] }]}>
        <View style={styles.arrowHead} />
      </Animated.View>
      {isFacingNorth() ? (
        <Text style={styles.message}>Keep walking!</Text>
      ) : (
        <Text style={styles.message}>Adjust your direction.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
  arrow: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderLeftColor: 'transparent',
    borderRightWidth: 20,
    borderRightColor: 'transparent',
    borderTopWidth: 50,
    borderTopColor: 'red',
  },
  message: {
    fontSize: 18,
    color: 'green',
    marginTop: 20,
  },
});

export default Compass;
