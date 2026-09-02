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
  s.textContent = 'Generating your video… Please wait.';

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

    s.textContent = 'Video generated successfully!';

    const video = document.createElement('video');
    video.className = 'video';
    video.controls = true;
    video.playsInline = true;
    video.src = data.videoUrl;

    box.appendChild(video);

  } catch (error) {
    s.textContent = 'Error: ' + error.message;
  } finally {
    b.disabled = false;
  }
};
