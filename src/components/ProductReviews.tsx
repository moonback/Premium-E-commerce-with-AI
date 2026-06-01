import React, { useEffect, useState } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  is_published: boolean;
  created_at: string;
  user_email?: string;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews((data ?? []) as Review[]);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) {
      toast.error('Connectez-vous pour laisser un avis');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          comment,
          is_published: false, // Moderation required
        });

      if (error) throw error;
      
      toast.success('Avis soumis ! Il sera publié après modération.');
      setShowForm(false);
      setComment('');
      setRating(5);
    } catch (err) {
      console.error('Failed to submit review', err);
      toast.error('Impossible de soumettre l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-ink/20'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-ink/5 w-48"></div>
        <div className="h-24 bg-ink/5 w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif text-ink mb-2">Avis clients</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3">
              {renderStars(Math.round(averageRating))}
              <span className="text-sm text-ink/60">
                {averageRating.toFixed(1)} / 5 ({reviews.length} avis)
              </span>
            </div>
          )}
        </div>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-ink text-ink hover:bg-ink hover:text-bg transition-colors"
          >
            Laisser un avis
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-ink/10 p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-ink/60 mb-2">
              Note
            </label>
            {renderStars(rating, true, setRating)}
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-ink/60 mb-2">
              Commentaire
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 border border-ink/20 bg-transparent text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink"
              placeholder="Partagez votre expérience..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-ink text-bg hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Soumettre'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest border border-ink/20 text-ink hover:bg-ink/5 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-ink/10">
          <Star className="w-8 h-8 text-ink/20 mx-auto mb-4" />
          <p className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-2">
            Aucun avis pour le moment
          </p>
          <p className="text-xs text-ink/60 italic">
            Soyez le premier à partager votre expérience !
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-ink/10 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-soft-green flex items-center justify-center">
                    <User className="w-5 h-5 text-ink" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {review.user_email?.split('@')[0] || 'Client vérifié'}
                    </p>
                    <p className="text-xs text-ink/50">
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className="text-sm text-ink/80 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
