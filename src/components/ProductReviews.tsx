import React, { useEffect, useState } from 'react';
import { Star, User, ThumbsUp, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { REVIEW_COLUMNS } from '../lib/columns';
import { cn } from '../lib/utils';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  body: string;
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
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchReviews(); }, [productId]);

  const fetchReviews = async () => {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(REVIEW_COLUMNS)
        .eq('product_id', productId)
        .eq('is_published', true)
        .order('created_at', { ascending: false }) as any;
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
    if (!user || !supabase) { toast.error('Connectez-vous pour laisser un avis'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('product_reviews').insert({
        user_id: user.id,
        product_id: productId,
        rating,
        body: comment,
        is_published: false,
      });
      if (error) throw error;
      toast.success('Avis soumis ! Il sera publié après modération.');
      setShowForm(false);
      setComment('');
      setRating(5);
    } catch (err) {
      toast.error("Impossible de soumettre l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // Distribution of ratings 1–5
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const ratingLabel = (r: number) => {
    if (r >= 4.5) return 'Excellent';
    if (r >= 4) return 'Très bien';
    if (r >= 3) return 'Bien';
    if (r >= 2) return 'Passable';
    return 'Médiocre';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-ink">Avis clients</h2>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors"
          >
            Écrire un avis
          </button>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="grid md:grid-cols-[240px_1fr] gap-8 mb-8">
          {/* Rating summary — Amazon style */}
          <div>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-ink">{averageRating.toFixed(1)}</p>
              <div className="flex justify-center gap-0.5 my-2">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className={cn(
                      'w-5 h-5',
                      s <= Math.round(averageRating) ? 'fill-[#ff9900] text-[#ff9900]' : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-ink/60">{ratingLabel(averageRating)}</p>
              <p className="text-xs text-ink/50 mt-1">{reviews.length} avis vérifiés</p>
            </div>

            {/* Star distribution bars */}
            <div className="space-y-1.5">
              {ratingDist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <button className="text-xs text-[#007185] hover:underline w-6 text-right flex-shrink-0">{star}</button>
                  <Star className="w-3 h-3 fill-[#ff9900] text-[#ff9900] flex-shrink-0" />
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ff9900] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#007185] w-6 flex-shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent reviews */}
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff9900]/30 to-[#ff9900]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#ff9900]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {review.user_email?.split('@')[0] || 'Client vérifié'}
                    </p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-[#007185]" />
                      <span className="text-xs text-[#007185]">Achat vérifié</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        className={cn(
                          'w-3.5 h-3.5',
                          s <= review.rating ? 'fill-[#ff9900] text-[#ff9900]' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-ink/50">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>

                <p className="text-sm text-ink/80 leading-relaxed">{review.body}</p>

                <button className="mt-2 flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Utile ?</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reviews.length === 0 && !showForm && (
        <div className="text-center py-12 bg-[#f7f7f7] rounded-lg border border-gray-200">
          <div className="flex justify-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="w-6 h-6 text-gray-300" />
            ))}
          </div>
          <p className="text-base font-bold text-ink mb-1">Aucun avis pour le moment</p>
          <p className="text-sm text-ink/60 mb-4">Soyez le premier à partager votre expérience !</p>
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors"
            >
              Écrire un avis
            </button>
          )}
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg p-6 bg-[#f7f7f7]">
          <h3 className="text-lg font-bold text-ink mb-4">Votre avis</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Star selector */}
            <div>
              <label className="block text-sm font-semibold text-ink/70 mb-2">Note globale *</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'w-7 h-7 transition-colors',
                        star <= (hoverRating || rating)
                          ? 'fill-[#ff9900] text-[#ff9900]'
                          : 'text-gray-300 hover:text-[#ff9900]'
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-ink/60 self-center">{ratingLabel(hoverRating || rating)}</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-ink/70 mb-2">Votre commentaire *</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                rows={4}
                placeholder="Partagez ce que vous avez aimé ou non, et si vous recommanderiez ce produit..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-[#ff9900] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-6 py-2.5 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Envoi en cours...' : 'Soumettre mon avis'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-ink font-medium text-sm rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
            <p className="text-xs text-ink/50">Votre avis sera publié après modération.</p>
          </form>
        </div>
      )}
    </div>
  );
}
