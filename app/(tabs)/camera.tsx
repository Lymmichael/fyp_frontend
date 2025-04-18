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
import { UploadS3 } from '@/components/UploadS3'; // adjust path as needed

const savedHighlightedArea = [{"accessibleNode": [7, 5, 4], "color": "#34B3BB", "height": 78, "id": 0, "name": "Bedroom1", "width": 56.66667175292969, "x": 24.333328247070312, "y": 66.33332824707031}, {"accessibleNode": [5, 6], "color": "#6C0D94", "height": 52.333343505859375, "id": 1, "name": "Bedroom2", "width": 40, "x": 92.33332824707031, "y": 89.66665649414062}, {"accessibleNode": [3, 5, 7], "color": "#FD0373", "height": 45, "id": 2, "name": "Kitchen", "width": 33, "x": 119.66665649414062, "y": 2}, {"accessibleNode": [0, 1], "color": "#A634A4", "height": 38.33332824707031, "id": 3, "name": "Living room", "width": 33.333343505859375, "x": 77.66665649414062, "y": 5}, {"accessibleNode": [0, 2], "color": "#319398", "height": 46, "id": 4, "name": "entry", "width": 29.333328247070312, "x": 29, "y": 6}, {"accessibleNode": [1, 2], "color": "#EDCA97", "height": 102, "id": 5, "name": "Dining room", "width": 40.33332824707031, "x": 168, "y": 44.33332824707031}, {"accessibleNode": [1, 3], "color": "#8DEEBD", "height": 47, "id": 6, "name": "Room", "width": 97, "x": 116.33332824707031, "y": 152.3333282470703}, {"accessibleNode": [3, 5, 4], "color": "#3A013C", "height": 60.666656494140625, "id": 7, "name": "Toilet", "width": 41, "x": 216.3333282470703, "y": 83}, {"accessibleNode": [5], "color": "#EC14D6", "height": 121, "id": 8, "name": "Room2", "width": 54, "x": 264.3333282470703, "y": 28}];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = React.createRef<CameraView | null>(null);
  const [iImageMSmaller, setiImageSmaller] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scanedResult, setScanedResult] = useState(0); 
  
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
      console.log("tesiing")
      // Upload the taken photo
      if (takenPhoto) {
        const fileUri = takenPhoto.uri;
        const fileName = 'testing_image/testingPhoto.jpg';  // Specify the desired file name in S3
        UploadS3(fileUri, 'fyp-final', fileName)
          .then(result => {
            console.log('Upload successful:', result);
          })
          .catch(error => {
            console.error('Upload failed:', error);
          });
      }
    }
  };


  const handleFloorPlanClick = () => {
    setiImageSmaller(!iImageMSmaller);
  };

  const handleNodeSelection = (node: any) => {
    if(selectedNode == node) {
      setSelectedNode(null)
    } else {
    setSelectedNode(node);
    }
    console.log(`Selected Node: ${node.name}`);
  };

  const imageWidth = iImageMSmaller ? 175 : 350;
  const imageHeight = iImageMSmaller ? 100 : 200;
  const containerStyle = {
    position: 'absolute' as const,
    top: 50,
    right: iImageMSmaller ? 20 : undefined,
    left: iImageMSmaller ? undefined : 20,
    zIndex: iImageMSmaller ? 20 : 10,
  };

  const filteredSavedHighlightedArea = (savedHighlightedArea: any[], id: number | undefined, id2: number | undefined) => {
    if (id === undefined && id2 === undefined) {
      return [];
    }

    return savedHighlightedArea.filter((area: any) => area.id === id || area.id === id2);
  };

  const chosenId = selectedNode ? selectedNode.id : undefined;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom = {0.01}>
        <View style={styles.compassContainer}>
          <Compass />
        </View>

        <View style={containerStyle}>
          <TouchableOpacity onPress={handleFloorPlanClick} activeOpacity={0.8}>
            <Image source={floorplan} style={{ width: imageWidth, height: imageHeight }} />
          </TouchableOpacity>

          {filteredSavedHighlightedArea(savedHighlightedArea, scanedResult, chosenId).map((area) => (
            <View
              key={area.id}
              style={[
                styles.highlight,
                {
                  left: iImageMSmaller ? area.x / 2 : area.x,
                  top: iImageMSmaller ? area.y / 2 : area.y,
                  width: iImageMSmaller ? area.width / 2 : area.width,
                  height: iImageMSmaller ? area.height / 2 : area.height,
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
          <Text style={{ color: savedHighlightedArea[scanedResult].color }}>
            {savedHighlightedArea[scanedResult].name}
          </Text>
          <TouchableOpacity onPress={() => setIsSearching(false)}>
            <AntDesign name="closecircle" size={30} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.nodeList}>
          <View style={containerStyle} style={{ width: 350, height: 200 }}>
            <Image source={floorplan} style={{ width: 350, height: 200 }} />

            {filteredSavedHighlightedArea(savedHighlightedArea, scanedResult, chosenId).map((area) => (
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
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            padding: 5
          }}>Select your destination:</Text>
          {savedHighlightedArea
            .filter(node => node.id !== scanedResult)  // exclude nodes where id equals xx
            .map((node) => (
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

        {/* {photo && (
          <View style={styles.photoPreview}>
            <Text style={{ marginBottom: 5 }}>Photo Preview:</Text>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
          </View>
        )} */}
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
    maxHeight: screenHeight * 0.8,
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
