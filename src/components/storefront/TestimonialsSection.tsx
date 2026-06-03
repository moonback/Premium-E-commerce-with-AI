import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  initials: string;
}

interface TestimonialsSectionProps {
  prefersReducedMotion: boolean;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sophie Martin',
    role: 'Cliente fidèle',
    text: 'Une expérience d\'achat exceptionnelle. La qualité des produits est irréprochable et le service client est remarquable. Je recommande vivement Véridian.',
    rating: 5,
    initials: 'SM',
  },
  {
    name: 'Thomas Dubois',
    role: 'Acheteur régulier',
    text: 'Je recommande vivement Véridian. Les produits sont élégants, durables et le rapport qualité-prix est excellent. Un vrai coup de cœur.',
    rating: 5,
    initials: 'TD',
  },
  {
    name: 'Marie Laurent',
    role: 'Nouvelle cliente',
    text: 'Impressionnée par la rapidité de livraison et l\'attention portée aux détails. Une boutique qui se démarque par son excellence.',
    rating: 5,
    initials: 'ML',
  },
];

export default function TestimonialsSection({ prefersReducedMotion }: TestimonialsSectionProps) {
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  return (
    <section className="bg-ink py-20 md:py-28 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-accent/30" />
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Témoignages</span>
            <span className="h-px w-8 bg-accent/30" />
          </div>
          <h2 className="text-3xl md:text-5xl font-light font-serif text-white">
            Ce que disent <span className="italic text-accent/80">nos clients</span>
          </h2>
        </motion.div>

        {/* Testimonial card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto text-center"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-8">
                {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>

              {/* Quote */}
              <Quote className="w-10 h-10 text-accent/20 mx-auto mb-6" />
              <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed font-light italic">
                "{testimonials[testimonialIndex].text}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-bold text-sm">
                  {testimonials[testimonialIndex].initials}
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{testimonials[testimonialIndex].name}</p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">{testimonials[testimonialIndex].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setTestimonialIndex(i => i === 0 ? testimonials.length - 1 : i - 1)}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === testimonialIndex ? 'bg-accent w-6' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setTestimonialIndex(i => i === testimonials.length - 1 ? 0 : i + 1)}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors"
              aria-label="Témoignage suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
