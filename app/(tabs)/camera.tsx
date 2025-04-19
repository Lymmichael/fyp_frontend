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
  ActivityIndicator
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Compass from '../../components/Compass';
import floorplan from '../../image/floorplan.jpg';
import { AntDesign } from '@expo/vector-icons';
import { UploadS3 } from '@/components/UploadS3'; // adjust path as needed
import ImageDetect from '@/api/imageDetect';
import ShortestPathFinder, { findShortestPath } from '@/components/Path';


const savedHighlightedArea = [{ "accessibleNode": [1, 15, 7], "color": "#09D7FB", "height": 62.666656494140625, "id": 0, "name": "A", "width": 73.66667175292969, "x": 148.3333282470703, "y": 89 }, { "accessibleNode": [0, 2, 16], "color": "#82A59E", "height": 55, "id": 1, "name": "B", "width": 89.66667175292969, "x": 226.3333282470703, "y": 88.33332824707031 }, { "accessibleNode": [1], "color": "#B4F8A0", "height": 47.66667175292969, "id": 2, "name": "C", "width": 48, "x": 265.3333282470703, "y": 36.666656494140625 }, { "accessibleNode": [7], "color": "#7497C3", "height": 36.666656494140625, "id": 3, "name": "D", "width": 49, "x": 209.3333282470703, "y": 35 }, { "accessibleNode": [13, 10], "color": "#D68044", "height": 25, "id": 4, "name": "E", "width": 33, "x": 286.6666564941406, "y": 3.3333282470703125 }, { "accessibleNode": [8, 10, 13], "color": "#E5787F", "height": 20, "id": 5, "name": "F", "width": 49.33332824707031, "x": 234, "y": 6 }, { "accessibleNode": [9, 12, 15], "color": "#B33AF0", "height": 22.333343505859375, "id": 6, "name": "G", "width": 48, "x": 171, "y": 4.666656494140625 }, { "accessibleNode": [1, 2, 6], "color": "#8B6193", "height": 49.666656494140625, "id": 7, "name": "H", "width": 37.33332824707031, "x": 170, "y": 35 }, { "accessibleNode": [13, 14, 16, 9], "color": "#8D7549", "height": 27.666671752929688, "id": 8, "name": "I", "width": 76.66665649414062, "x": 86, "y": 58.666656494140625 }, { "accessibleNode": [0, 2, 5, 14], "color": "#295D74", "height": 49.66667175292969, "id": 9, "name": "J", "width": 48.66667175292969, "x": 111.33332824707031, "y": 3.3333282470703125 }, { "accessibleNode": [9, 13, 14, 7], "color": "#E2A8F0", "height": 37.33332824707031, "id": 10, "name": "K", "width": 39.333343505859375, "x": 66.66665649414062, "y": 10.333328247070312 }, { "accessibleNode": [4, 10, 12, 15], "color": "#D9BF0B", "height": 37, "id": 11, "name": "L", "width": 28.333328247070312, "x": 29.333328247070312, "y": 9 }, { "accessibleNode": [4, 10, 11, 14], "color": "#92B5D1", "height": 87.66667175292969, "id": 12, "name": "M", "width": 51, "x": 24.333328247070312, "y": 57.666656494140625 }, { "accessibleNode": [10, 14, 6], "color": "#BB3075", "height": 39, "id": 13, "name": "N", "width": 84, "x": 19.666656494140625, "y": 154.66665649414062 }, { "accessibleNode": [2, 12, 15], "color": "#31261E", "height": 57, "id": 14, "name": "O", "width": 52.66667175292969, "x": 84.66665649414062, "y": 89 }, { "accessibleNode": [6, 9], "color": "#0A907A", "height": 36.333343505859375, "id": 15, "name": "P", "width": 95.33332824707031, "x": 118, "y": 159.66665649414062 }, { "accessibleNode": [9, 12, 14, 15], "color": "#0652C4", "height": 43, "id": 16, "name": "Q", "width": 92.33332824707031, "x": 228.3333282470703, "y": 154 }]

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

  const model = "arn:aws:rekognition:us-east-1:354392660622:project/fyp/version/fyp.2025-04-16T14.57.26/1744786647466"
  const bucket = 'fyp-final'
  const testingPhoto = 'testing_image/testingPhoto.jpg'
  const min_confidence = 40

  const handleTakePhoto = async () => {
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

  const filteredSavedHighlightedArea = (savedHighlightedArea: any[], id?: number, id2?: number) => {
    if (id === undefined && id2 === undefined) {
      return [];
    }
  
    const path = findShortestPath(savedHighlightedArea, id || 0, id2 || 0);
  
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
});
