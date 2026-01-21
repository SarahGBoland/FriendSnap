import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Text-to-speech helper
const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export default function AddPhotoPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too big! Please choose a smaller one.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      // Remove data URL prefix for base64
      const base64 = e.target.result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!imageBase64) {
      toast.error('Please choose a photo first!');
      return;
    }

    setUploading(true);
    try {
      const response = await axios.post(`${API}/photos`, {
        image_base64: imageBase64,
        description: description
      });

      toast.success('Photo shared!');
      navigate('/my-photos');
    } catch (error) {
      const message = error.response?.data?.detail || 'Could not upload photo. Try again!';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageBase64(null);
    setDescription('');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-testid="add-photo-page">
      {/* Header */}
      <header className="nav-header">
        <div className="app-container flex items-center justify-between">
          <h1 className="font-bold text-2xl text-slate-900">Add Photo</h1>
          <button
            onClick={() => speak('Add a photo of something you like. Remember: no photos of people! Share pictures of animals, food, places, music, or anything you enjoy.')}
            className="tts-button"
            aria-label="Read instructions"
            data-testid="tts-add-photo"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="app-container py-6">
        {/* Rules reminder */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-start gap-3 border-2 border-blue-100">
          <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <p className="text-blue-900 font-semibold">Remember!</p>
            <p className="text-blue-700">
              Share photos of things, not people. Animals, food, places, music, art!
            </p>
          </div>
        </div>

        {!selectedImage ? (
          /* Upload zone */
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            data-testid="upload-zone"
          >
            <Camera className="w-20 h-20 text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Tap to add a photo
            </h2>
            <p className="text-slate-600 text-lg">
              Choose from your camera or photos
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
              data-testid="file-input"
            />
          </div>
        ) : (
          /* Preview */
          <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden" data-testid="photo-preview">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Your photo"
                className="w-full max-h-96 object-contain bg-slate-100"
              />
              <button
                onClick={clearImage}
                className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:bg-slate-50"
                aria-label="Remove photo"
                data-testid="remove-photo-btn"
              >
                <X className="w-6 h-6 text-slate-600" strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-6">
              <label htmlFor="description" className="block font-semibold text-slate-700 mb-2 text-lg">
                Add a note (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's in this photo?"
                className="w-full h-24 rounded-2xl border-2 border-slate-200 p-4 text-lg resize-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                maxLength={200}
                data-testid="description-input"
              />

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={clearImage}
                  variant="outline"
                  className="flex-1 rounded-full px-6 py-5 text-lg font-bold border-2 border-slate-200"
                  data-testid="choose-different-btn"
                >
                  Choose Different
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 rounded-full px-6 py-5 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white btn-press"
                  data-testid="share-photo-btn"
                >
                  {uploading ? (
                    <div className="spinner w-6 h-6 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Check className="w-6 h-6 mr-2" strokeWidth={2.5} />
                      Share Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="mt-8">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Ideas for photos</h3>
          <div className="flex flex-wrap gap-2">
            {['Animals', 'Food', 'Nature', 'Music', 'Sports', 'Art', 'Places', 'Colors'].map((idea) => (
              <span key={idea} className="category-badge">
                {idea}
              </span>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
