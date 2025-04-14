import React, { useState } from 'react';
import { View, Button, StyleSheet, Image } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Compass from '../../components/Compass';
import floorplan from '../../image/floorplan.jpg';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = React.createRef<CameraView | null>(null);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const savedHighlightedAreas = [{"color": "#315C5A", "height": 46.666666666666686, "index": 0, "width": 52.666656494140625, "x": 17, "y": 81}, {"color": "#571FCB", "height": 45.66667175292969, "index": 1, "width": 64, "x": 83.66665649414062, "y": 97.66665649414062}, {"color": "#0F319E", "height": 54.99999491373697, "index": 2, "width": 60, "x": 164, "y": 92}, {"color": "#0DE6CC", "height": 55.33333333333334, "index": 3, "width": 92.33334350585938, "x": 235.66665649414062, "y": 95.66665649414062}]
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {
        quality: 1,
        base64: true,
        exif: false,
      };
      const takedPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(takedPhoto);
    }
  };

  const handleImageClick = () => {
    setIsImageEnlarged(!isImageEnlarged);
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.compassContainer}>
          <Compass />
        </View>
        <Image
          source={floorplan}
          style={isImageEnlarged ? styles.enlargedImage : styles.smallImage}
          onTouchStart={handleImageClick}
        />
        <View style={styles.buttonContainer}>
          <Button title="Toggle Camera" onPress={toggleCameraFacing} />
          <Button title="Take Photo" onPress={handleTakePhoto} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  smallImage: {
    position: 'absolute',
    top: 20, // Position at the top right corner
    right: 20,
    width: 150, // Small width
    height: 150, // Small height
    resizeMode: 'contain',
  },
  enlargedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  compassContainer: {
    position: 'absolute',
    bottom: 180, // Adjust this value to move the compass up or down
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
});
