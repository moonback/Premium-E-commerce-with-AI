import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductRatingProps {
  productId: string;
  showCount?: boolean;
}

export default function ProductRating({ productId, showCount = true }: ProductRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRating();
  }, [productId]);

  const fetchRating = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_published', true);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setRating(avg);
        setCount(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch rating', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || count === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span className="ml-1 text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
      </div>
      {showCount && (
        <span className="text-xs text-ink/50">({count})</span>
      )}
    </div>
  );
}
