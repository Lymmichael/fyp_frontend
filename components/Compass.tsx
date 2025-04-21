import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { AntDesign } from '@expo/vector-icons';

interface CompassProps {
  direction: number | null;
}

const Compass: React.FC<CompassProps> = ({ direction }) => {
  const [angle, setAngle] = useState<number | null>(null);
  const [arrowDirection, setArrowDirection] = useState<string>(''); // Initialize with an empty string

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

  useEffect(() => {
    if (direction !== null) {
      if (direction >= 337.5 || direction < 22.5) {
        setArrowDirection('N');
      } else if (direction >= 22.5 && direction < 67.5) {
        setArrowDirection('NE');
      } else if (direction >= 67.5 && direction < 112.5) {
        setArrowDirection('E');
      } else if (direction >= 112.5 && direction < 157.5) {
        setArrowDirection('SE');
      } else if (direction >= 157.5 && direction < 202.5) {
        setArrowDirection('S');
      } else if (direction >= 202.5 && direction < 247.5) {
        setArrowDirection('SW');
      } else if (direction >= 247.5 && direction < 292.5) {
        setArrowDirection('W');
      } else if (direction >= 292.5 && direction < 337.5) {
        setArrowDirection('NW');
      }
    }
  }, [direction]);

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
    <View style={styles.container}>
      {arrowDirection === getDirection(angle) && (
        <AntDesign name="arrowup" size={250} color="red" />
      )}

      <View style={styles.compassContainer}>
        <Text style={styles.compassText}>
          Direction: {angle !== null ? angle.toFixed(2) + '°' : 'Loading...'}
        </Text>

        <Text style={styles.directionText}>
          {angle !== null ? `You are facing ${getDirection(angle)}` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  compassText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  directionText: {
    fontSize: 18,
    color: 'black',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
});

export default Compass;
