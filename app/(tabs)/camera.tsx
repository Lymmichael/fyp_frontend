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
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Compass from '../../components/Compass';
import floorplan from '../../image/ulib_floorplan.png';
import { AntDesign } from '@expo/vector-icons';
import { UploadS3 } from '@/components/UploadS3'; // adjust path as needed
import ImageDetect from '@/api/imageDetect';
import ShortestPathFinder, { findShortestPath } from '@/components/Path';
import CalculateOrientation from '@/components/CountDirection';

const savedHighlightedArea = [
  {
      "accessibleNode": [
          1
      ],
      "color": "#901385",
      "height": 20.666656494140625,
      "id": 0,
      "name": "lobby",
      "width": 38.66667175292969,
      "x": 208.3333282470703,
      "y": 6
  },
  {
      "accessibleNode": [
          0,
          3,
          2
      ],
      "color": "#DDE82A",
      "height": 24.333328247070312,
      "id": 1,
      "name": "study area",
      "width": 52,
      "x": 151,
      "y": 4.3333282470703125
  },
  {
      "accessibleNode": [1,4],
      "color": "#79D0D4",
      "height": 55.66667175292969,
      "id": 2,
      "name": "lift",
      "width": 23.333328247070312,
      "x": 160,
      "y": 31.333328247070312
  },
  {
      "accessibleNode": [
          1
      ],
      "color": "#0D3A41",
      "height": 60.666656494140625,
      "id": 3,
      "name": "books",
      "width": 14,
      "x": 187.66665649414062,
      "y": 29
  },
  {
      "accessibleNode": [
          2,
          5
      ],
      "color": "#74C423",
      "height": 47,
      "id": 4,
      "name": "exhibition",
      "width": 38.33332824707031,
      "x": 166,
      "y": 97.33332824707031
  },
  {
      "accessibleNode": [
          4
      ],
      "color": "#C2824D",
      "height": 41,
      "id": 5,
      "name": "reading area",
      "width": 45.33332824707031,
      "x": 162,
      "y": 153.3333282470703
  }
]

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
  let path = findShortestPath(savedHighlightedArea, scanedResult, selectedNode?.id) || []


  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(null);

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

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300; // Adjust delay as needed

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      toggleCameraFacing();
      setTapCount(0); // Reset tap count
    } else {
      setTapCount(1);
    }

    setLastTap(now);
  };


  const model = "arn:aws:rekognition:us-east-1:354392660622:project/fyp_ulib/version/fyp_ulib.2025-04-21T01.56.20/1745171780107"
  const bucket = 'fyp-final'
  const testingPhoto = 'testing_image/testingPhoto.jpg'
  const min_confidence = 40

  const handleTakePhoto = async () => {
    // setPath([])
    setAllocationOrder(1)
    // setScanedResult(-1)
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
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} zoom={0.01}>
          <View style={styles.compassContainer}>
            {scanedResult && selectedNode && path.length > 0 && allocationOrder < path.length &&
              <>
                <Compass direction={((
                  CalculateOrientation(
                    savedHighlightedArea,
                    path[allocationOrder - 1],
                    path[allocationOrder]
                  ) || 0) - 90 + 45 + 180) % 360
                } />
              </>
            }
          </View>
          <View style={containerStyle}>
            <TouchableOpacity onPress={handleFloorPlanClick} activeOpacity={0.8}>
              <Image source={floorplan} style={{ resizeMode: 'contain', width: imageWidth, height: imageHeight }} />
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
                    if (allocationOrder == path.length - 1) {
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
            {/* <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <AntDesign name="retweet" size={44} color="black" />
              </TouchableOpacity> */}
            {/* <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
                <AntDesign name="camera" size={44} color="black" />
              </TouchableOpacity> */}
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle} />
              </View>
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
      </TouchableWithoutFeedback>

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
            <Image
              source={floorplan}
              style={{
                width: 350,
                height: 200,
                resizeMode: 'contain'
              }} />

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
  doubleTapArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flex: 1,
  },
  captureButton: {
    alignItems: 'center',
  },
  outerCircle: {
    borderWidth: 4,
    borderColor: 'white',
    borderRadius: 50,
    width: 80,
    height: 80,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: 'white',
    borderRadius: 40,
    width: 68,
    height: 68,
  },
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
    bottom: 110,          // distance from the bottom of the screen
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
    fontWeight: '600'
  },
});
