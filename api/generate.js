export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, ratio, duration } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Please enter a video prompt.'
      });
    }

    const selectedRatio =
      ratio === '720:1280' ? '720:1280' : '1280:720';

    const selectedDuration =
      Number(duration) === 10 ? 10 : 5;

    const apiKey = process.env.RUNWAYML_API_SECRET;

    if (!apiKey) {
      return res.status(500).json({
        error: 'RUNWAYML_API_SECRET is missing in Vercel.'
      });
    }

    const runwayResponse = await fetch(
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
          promptText: prompt.slice(0, 1800),
          ratio: selectedRatio,
          duration: selectedDuration
        })
      }
    );

    const result = await runwayResponse.json();

    if (!runwayResponse.ok) {
      console.error('Runway error:', result);

      return res.status(runwayResponse.status).json({
        error: result?.error || 'Runway rejected the request.',
        issues: result?.issues || []
      });
    }

    return res.status(200).json({
      taskId: result.id,
      message: 'Video generation started successfully.'
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || 'Server error.'
    });
  }
}
