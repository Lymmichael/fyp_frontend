interface Node {
    id: number;
    name: string;
    color: string;
    accessibleNode: number[];
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  const CalculateOrientation = (
    savedHighlightedArea: Node[],
    id1: number,
    id2: number
  ): number | null => {
    const node1 = savedHighlightedArea.find((node) => node.id === id1);
    const node2 = savedHighlightedArea.find((node) => node.id === id2);
    console.log(savedHighlightedArea)
    console.log(id1)
    console.log(id2)
    if (!node1 || !node2) {
      return null; // Or throw an error, depending on your needs
    }
    if(node2 == null || node2 == null) {
        return null
    }
    const x1 = node1.x + node1.width / 2;
    const y1 = node1.y + node1.height / 2;
    const x2 = node2.x + node2.width / 2;
    const y2 = node2.y + node2.height / 2;
  
    const dx = x2 - x1;
    const dy = y2 - y1;
    let angleInRadians = Math.atan2(dy, dx);
    let angleInDegrees = (angleInRadians * 180) / Math.PI;
    
    // Normalize angle to be between 0 and 360
    if (angleInDegrees < 0) {
      angleInDegrees += 360;
    }
    console.log(angleInDegrees)
    return angleInDegrees;
    //default 0 degree right side N
  };
  
  export default CalculateOrientation;
  