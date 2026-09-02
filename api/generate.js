import RunwayML from '@runwayml/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prompt,
      ratio = '1280:720',
      duration = 5
    } = req.body || {};

    if (!prompt) {
      return res.status(400).json({
        error: 'A text prompt is required.'
      });
    }

    if (!['1280:720', '720:1280'].includes(ratio)) {
      return res.status(400).json({
        error: 'Invalid video ratio.'
      });
    }

    if (![5, 10].includes(Number(duration))) {
      return res.status(400).json({
        error: 'Duration must be 5 or 10 seconds.'
      });
    }

    if (!process.env.RUNWAYML_API_SECRET) {
      return res.status(500).json({
        error: 'Runway API key is not configured.'
      });
    }

    const client = new RunwayML({
      apiKey: process.env.RUNWAYML_API_SECRET
    });

    const task = client.imageToVideo.create({
      model: 'gen4.5',
      promptText: String(prompt).slice(0, 1800),
      ratio,
      duration: Number(duration)
    });

    const completedTask = await task.waitForTaskOutput();

    const videoUrl = completedTask?.output?.[0];

    if (!videoUrl) {
      throw new Error('Runway returned no video URL.');
    }

    return res.status(200).json({
      videoUrl
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || 'Video generation failed.'
    });
  }
}
