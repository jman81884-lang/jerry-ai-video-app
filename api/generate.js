export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, ratio = '1280:720', duration = 5 } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'A text prompt is required.' });
    }

    const apiKey = process.env.RUNWAYML_API_SECRET;

    if (!apiKey) {
      return res.status(500).json({
        error: 'RUNWAYML_API_SECRET is missing in Vercel.'
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
          ratio: ratio === '720:1280' ? '768:1280' : '1280:768',
          duration: Number(duration)
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || 'Runway rejected the request.',
        issues: data?.issues || []
      });
    }

    return res.status(200).json({
      taskId: data.id
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || 'Server error.'
    });
  }
}
