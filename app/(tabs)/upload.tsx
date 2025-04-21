import React, { useState } from 'react';
import { View, Button, Image, ScrollView, ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';
import LoginPage from '../../components/Login';
import * as DocumentPicker from 'expo-document-picker';
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

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
  const [procedure, setProcedure] = useState(0)
  const [areaNames, setAreaNames] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedAreasToGo, setSelectedAreasToGo] = useState({});
  const [uploadSuccess, setUplaodSuccess] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [askOrientation, setAskOrientation] = useState(false)
  if (!isLogin) {
    return (<LoginPage onLoginSuccess={() => setIsLogin(true)} />);
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

  const undo = () => {
    console.log(highlightedAreas)
    setHighlightedAreas((prevAreas) => {
      if (prevAreas.length === 0) return prevAreas; // nothing to remove
      return prevAreas.slice(0, prevAreas.length - 1);
    });
  }

  const clearSavedAreas = () => {
    setSavedAreas([]);
    setHighlightedAreas([]); // Optionally clear highlighted areas as well
    setUsedColors(new Set()); // Clear used colors
    setUploadedVideos({}); // Clear uploaded videos
  };

  const updateAreaNames = () => {
    const updatedAreas = highlightedAreas.map((area) => ({ ...area, name: areaNames[area.id] }));
    setHighlightedAreas(updatedAreas);
    setSavedAreas(updatedAreas);
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
  

  const compassButton = () => {
    if (askOrientation == false) {
      setAskOrientation(true);
    } else {
      setAskOrientation(false);
    }
  }
  const ButtonWithIcon = ({ name, icon, onPress}) => {
    return (
      <TouchableOpacity style={upload2Styles.iconButton} onPress={onPress}>
        {icon}
        <Text style={{color: 'white'}}>{name}</Text>
      </TouchableOpacity>
    );
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

  if (procedure == 0) {
    return (
      <>
        {
          !selectedImage &&
          <View style={uploadStyles.container}>
            <Text style={uploadStyles.filesTitle}>Upload Files</Text>

            <View style={uploadStyles.uploadArea}>
              <AntDesign name="cloudupload" size={60} color="white" />
              <Text style={uploadStyles.dragText}>Drag or drop file here</Text>
              <Text style={uploadStyles.orText}>-OR-</Text>
              <TouchableOpacity style={uploadStyles.chooseFileButton} onPress={openImagePicker}>
                <Text style={uploadStyles.chooseFileText}>Choose file</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        {selectedImage &&
          <View style={styles.container}>
            <View style={{ top: 20 }}>
              <TouchableOpacity style={styles.uploadButton} onPress={openImagePicker}>
                <Text style={styles.plus}>+</Text>
              </TouchableOpacity>
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
              <View style={upload2Styles.container}>
                <View style={upload2Styles.topButtons}>
                  <ButtonWithIcon
                    name="Save"
                    icon={<Entypo name="save" size={20} color="white" />}
                    onPress={saveHighlightedAreas}
                  />
                  <ButtonWithIcon
                    name="Undo"
                    icon={<Entypo name="back" size={20} color="white" />}
                    onPress={undo}
                  />
                  <ButtonWithIcon
                    name="Clear"
                    icon={<Feather name="x" size={20} color="white" />}
                    onPress={clearSavedAreas}
                  />
                  <ButtonWithIcon
                    name="Compass"
                    icon={<Entypo name="compass" size={20} color="white" />}
                    onPress={compassButton}
                  />
                  <ButtonWithIcon
                    name="Proceed"
                    icon={<Entypo name="check" size={20} color="white" />}
                    onPress={
                    () => {
                      if (!selectedImage) {
                        Alert.alert("Please upload the image");
                      } else if (savedAreas.length === 0) {
                        Alert.alert("Please highlight area you want");
                      } else {
                        console.log(savedAreas);
                        setProcedure(1)
                      }
                    }}
                  />
                </View>
              </View>
              {savedAreas && <Text style={{ color: 'white' }}>
                Number of highlighted area: {savedAreas.length}
              </Text>}
              {selectedImage && askOrientation &&
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
{/*               
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
                        setProcedure(1)
                      }
                    }
                  }
                />
              </View> */}

            </View>
          </View>
        }
      </>
    );
  } else if (procedure == 1) {
    return (
      <ScrollView style={styles.container}>
        <View style={{ top: 20 }}>

          <Button
            title='previous'
            onPress={
              () => {
                setProcedure(0)
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
                  setProcedure(2)
                }
              }}
            />
          </View>


        </View>
      </ScrollView>
    );
  } else if (procedure == 2) {
    return (
      <ScrollView style={styles.container}>
        <View style={{ top: 20 }}>

          <Button
            title='previous'
            onPress={
              () => {
                setProcedure(1)
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

                setProcedure(3)
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
            setProcedure(2)
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
            if (uploadSuccess == true) {
              Alert.alert("You have uploaded all videos")
            } else {
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                setUplaodSuccess(true)
                Alert.alert("Upload Successful")
              }, 10000);
            }
          }}
        />
        {isLoading &&
          <ActivityIndicator
            size="large"
            color="white"
            style={{
              flex: 1,                   // Take full screen height
              justifyContent: 'center',  // Center vertically
              alignItems: 'center',
            }}
          />
        }
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
  uploadButton: {
    backgroundColor: 'grey',
    width: 50,
    height: 50,
    borderRadius: 25, // circular button
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30,
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

const uploadStyles = StyleSheet.create({
  container: {
    top: 40,
    flex: 1,
    padding: 20,
    backgroundColor: '#000000', // black background
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: 'lightgrey',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  dragText: {
    fontSize: 16,
    color: 'white', // white text
    marginTop: 10,
  },
  orText: {
    fontSize: 16,
    color: 'white', // white text
    marginVertical: 10,
  },
  chooseFileButton: {
    backgroundColor: 'blue', // blue button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  chooseFileText: {
    color: 'white', // white text
    fontSize: 16,
  },
  filesSection: {
    marginBottom: 20,
  },
  filesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white', // white text
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fileName: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    color: 'white', // white text
  },
  fileSize: {
    fontSize: 14,
    color: 'grey',
    marginRight: 10,
  },
  removeButton: {
    padding: 5,
  },
  uploadButton: {
    backgroundColor: 'blue', // blue button
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white', // white text
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const upload2Styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    padding: 8
  },
  topButtons: {
    flexDirection: 'row',
    gap: 10, // Add this line to create a gap of 10 pixels between items
    justifyContent: 'space-between',
    marginBottom: 20,

  },
  iconButton: {
    backgroundColor: '#222',
    padding: 8,         // Reduced padding
    borderRadius: 8,
    alignItems: 'center',
  
  },
  buttonText: {
    color: 'white',
    marginTop: 5,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomButton: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
