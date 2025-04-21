import React, { useState, useRef, useEffect } from 'react';

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto'; // Import polyfills first
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
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Compass from '../../components/Compass';
import floorplan from '../../image/floorplan.jpg';
import { AntDesign } from '@expo/vector-icons';
import { UploadS3 } from '@/components/UploadS3'; // adjust path as needed
import ImageDetect from '@/api/imageDetect';
import ShortestPathFinder, { findShortestPath } from '@/components/Path';
import CalculateOrientation from '@/components/CountDirection';

const savedHighlightedArea = [{ "accessibleNode": [6], "color": "#0B886B", "height": 47, "id": 0, "name": "A", "width": 46.33332824707031, "x": 14.333328247070312, "y": 5.666656494140625 }, { "accessibleNode": [7], "color": "#FA3D6A", "height": 41, "id": 1, "name": "B", "width": 42.333343505859375, "x": 67.66665649414062, "y": 10 }, { "accessibleNode": [7], "color": "#F82BCF", "height": 47.66667175292969, "id": 2, "name": "C", "width": 30.333328247070312, "x": 119, "y": 5.666656494140625 }, { "accessibleNode": [9, 4], "color": "#1092D6", "height": 17, "id": 3, "name": "D", "width": 50.666656494140625, "x": 171, "y": 8.333328247070312 }, { "accessibleNode": [3, 5], "color": "#7E3BC4", "height": 28.333343505859375, "id": 4, "name": "E", "width": 43.33332824707031, "x": 234.3333282470703, "y": 0.666656494140625 }, { "accessibleNode": [4], "color": "#EFFC80", "height": 24.333328247070312, "id": 5, "name": "F", "width": 22.333328247070312, "x": 296, "y": 2.3333282470703125 }, { "accessibleNode": [0, 7, 16], "color": "#DC982A", "height": 88, "id": 6, "name": "G", "width": 50.33332824707031, "x": 25.333328247070312, "y": 53.666656494140625 }, { "accessibleNode": [1, 2, 6, 8, 9], "color": "#219C23", "height": 31, "id": 7, "name": "H", "width": 76, "x": 84.33332824707031, "y": 55.666656494140625 }, { "accessibleNode": [7, 16], "color": "#CBFB71", "height": 48.666656494140625, "id": 8, "name": "I", "width": 51.666656494140625, "x": 84, "y": 94 }, { "accessibleNode": [3, 7, 10, 12], "color": "#D96283", "height": 55.333343505859375, "id": 9, "name": "J", "width": 38.33332824707031, "x": 169.3333282470703, "y": 30.666656494140625 }, { "accessibleNode": [9], "color": "#01DA46", "height": 38.333343505859375, "id": 10, "name": "K", "width": 41.33332824707031, "x": 217, "y": 35.666656494140625 }, { "accessibleNode": [13], "color": "#288051", "height": 54.333343505859375, "id": 11, "name": "L", "width": 44, "x": 264.6666564941406, "y": 30.666656494140625 }, { "accessibleNode": [9, 15, 13], "color": "#C6AF27", "height": 55.66667175292969, "id": 12, "name": "M", "width": 74, "x": 142.66665649414062, "y": 91.33332824707031 }, { "accessibleNode": [11, 14, 12], "color": "#EEACFF", "height": 54.33332824707031, "id": 13, "name": "N", "width": 97.66667175292969, "x": 218.66665649414062, "y": 89 }, { "accessibleNode": [13], "color": "#EDA0B2", "height": 38.66667175292969, "id": 14, "name": "O", "width": 100, "x": 220, "y": 157.3333282470703 }, { "accessibleNode": [12, 16], "color": "#451636", "height": 44, "id": 15, "name": "P", "width": 95.66665649414062, "x": 112, "y": 152.3333282470703 }, { "accessibleNode": [6, 8, 15], "color": "#679BD4", "height": 35.66667175292969, "id": 16, "name": "Q", "width": 84.33332824707031, "x": 18.333328247070312, "y": 161.66665649414062 }]

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const cameraRef = React.createRef<CameraView | null>(null);
  const [iImageMSmaller, setiImageSmaller] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scanedResult, setScanedResult] = useState(-1);
  const [isLoading, setIsLoading] = useState(false)
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const [allocationOrder, setAllocationOrder] = useState<number>(1)
  const path = findShortestPath(savedHighlightedArea, scanedResult, selectedNode?.id) || []

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

  const model = "arn:aws:rekognition:us-east-1:354392660622:project/fyp_engine_10F/version/fyp_engine_10F.2025-04-20T23.15.17/1745162117151"
  const bucket = 'fyp-final'
  const testingPhoto = 'testing_image/testingPhoto.jpg'
  const min_confidence = 40

  const handleTakePhoto = async () => {
    setAllocationOrder(1)
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(takenPhoto);
      // Upload the taken photo
      if (takenPhoto) {
        const fileUri = takenPhoto.uri;
        const fileName = 'testing_image/testingPhoto.jpg';  // Specify the desired file name in S3
        try {
          setIsLoading(true)
          await UploadS3(fileUri, 'fyp-final', fileName);
          const scanResult = await ImageDetect(model, bucket, testingPhoto, min_confidence);
          console.log('scanResult is:')
          console.log(scanResult)
          setScanedResult(
            savedHighlightedArea.find(item => item.name === scanResult?.label)?.id ?? -1
          );
          setIsLoading(false)
        } catch (error) {
          console.error("Error uploading to S3:", error);
        }
      }
    }
  };


  const handleFloorPlanClick = () => {
    setiImageSmaller(!iImageMSmaller);
  };

  const handleNodeSelection = (node: any) => {
    if (selectedNode == node) {
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

  const filteredSavedHighlightedArea = (savedHighlightedArea: any[], id?: number | null, id2?: number | null) => {
    if (id === undefined && id2 === undefined) {
      return [];
    }
    const path = findShortestPath(savedHighlightedArea, id, id2);

    if (path && path.length > 0) {
      // Return all nodes whose id is in the path array
      return savedHighlightedArea.filter(area => path.includes(area.id));
    }

    // If no path found, fallback: return nodes matching id or id2
    return savedHighlightedArea.filter(area => area.id === id || area.id === id2);
  };

  const chosenId = selectedNode ? selectedNode.id : undefined;
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom={0.01}>
        <View style={styles.compassContainer}>
          {scanedResult && selectedNode && path.length > 0 && allocationOrder < path.length &&
            <>
              <Compass direction={
                CalculateOrientation(
                  savedHighlightedArea,
                  path[allocationOrder - 1],
                  path[allocationOrder]
                )
              } />
            </>
          }
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

        {
          path.length > 0 && allocationOrder < path.length && (
            <TouchableOpacity
              onPress={
                () => {
                  setAllocationOrder(allocationOrder + 1)
                  console.log("allocationOrder is: ")
                  console.log(allocationOrder)
                  if(allocationOrder == path.length - 1 ) {
                    Alert.alert("You have arrived your destination!")
                  }
                }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>Arrived {savedHighlightedArea[path[allocationOrder]].name}</Text>
            </TouchableOpacity>
          )
        }
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <AntDesign name="retweet" size={44} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <AntDesign name="camera" size={44} color="black" />
          </TouchableOpacity>
        </View>
        {isLoading &&
          <ActivityIndicator
            size="large"
            color="black"
            style={{
              flex: 1,                   // Take full screen height
              justifyContent: 'center',  // Center vertically
              alignItems: 'center',
            }}
          />
        }
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
          {
            scanedResult !== -1 ? (
              <Text style={{ color: savedHighlightedArea[scanedResult].color }}>
                {savedHighlightedArea[scanedResult].name}
              </Text>
            ) : (
              <Text>
                Please scan again
              </Text>
            )
          }
          <TouchableOpacity onPress={() => setIsSearching(false)}>
            <AntDesign name="closecircle" size={30} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.nodeList} contentContainerStyle={{ paddingBottom: 30 }}>
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

        <ShortestPathFinder
          savedHighlightedArea={savedHighlightedArea}
          startId={scanedResult}
          endId={selectedNode?.id}
        />
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
    maxHeight: screenHeight * 0.78,
    flexGrow: 1,

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
  nextButton: {
    position: 'absolute',
    bottom: 70,          // distance from the bottom of the screen
    left: 20,            // distance from the left edge
    right: 20,           // distance from the right edge
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },  
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
