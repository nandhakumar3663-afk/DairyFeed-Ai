import { useState } from 'react';
export default function VisualScanner() {
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const upload = event => {
    const file = event.target.files?.[0];
    setImage(null); setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a JPG, PNG or WebP image up to 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.onerror = () => setError('Could not read image');
    reader.readAsDataURL(file);
  };
  return <section className="glass-panel notice"><h2>Image preview — analysis not available</h2>
    <p>Images remain in this browser. No model is running, and uploading a photo does not produce mold, particle-size or feed-safety results.</p>
    <label>Preview a sample photo <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>
    {error && <p role="alert">{error}</p>}
    {image && <img src={image} alt="Uploaded sample preview, not analyzed" style={{ display: 'block', maxWidth: '100%', maxHeight: 400, marginTop: 20 }} />}
    <p>Real analysis requires an evaluated image model and reference measurements. Laboratory-backed calibration remains future work.</p>
  </section>;
}
