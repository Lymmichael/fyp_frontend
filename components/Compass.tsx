import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Magnetometer } from 'expo-sensors';

const Compass = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const _subscribe = async () => {
      const { status } = await Magnetometer.requestPermissionsAsync();
      if (status === 'granted') {
        Magnetometer.addListener(result => {
          const angleRad = Math.atan2(result.y, result.x);
          const angleDeg = angleRad * (180 / Math.PI);
          setAngle(angleDeg);
        });
      }
    };
    _subscribe();
  }, []);

  const isFacingWest = () => {
    // North is between -10° and 10° or between 350° and 360°
    return (angle >= -10 && angle <= 10) || (angle >= 350);
  };

  const isFacingEast = () => {
    // South is between 170° and 190°
    return (angle >= 170 && angle <= 190);
  };

  const isFacingSouth = () => {
    return (angle >= -100 && angle <= -80);
  }

  return (
    <View style={styles.compassContainer}>
      <Text style={styles.compassText}>Direction: {angle.toFixed(2)}°</Text>
      {isFacingWest() && (
        <Text style={styles.directionText}>You are facing West!</Text>
      )}
      {isFacingSouth() && (
        <Text style={styles.directionText}>You are facing South! Please go ahead</Text>
      )}
      {isFacingEast() && (
        <Text style={styles.directionText}>You are facing East!</Text>
      )}
      {/* Add a visual compass here, e.g., an arrow pointing in the direction */}
      <View style={[styles.arrow, { transform: [{ rotate: `${angle}deg` }] }]}>
        <View style={styles.arrowHead} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassText: {
    fontSize: 18,
  },
  directionText: {
    fontSize: 18,
    color: 'green',
  },
  arrow: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: 'transparent',
    borderTopWidth: 25,
    borderTopColor: 'red',
  },
});

export default Compass;
