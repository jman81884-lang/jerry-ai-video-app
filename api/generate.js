export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, ratio = '1280:720', duration = 5 } = req.body || {};

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

    const apiKey = process.env.RUNWAYML_API_SECRET;

    if (!apiKey) {
      return res.status(500).json({
        error: 'RUNWAYML_API_SECRET is not configured in Vercel.'
      });
    }

    const response = await fetch(
      'https://api.dev.runwayml.com/v1/image_to_video',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify({
          model: 'gen4.5',
          promptText: String(prompt).slice(0, 1800),
          ratio,
          duration: Number(duration)
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || 'Runway API request failed.',
        issues: data?.issues || undefined
      });
    }

    const taskId = data?.id;

    if (!taskId) {
      return res.status(500).json({
        error: 'Runway did not return a task ID.'
      });
    }

    // Wait for the video to finish
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://api.dev.runwayml.com/v1/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Runway-Version': '2024-11-06'
          }
        }
      );

      const task = await statusResponse.json();

      if (task.status === 'SUCCEEDED') {
        const videoUrl = task.output?.[0];

        if (!videoUrl) {
          return res.status(500).json({
            error: 'Runway completed the task but returned no video URL.'
          });
        }

        return res.status(200).json({
          videoUrl
        });
      }

      if (task.status === 'FAILED') {
        return res.status(500).json({
          error: 'Runway video generation failed.',
          details: task.failure || task.failureCode
        });
      }
    }

    return res.status(504).json({
      error: 'Video generation is taking too long. Please try again.'
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || 'Video generation failed.'
    });
  }
}
