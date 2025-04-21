import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

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

export const findShortestPath = (graph: Node[], startId?: number | null, endId?: number | null): number[] | null => {
  if (startId === endId) return [startId || 0];
  if (startId == null || endId == null) return null
  const visited = new Set<number>();
  const queue: number[][] = [[startId || 0]];

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

      {path ? (
        <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        contentContainerStyle={styles.scrollContent}
        >
        <Text style={styles.pathPhrase}>
          {path.map((id, index) => {
            const node = savedHighlightedArea.find(n => n.id === id);
            if (!node) return null;

            // Add arrow except after last node
            const arrow = index < path.length - 1 ? ' → ' : '';

            return (
              <Text key={id} style={{ color: node.color, fontSize: 14 }}>
                {node.name + arrow}
              </Text>
            );
          })}
        </Text>
          
        </ScrollView>
        
      ) : (
        <Text style={styles.pathPhrase}>No path found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    flexDirection: 'row',
  },
  pathPhrase: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
  }
});

export default ShortestPathFinder;
