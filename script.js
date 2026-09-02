const b = document.getElementById('generate');
const p = document.getElementById('prompt');
const r = document.getElementById('ratio');
const d = document.getElementById('duration');
const s = document.getElementById('status');
const box = document.getElementById('videoBox');

b.onclick = async () => {
  if (!p.value.trim()) {
    s.textContent = 'Please enter a video prompt.';
    return;
  }

  b.disabled = true;
  box.innerHTML = '';
  s.textContent = 'Starting video generation…';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: p.value.trim(),
        ratio: r.value,
        duration: Number(d.value)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation failed.');
    }

    const taskId = data.taskId;

    s.textContent = 'AI is creating your video… 🎬';

    let finished = false;

    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `/api/status?id=${encodeURIComponent(taskId)}`
      );

      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(statusData.error || 'Status check failed.');
      }

      if (statusData.status === 'SUCCEEDED') {
        if (!statusData.videoUrl) {
          throw new Error('Video completed but no video URL was returned.');
        }

        const video = document.createElement('video');

        video.className = 'video';
        video.controls = true;
        video.playsInline = true;
        video.src = statusData.videoUrl;

        box.appendChild(video);

        s.textContent = 'Video generated successfully! 🎉';

        finished = true;
        break;
      }

      if (statusData.status === 'FAILED') {
        throw new Error(
          statusData.failure || 'Runway video generation failed.'
        );
      }

      s.textContent =
        'AI is creating your video… ⏳ ' +
        statusData.status;
    }

    if (!finished) {
      throw new Error(
        'The video is taking longer than expected. Please try again.'
      );
    }

  } catch (error) {
    s.textContent = 'Error: ' + error.message;
  } finally {
    b.disabled = false;
  }
};
