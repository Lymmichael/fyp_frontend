import React, { useState } from 'react';
import { View, Button, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';
import LoginPage from '../../components/Login';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [orientation, setOrientation] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightedAreas, setHighlightedAreas] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]);
  const [usedColors, setUsedColors] = useState(new Set()); // Set to store unique colors
  const [uploadedVideos, setUploadedVideos] = useState({}); // Object to store uploaded videos for each area
  const [firstProcedure, setFirstProcedure] = useState(true);
  const [secondProcedure, setSecondProcedure] = useState(false);
  const [thirdProcedure, setThirdProcedure] = useState(false);
  const [areaNames, setAreaNames] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedAreasToGo, setSelectedAreasToGo] = useState({});
  const [uploadSuccess, setUplaodSuccess] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  if (!isLogin) {
    return (<LoginPage />);
  }
  const openImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access media library is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setSelectedImage(pickerResult.assets[0].uri);
    }
  };

  const handleTouchStart = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    setStartX(locationX);
    setStartY(locationY);
    setEndX(locationX);
    setEndY(locationY);
    setIsHighlighting(true);
  };

  const handleTouchMove = (event) => {
    if (isHighlighting) {
      const { locationX, locationY } = event.nativeEvent;
      setEndX(locationX);
      setEndY(locationY);
    }
  };

  const handleTouchEnd = () => {
    setIsHighlighting(false);
    const area = {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
      color: getRandomColor(), // Generate a random color for each area
      id: highlightedAreas.length, // Unique ID for each area
      name: '', // Initialize name as empty string
      accessibleNode: []
    };
    setHighlightedAreas((prevAreas) => [...prevAreas, area]);
    setUsedColors((prevColors) => new Set([...prevColors, area.color])); // Add color to set
    console.log('Highlighted Area:', area);
  };

  const saveHighlightedAreas = () => {
    setSavedAreas(highlightedAreas);
    console.log(savedAreas);
  };

  const clearSavedAreas = () => {
    setSavedAreas([]);
    setHighlightedAreas([]); // Optionally clear highlighted areas as well
    setUsedColors(new Set()); // Clear used colors
    setUploadedVideos({}); // Clear uploaded videos
  };

  const updateAreaNames = () => {
    const updatedAreas = highlightedAreas.map((area) => ({ ...area, name: areaNames[area.id] }));
    setHighlightedAreas(updatedAreas); // Update highlightedAreas with names
    setSavedAreas(updatedAreas); // Update savedAreas with names
    console.log(highlightedAreas);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const uploadVideoForArea = async (areaId) => {
    const permissionResult = await MediaLibrary.requestPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access media library is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!pickerResult.canceled) {
      const videoUri = pickerResult.assets[0].uri;
      setUploadedVideos((prevVideos) => ({ ...prevVideos, [areaId]: videoUri }));
      // await uploadVideo(videoUri);
    }
  };
  const handleOrientationChange = (value: number) => {
    setOrientation(value);
  };
  
  
  const uploadVideo = async (videoUri) => {
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      name: 'video.mp4',
      type: 'video/mp4',
    });
  
    // try {
    //   const response = await fetch('https://your-api.com/upload', {
    //     method: 'POST',
    //     body: formData,
    //     headers: {
    //       'Content-Type': 'multipart/form-data', // Important for file uploads
    //       // Add any authorization headers if needed, e.g.:
    //       // 'Authorization': 'Bearer your-token',
    //     },
    //   });
  
    //   if (!response.ok) {
    //     throw new Error(`Upload failed with status ${response.status}`);
    //   }
  
    //   const data = await response.json();
    //   console.log('Upload successful:', data);
    //   return data; // Return response data if needed
    // } catch (error) {
    //   console.error('Error uploading video:', error);
    //   throw error; // Rethrow if you want to handle it elsewhere
    // }
  };
  

  const handleSelectArea = (area) => {
    setSelectedArea(area);
    setModalVisible(true);
    setSelectedAreasToGo((prev) => ({ ...prev, [area.id]: area.accessibleNode }));
  };

  const handleToggleAreaToGo = (areaId) => {
    if (!selectedArea) return;

    const currentSelection = selectedAreasToGo[selectedArea.id] || [];
    const isAreaSelected = currentSelection.includes(areaId);

    let updatedSelection;
    if (isAreaSelected) {
      updatedSelection = currentSelection.filter((id) => id !== areaId);
    } else {
      updatedSelection = [...currentSelection, areaId];
    }

    setSelectedAreasToGo((prev) => ({
      ...prev,
      [selectedArea.id]: updatedSelection,
    }));
    // Update savedAreas state
    setSavedAreas((prevAreas) =>
      prevAreas.map((area) => {
        if (area.id === selectedArea.id) {
          return {
            ...area,
            accessibleNode: updatedSelection,
          };
        }
        return area;
      })
    );
  };
  const pickVideo = async (areaName) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        console.log(`Picked video for ${areaName}:`, result);
        // You can do whatever you want with the video here
        // For example, save the URI or show a preview
      } else {
        console.log('User cancelled video picker');
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  if (firstProcedure) {
    return (
      <>
        <View style={styles.container}>
          <View style={{ top: 20 }}>

            <Button title="Upload Photo" onPress={openImagePicker} />
            <Button title="Save Highlighted Areas" onPress={saveHighlightedAreas} />
            <Button title="Clear Saved Areas" onPress={clearSavedAreas} />
            {selectedImage && (
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: 350, height: 200 }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
                {isHighlighting && (
                  <View
                    style={[
                      styles.highlight,
                      {
                        left: Math.min(startX, endX),
                        top: Math.min(startY, endY),
                        width: Math.abs(endX - startX),
                        height: Math.abs(endY - startY),
                        borderColor: getRandomColor(), // Use a random color for the current highlight
                      },
                    ]}
                  />
                )}
                {highlightedAreas.map((area, index) => (
                  <React.Fragment key={index}>
                    <View
                      style={[
                        styles.highlight,
                        {
                          left: area.x,
                          top: area.y,
                          width: area.width,
                          height: area.height,
                          borderColor: area.color, // Use the saved color for each area
                        },
                      ]}
                    />
                  </React.Fragment>
                ))}
              </View>
            )}
            {savedAreas && <Text style={{ color: 'white' }}>
              Number of highlighted area: {usedColors.size}
            </Text>}
            {
              selectedImage &&
              <View>
                <Text style={{ color: 'white' }}>What is the orientation if pointing upward: {orientation}</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={359}
                  step={1}
                  value={orientation}
                  onValueChange={handleOrientationChange}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#f5f5f5"
                />
                <Text style={{ color: 'white' }}> 0 is North; 90 is East; 180 is South and 270 is West</Text>
              </View>
            }
            <View style={{ marginBottom: 50 }}>
              <Button
                title='Next'
                onPress={
                  () => {
                    if (!selectedImage) {
                      Alert.alert("Please upload the image");
                    } else if (savedAreas.length === 0) {
                      Alert.alert("Please highlight area you want");
                    } else {
                      console.log(savedAreas);
                      setFirstProcedure(false);
                      setSecondProcedure(true);
                    }
                  }
                }
              />
            </View>

          </View>
        </View>
      </>
    );
  } else if (secondProcedure) {
    return (
      <ScrollView style={styles.container}>
        <View style={{ top: 20 }}>

          <Button
            title='previous'
            onPress={
              () => {
                setSecondProcedure(false);
                setFirstProcedure(true);
              }
            }
          />
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 350, height: 200 }}
            />
            {savedAreas.map((area, index) => (
              <React.Fragment key={index}>
                <View
                  style={[
                    styles.highlight,
                    {
                      left: area.x,
                      top: area.y,
                      width: area.width,
                      height: area.height,
                      borderColor: area.color, // Use the saved color for each area
                    },
                  ]}
                />
              </React.Fragment>
            ))}
          </View>
          {savedAreas.map((area, index) => (
            <View key={index}>
              <Text style={{ color: 'white' }}>Area {index + 1}</Text>
              <TextInput
                placeholder="Enter name for this area"
                placeholderTextColor="grey"   // Set placeholder color to white
                value={areaNames[area.id]}
                onChangeText={(text) => setAreaNames((prevNames) => ({ ...prevNames, [area.id]: text }))}
                style={{
                  color: area.color,
                  // borderWidth: 1,
                  // borderColor: 'white',
                  paddingHorizontal: 8,
                  height: 40,
                  borderRadius: 4,
                }} />
            </View>
          ))}
          <View style={{ marginBottom: 50 }}>
            <Button
              title='Next'
              onPress={() => {
                // Check if any area name is missing or empty
                const allNamesFilled = savedAreas.every(area => {
                  const name = areaNames[area.id];
                  return name && name.trim().length > 0;
                });
                if (!allNamesFilled) {
                  Alert.alert("Please fill in all the names of different areas");
                } else {
                  updateAreaNames();
                  setSecondProcedure(false);
                  setThirdProcedure(true);
                }
              }}
            />
          </View>


        </View>
      </ScrollView>
    );
  } else if (thirdProcedure) {
    return (
      <ScrollView style={styles.container}>
        <View style={{ top: 20 }}>

          <Button
            title='previous'
            onPress={
              () => {
                setThirdProcedure(false);
                setSecondProcedure(true);
                console.log(savedAreas);
              }
            }
          />
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 350, height: 200 }}
            />
            {savedAreas.map((area, index) => (
              <React.Fragment key={index}>
                <View
                  style={[
                    styles.highlight,
                    {
                      left: area.x,
                      top: area.y,
                      width: area.width,
                      height: area.height,
                      borderColor: area.color, // Use the saved color for each area
                    },
                  ]}
                />
              </React.Fragment>
            ))}
          </View>
          <Text style={{ color: 'white' }}>Please enter where this node can go</Text>
          {savedAreas.map((area, index) => (
            <View key={index}>
              <Text style={{ color: area.color }}>
                {area.name}
              </Text>
              <Text style={styles.canGoToText}>
                Can go to:
                <Text style={styles.accessibleAreasText}>
                  {savedAreas
                    .filter((otherArea) => area.accessibleNode.includes(otherArea.id))
                    .map((otherArea) => otherArea.name)
                    .join(', ')}
                </Text>
              </Text>

              <TouchableOpacity
                onPress={() => handleSelectArea(area)}
                style={styles.selectButton}
              >
                <Text style={styles.selectButtonText}>Select where to go</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={{ color: 'white' }}>
                  Select areas for {selectedArea?.name} to go to:
                </Text>
                {savedAreas
                  .filter((area) => area.id !== selectedArea?.id)
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleToggleAreaToGo(item.id)}
                      style={styles.checkboxContainer}
                    >
                      <Text style={{ color: 'white' }}>{item.name}</Text>
                      {selectedAreasToGo[selectedArea?.id] &&
                        selectedAreasToGo[selectedArea?.id].includes(item.id) && (
                          <Text style={{ color: 'green' }}>&#10004;</Text>
                        )}
                    </TouchableOpacity>
                  ))}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <View style={{ marginBottom: 50 }}>
            <Button
              title='next'
              onPress={() => {
                highlightedAreas.forEach(node => {
                  const nodeId = node.id.toString();
                  if (selectedAreasToGo[nodeId]) {
                    node.accessibleNode = selectedAreasToGo[nodeId];
                  }
                });

                setThirdProcedure(false);
                console.log(selectedAreasToGo);
                console.log(highlightedAreas);
              }}
            />
          </View>
        </View>
      </ScrollView>
    );
  } else {
    return <ScrollView style={styles.container}>
      <View style={{ top: 20 }}>

        <Button
          title="previous"
          onPress={() => {
            setThirdProcedure(true);
          }}
        />
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: selectedImage }}
            style={{ width: 350, height: 200 }}
          />
          {savedAreas.map((area, index) => (
            <React.Fragment key={index}>
              <View
                style={[
                  styles.highlight,
                  {
                    left: area.x,
                    top: area.y,
                    width: area.width,
                    height: area.height,
                    borderColor: area.color, // Use the saved color for each area
                  },
                ]}
              />
            </React.Fragment>
          ))}
        </View>
        {savedAreas.map((area, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <Text style={{ color: area.color, fontSize: 18, fontWeight: 'bold' }}>
              {area.name}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: area.color,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => {
                pickVideo(area.name)
                console.log(`Upload video for ${area.name}`);
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>Upload</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Button
          title='Done'
          onPress={() => {
            if (uploadSuccess == false) {
              {
                Alert.alert("please upload video for each of the area")
              }
            } else {
              console.log("areaNames is: ")
              // console.log(areaNames)
              console.log("highlightedAreas are: ")
              console.log(highlightedAreas)
              setUplaodSuccess(true)
            }
          }}
        />
        {uploadSuccess &&
          <Text style={{ color: 'white', padding: 10, marginBottom: 50 }}>
            Successfully Upload, Once the model is trained, we will send you a email!
          </Text>}
      </View>
    </ScrollView>
  }
}

const styles = StyleSheet.create({
  container: {
    // top: 30,
    padding: 20,
    flex: 1,
    backgroundColor: 'black',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
  },
  canGoToText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  accessibleAreasText: {
    fontWeight: 'normal',
    color: '#a0d468',  // A shade of green, adjust as needed
  },
  selectButton: {
    marginTop: 10,
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
