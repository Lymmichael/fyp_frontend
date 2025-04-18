
const AWS = require('aws-sdk');


let output_label= "";
let output_confidence = "";

async function ImageDetect(model, bucket, photo, min_confidence) {
  AWS.config.update({
    accessKeyId: 'AKIAVFA3S3KHNW3PIE47',
    secretAccessKey: '5T5oYB/rEE8T8sHFSSytzjnGy5TayrXFHjuXyLno',
    region: 'us-east-1'
  });
  
    let i = 0;
    // Specify your AWS region here
    const region_name = 'us-east-1';  // Replace with your desired region
    const rekognition = new AWS.Rekognition({ region: region_name });
    
    // Call DetectCustomLabels
    try {
        const response = await rekognition.detectCustomLabels({
            Image: { S3Object: { Bucket: bucket, Name: photo } },
            MinConfidence: min_confidence,
            ProjectVersionArn: model
        }).promise();


        response.CustomLabels.forEach(customLabel => {
            console.log('Label ' + String(customLabel.Name));
            console.log('Confidence ' + String(customLabel.Confidence));
            if (String(customLabel.Name) === "training_9F_inside") {
                i = i + 1;
            }
        });

        return response.CustomLabels.length;

    } catch (error) {
        console.error("Error calling DetectCustomLabels:", error);
        return 0; // Or handle the error as appropriate for your application
    }
}

// Example usage (remember to set your AWS credentials and configure the AWS SDK)
async function main() {
    const modelArn = 'arn:aws:rekognition:us-east-1:354392660622:project/fyp/version/fyp.2025-04-16T14.57.26/1744786647466'; // Replace with your actual model ARN
    const bucketName = 'fyp-final'; // Replace with your S3 bucket name
    const photoName = 'testing_image/testingPhoto.jpg'; // Replace with your image file name
    const minConfidence = 70;

    const numberOfLabels = await ImageDetect(modelArn, bucketName, photoName, minConfidence);
    console.log("Number of labels detected:", numberOfLabels);
}

main();
export default ImageDetect
