
const AWS = require('aws-sdk');


let output_label= "";
let output_confidence = "";

async function ImageDetect(model: any, bucket: any, photo: any, min_confidence: any) {
  AWS.config.update({
    accessKeyId: 'AKIAVFA3S3KHNW3PIE47',
    secretAccessKey: '5T5oYB/rEE8T8sHFSSytzjnGy5TayrXFHjuXyLno',
    region: 'us-east-1'
  });
  
    // Specify your AWS region here
    const region_name = 'us-east-1';
    const rekognition = new AWS.Rekognition({ region: region_name });
    
    // Call DetectCustomLabels
    try {
        const response = await rekognition.detectCustomLabels({
            Image: { S3Object: { Bucket: bucket, Name: photo } },
            MinConfidence: min_confidence,
            ProjectVersionArn: model
        }).promise();


        response.CustomLabels.forEach(customLabel => {
            // console.log('Label ' + String(customLabel.Name));
            // console.log('Confidence ' + String(customLabel.Confidence));
            output_label = String(customLabel.Name)
            output_confidence = String(customLabel.Confidence)
        });

        if (response.CustomLabels.length === 0) {
            return null; // No labels detected above min confidence
          }
      
          // Find the label with the highest confidence
          let bestLabel = response.CustomLabels.reduce((prev, current) =>
            (prev.Confidence > current.Confidence) ? prev : current
          );
      
          return {
            label: bestLabel.Name,
            confidence: bestLabel.Confidence
          };

    } catch (error) {
        console.error("Error calling DetectCustomLabels:", error);
        return 0; // Or handle the error as appropriate for your application
    }
}

export default ImageDetect
