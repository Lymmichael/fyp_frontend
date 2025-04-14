import React, { useState, useEffect } from 'react';
import { View, Button, Image, ScrollView, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export default function UploadPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightedAreas, setHighlightedAreas] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]);
  const [usedColors, setUsedColors] = useState(new Set()); // Set to store unique colors
  const [uploadedVideos, setUploadedVideos] = useState({}); // Object to store uploaded videos for each area

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
    };
    setHighlightedAreas((prevAreas) => [...prevAreas, area]);
    setUsedColors((prevColors) => new Set([...prevColors, area.color])); // Add color to set
    console.log('Highlighted Area:', area);
  };

  const saveHighlightedAreas = () => {
    setSavedAreas(highlightedAreas);
  };

  const clearSavedAreas = () => {
    setSavedAreas([]);
    setHighlightedAreas([]); // Optionally clear highlighted areas as well
    setUsedColors(new Set()); // Clear used colors
    setUploadedVideos({}); // Clear uploaded videos
  };

  useEffect(() => {
    if (savedAreas.length > 0) {
      console.log('Saved Highlighted Areas with Colors:', savedAreas.map((area, index) => ({
        index,
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        color: area.color,
      })));
    }
  }, [savedAreas]);

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

    const videos = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.video,
    });

    if (videos.assets.length > 0) {
      // For simplicity, let's just use the first video
      const videoUri = videos.assets[0].uri;
      setUploadedVideos((prevVideos) => ({ ...prevVideos, [areaId]: videoUri }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Button title="Upload Photo" onPress={openImagePicker} />
      <Button title="Save Highlighted Areas" onPress={saveHighlightedAreas} />
      <Button title="Clear Saved Areas" onPress={clearSavedAreas} />
      {selectedImage && (
        <View>
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
              <Button
                title="Upload Video"
                onPress={() => uploadVideoForArea(area.id)}
                color={area.color}
              />
              {uploadedVideos[area.id] && (
                <Text>Video uploaded for this area: {uploadedVideos[area.id]}</Text>
              )}
            </React.Fragment>
          ))}
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
              <Button
                title="Upload Video"
                onPress={() => uploadVideoForArea(area.id)}
                color={area.color}
              />
              {uploadedVideos[area.id] && (
                <Text>Video uploaded for this area: {uploadedVideos[area.id]}</Text>
              )}
            </React.Fragment>
          ))}
        </View>
      )}
      <Text>
        Number of colors used: {usedColors.size}
      </Text>
      <Text>
        Used colors: {Array.from(usedColors).join(', ')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30, // Optional padding for better readability
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
  },
});
