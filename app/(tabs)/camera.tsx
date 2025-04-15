import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Compass from '../../components/Compass';
import floorplan from '../../image/floorplan.jpg';
import { AntDesign } from '@expo/vector-icons';

const savedHighlightedArea = [
  { accessibleNode: [], color: '#39889A', height: 48.66, id: 0, name: 'room number 1', width: 47, x: 89.66, y: 92 },
  { accessibleNode: [], color: '#A5B571', height: 80.33, id: 1, name: 'room 2', width: 50.66, x: 26.66, y: 62.33 },
  { accessibleNode: [], color: '#9F65A9', height: 30.66, id: 2, name: 'room 3', width: 38.33, x: 218.33, y: 42 },
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = React.createRef<CameraView | null>(null);
  const [iImageSmaller, setiImageSmaller] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Animated value for slide-down overlay
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;

  useEffect(() => {
    if (isSearching) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSearching]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(takenPhoto);
    }
  };

  const handleFloorPlanClick = () => {
    setiImageSmaller(!iImageSmaller);
  };

  const handleNodeSelection = (node: any) => {
    setSelectedNode(node);
    console.log(`Selected Node: ${node.name}`);
  };

  const imageWidth = iImageSmaller ? 175 : 350;
  const imageHeight = iImageSmaller ? 100 : 200;
  const containerStyle = {
    position: 'absolute' as const,
    top: 50,
    right: iImageSmaller ? 20 : undefined,
    left: iImageSmaller ? undefined : 20,
    zIndex: iImageSmaller ? 20 : 10,
  };

  const filteredSavedHighlightedArea = (savedHighlightedArea: any[], id: number, id2?: number) => {
    if (id2 !== undefined) {
      return savedHighlightedArea.filter((area: any) => area.id === id || area.id === id2);
    }
    return savedHighlightedArea.filter((area: any) => area.id === id);
  };

  const now = 1;
  const chosenId = selectedNode ? selectedNode.id : undefined;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.compassContainer}>
          <Compass />
        </View>

        <View style={containerStyle}>
          <TouchableOpacity onPress={handleFloorPlanClick} activeOpacity={0.8}>
            <Image source={floorplan} style={{ width: imageWidth, height: imageHeight }} />
          </TouchableOpacity>

          {filteredSavedHighlightedArea(savedHighlightedArea, now, chosenId).map((area) => (
            <View
              key={area.id}
              style={[
                {
                  left: iImageSmaller ? area.x / 2 : area.x,
                  top: iImageSmaller ? area.y / 2 : area.y,
                  width: iImageSmaller ? area.width / 2 : area.width,
                  height: iImageSmaller ? area.height / 2 : area.height,
                  borderColor: area.color,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.nodeSelectionContainer}>
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => setIsSearching(true)} // Show overlay on search button press
          >
            <AntDesign name="search1" size={30} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <AntDesign name="retweet" size={44} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <AntDesign name="camera" size={44} color="black" />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Animated overlay for search and node selection */}
      <Animated.View
        style={[
          styles.overlay,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents={isSearching ? 'auto' : 'none'} // Disable touches when hidden
      >
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayTitle}>Currently you are at:</Text>
          <TouchableOpacity onPress={() => setIsSearching(false)}>
            <AntDesign name="closecircle" size={30} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.nodeList}>
          <View style={containerStyle} style={{ width: 350, height: 200 }}>
            <Image source={floorplan} style={{ width: 350, height: 200 }} />

            {filteredSavedHighlightedArea(savedHighlightedArea, now, chosenId).map((area) => (
              <View
                key={area.id}
                style={[
                  styles.highlight,
                  {
                    left: area.x,
                    top: area.y,
                    width: area.width,
                    height: area.height,
                    borderColor: area.color,
                  },
                ]}
              />
            ))}
          </View>
          {savedHighlightedArea.map((node) => (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.nodeButton,
                selectedNode?.id === node.id && { backgroundColor: '#6fa8dc' },
              ]}
              onPress={() => handleNodeSelection(node)}
            >
              <Text style={styles.nodeName}>{node.name || `Node ${node.id}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {photo && (
          <View style={styles.photoPreview}>
            <Text style={{ marginBottom: 5 }}>Photo Preview:</Text>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  highlight: { position: 'absolute', borderWidth: 2 },
  compassContainer: {
    position: 'absolute',
    bottom: 180,
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
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: 'gray',
    borderRadius: 10,
  },
  nodeSelectionContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    flexDirection: 'column',
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'white',
    zIndex: 1000,
    padding: 20,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    top: 30,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  nodeList: {
    top: 30,
    maxHeight: screenHeight * 0.5,
  },
  nodeButton: {
    backgroundColor: '#ccc',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
  },
  nodeName: {
    color: 'black',
    fontWeight: 'bold',
  },
  photoPreview: {
    marginTop: 20,
    alignItems: 'center',
  },
  photo: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
  },
});
