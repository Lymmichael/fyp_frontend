import express from 'express'
import cors from 'cors'
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition'

const app = express()
app.use(cors())
app.use(express.json())

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || 'us-west-2' })

app.post('/api/compare-faces', async (req, res) => {
  try {
    const { sourceBucket, sourceKey, targetBucket, targetKey, similarityThreshold } = req.body

    if (!sourceBucket || !sourceKey || !targetBucket || !targetKey) {
      return res.status(400).json({ error: 'Missing required S3 bucket/key parameters' })
    }

    const command = new CompareFacesCommand({
      SourceImage: {
        S3Object: {
          Bucket: sourceBucket,
          Name: sourceKey,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: targetBucket,
          Name: targetKey,
        },
      },
      SimilarityThreshold: similarityThreshold ?? 80,
    })

    const response = await rekognition.send(command)

    // Extract matched faces info
    const faceMatches = response.FaceMatches || []
    const results = faceMatches.map(match => ({
      similarity: match.Similarity,
      face: match.Face,
    }))

    res.json({ matches: results })
  } catch (error: any) {
    console.error('Error comparing faces:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

const port = process.env.PORT || 8081
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
