import React, { useState } from 'react';
import { View, Button, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';
import LoginPage from '../../components/Login';

export default function UploadPage() {
  const [isLogin, setIsLogin] = useState(false)
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
  const [firstProcedure, setFirstProcedure] = useState(true)
  const [secondProcedure, setSecondProcedure] = useState(false)
  const [thirdProcedure, setThirdProcedure] = useState(false)
  const [areaNames, setAreaNames] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedAreasToGo, setSelectedAreasToGo] = useState({});
  const [uploadSuccess, setUplaodSuccess] = useState(true)
  
  if (!isLogin) {
    return (<LoginPage />)
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
    console.log(highlightedAreas)
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
    formData.append('video', { uri: videoUri, name: 'video.mp4', type: 'video/mp4' });

    try {
      // const response = await fetch('https://your-server-url.com/api/uploadVideo', {
      //   method: 'POST',
      //   body: formData,
      // });

      // const data = await response.json();
      // console.log('Video Upload Response:', data);
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  const handleSelectArea = (area) => {
    setSelectedArea(area);
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

  if (firstProcedure) {
    return (
      <>
        <View style={styles.container}>
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
          <Button
            title='Next'
            onPress={
              () => {
                if(!selectedImage) {
                  Alert.alert("Please upload the image")
                } else if(savedAreas.length == 0) {
                  Alert.alert("Please highlight area you want")
                } else {
                  console.log(savedAreas)
                  setFirstProcedure(false)
                  setSecondProcedure(true)
                }
              }
            }
          />
        </View>
      </>
    )
  } else if (secondProcedure) {
    return (
      <ScrollView style={styles.container}>
        <Button
          title='previous'
          onPress={
            () => {
              setSecondProcedure(false)
              setFirstProcedure(true)
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
            <Text >Area {index + 1} ({area.width}x{area.height})</Text>
            <TextInput
              placeholder="Enter name for this area"
              value={areaNames[area.id]}
              onChangeText={(text) => setAreaNames((prevNames) => ({ ...prevNames, [area.id]: text }))}
              style={{ color: area.color }} // Set text color to area color
            />
          </View>
        ))}
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
      </ScrollView>
    );
  } else if (thirdProcedure) {
    return (
      <ScrollView style={styles.container}>
        <Button
          title='previous'
          onPress={
            () => {
              setThirdProcedure(false)
              setSecondProcedure(true)
              console.log(savedAreas)
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
            <Text style={{ color: 'white' }}>
              Can go to:
              {savedAreas
                .filter((otherArea) => area.accessibleNode.includes(otherArea.id))
                .map((otherArea) => otherArea.name)
                .join(', ')}
            </Text>
            <TouchableOpacity 
              onPress={() => handleSelectArea(area)}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>Select where to go</Text>
            </TouchableOpacity>
          </View>
        ))}

        {selectedArea && (
          <View>
            <Text style={{ color: 'white' }}>
              Select areas for {selectedArea.name} to go to:
            </Text>
            {savedAreas
              .filter((area) => area.id !== selectedArea.id)
              .map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleToggleAreaToGo(item.id)}
                  style={styles.checkboxContainer}
                >
                  <Text style={{ color: 'white' }}>{item.name}</Text>
                  {selectedAreasToGo[selectedArea.id] &&
                    selectedAreasToGo[selectedArea.id].includes(item.id) && (
                      <Text style={{ color: 'green' }}>&#10004;</Text>
                    )}
                </TouchableOpacity>
              ))}
          </View>
        )}
        <Button
          title='next'
          onPress={() => {
            highlightedAreas.forEach(node => {
              const nodeId = node.id.toString();
              if (selectedAreasToGo[nodeId]) {
                node.accessibleNode = selectedAreasToGo[nodeId];
              }
            })

            setThirdProcedure(false)
            console.log(selectedAreasToGo)
            console.log(highlightedAreas)
          }}
        />
      </ScrollView>
    );
  } else {
    return <ScrollView style={styles.container}>
      <Button
        title="previous"
        onPress={() => {
          setThirdProcedure(true)
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
        <View key={index}>
          <Text style={{ color: area.color }}>
            {area.name}
          </Text>
          <Text style={{ color: 'white' }}>
            upload video
          </Text>
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
            console.log(areaNames)
            console.log("highlightedAreas are: ")
            console.log(highlightedAreas)
            setUplaodSuccess(true)
          }
        }}
      />
      {uploadSuccess && <Text style={{ color: 'white' }}>
        Successfully Upload, Once the model is trained, we will send you a email!
      </Text>}
    </ScrollView>
  }
}

const styles = StyleSheet.create({
  container: {
    top: 30,
    padding: 30, // Optional padding for better readability
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
  },
  checkboxContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectButton: {
    backgroundColor: '#007AFF',  // iOS blue color
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start', // so button width fits content
  },
  selectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
