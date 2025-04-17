import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import AntDesign from '@expo/vector-icons/AntDesign';

const Compass = () => {
  const [angle, setAngle] = useState<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      subscription = await Location.watchHeadingAsync((heading) => {
        const headingAngle = heading.trueHeading ?? heading.magHeading ?? 0;
        setAngle(headingAngle);
      });
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Convert angle to compass direction
  const getDirection = (deg: number | null): string => {
    if (deg === null) return '';

    if (deg >= 337.5 || deg < 22.5) return 'N';
    if (deg >= 22.5 && deg < 67.5) return 'NE';
    if (deg >= 67.5 && deg < 112.5) return 'E';
    if (deg >= 112.5 && deg < 157.5) return 'SE';
    if (deg >= 157.5 && deg < 202.5) return 'S';
    if (deg >= 202.5 && deg < 247.5) return 'SW';
    if (deg >= 247.5 && deg < 292.5) return 'W';
    if (deg >= 292.5 && deg < 337.5) return 'NW';

    return '';
  };

  return (
    <>
      {
        getDirection(angle) == 'N' && 
        <AntDesign name="arrowup" size={250} color="red" />
      }

      <View style={styles.compassContainer}>
        <Text style={styles.compassText}>
          Direction: {angle !== null ? angle.toFixed(2) + '°' : 'Loading...'}
        </Text>

        <Text style={styles.directionText}>
          {angle !== null ? `You are facing ${getDirection(angle)}` : ''}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  compassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'white',
  },
  compassText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    overflow: 'hidden',
  },
  directionText: {
    fontSize: 28,
    color: 'black',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
  arrow: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
});

export default Compass;
