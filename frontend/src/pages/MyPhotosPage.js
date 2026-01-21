import { useState, useEffect } from 'react';
import { Camera, Trash2, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { toast } from 'sonner';
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyPhotosPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/photos/mine`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      toast.error('Could not load your photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`${API}/photos/${deleteId}`);
      setPhotos(photos.filter(p => p.id !== deleteId));
      toast.success('Photo deleted');
    } catch (error) {
      toast.error('Could not delete photo');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-testid="my-photos-page">
      {/* Header */}
      <header className="nav-header">
        <div className="app-container flex items-center justify-between">
          <h1 className="font-bold text-2xl text-slate-900">My Photos</h1>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const text = `You have ${photos.length} photos. These are all the photos you have shared.`;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="tts-button"
            aria-label="Read page info"
            data-testid="tts-my-photos"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="app-container py-6">
        {/* Stats */}
        <div className="bg-white rounded-2xl p-4 mb-6 flex items-center justify-between border-2 border-slate-100">
          <div>
            <p className="text-slate-500">Total Photos</p>
            <p className="text-3xl font-bold text-slate-900">{photos.length}</p>
          </div>
          <Button
            onClick={() => navigate('/add-photo')}
            className="rounded-full px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold btn-press"
            data-testid="add-more-btn"
          >
            <Camera className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Add More
          </Button>
        </div>

        {/* Photos grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state bg-white rounded-3xl border-2 border-slate-100">
            <Camera className="w-20 h-20 text-slate-300 mb-4" strokeWidth={1.5} />
            <h3 className="font-bold text-xl text-slate-900 mb-2">No photos yet!</h3>
            <p className="text-slate-600 text-lg mb-6">
              Share your first photo to start connecting with friends.
            </p>
            <Button
              onClick={() => navigate('/add-photo')}
              className="rounded-full px-8 py-4 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="first-photo-btn"
            >
              Add Your First Photo
            </Button>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="photo-card group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`my-photo-${index}`}
              >
                <img
                  src={`data:image/jpeg;base64,${photo.image_base64}`}
                  alt={photo.description || photo.category}
                />
                <div className="photo-card-overlay flex justify-between items-end">
                  <span className="text-sm capitalize">{photo.category || 'Photo'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(photo.id);
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                    aria-label="Delete photo"
                    data-testid={`delete-photo-${index}`}
                  >
                    <Trash2 className="w-5 h-5 text-white" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl" data-testid="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              This will remove the photo forever. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-full px-6 py-4 text-lg font-semibold" data-testid="cancel-delete">
              Keep Photo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full px-6 py-4 text-lg font-bold bg-red-500 hover:bg-red-600 text-white"
              data-testid="confirm-delete"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
