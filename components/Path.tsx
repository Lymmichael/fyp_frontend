import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Define TypeScript interfaces
interface Node {
  id: number;
  name: string;
  color: string;
  accessibleNode: number[];
}

interface ShortestPathFinderProps {
  savedHighlightedArea: Node[];
  startId: number;
  endId: number;
}

export const findShortestPath = (graph: Node[], startId: number, endId: number): number[] | null => {
  if (startId === endId) return [startId];

  const visited = new Set<number>();
  const queue: number[][] = [[startId]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    if (node === endId) return path;

    if (!visited.has(node)) {
      visited.add(node);
      const currentNode = graph.find(n => n.id === node);
      const neighbors = currentNode?.accessibleNode || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([...path, neighbor]);
        }
      }
    }
  }

  return null;
};

const ShortestPathFinder: React.FC<ShortestPathFinderProps> = ({ 
  savedHighlightedArea, 
  startId, 
  endId 
}) => {
  const [path, setPath] = useState<number[] | null>(null);

  useEffect(() => {
    const result = findShortestPath(savedHighlightedArea, startId, endId);
    setPath(result);
  }, [savedHighlightedArea, startId, endId]);
  return (
    <View style={styles.container}>
      <Text style={styles.pathPhrase}>Shortest Path: </Text>

      <Text style={styles.pathPhrase}>
        {path
          ? path.map(id => savedHighlightedArea.find(n => n.id === id)?.name || id).join(' → ')
          : 'No path found.'}
      </Text>
    </View>
  );
  
};
const styles = StyleSheet.create({
    container: {
    //   position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,               // smaller height for one line
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      // Optional shadow for iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      // Optional elevation for Android
      elevation: 5,
    },
    pathPhrase: {
      fontSize: 14,
      color: '#000',
      textAlign: 'center',
    },
  });

export default ShortestPathFinder;
