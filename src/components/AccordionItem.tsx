import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export type Spec = {
  title: string;
  content: string;
};

interface AccordionItemProps {
  spec: Spec;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ spec }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-ink/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-4 flex justify-between items-center text-left hover:bg-ink/5 transition-colors px-4"
      >
        <span className="font-bold text-sm uppercase tracking-widest">{spec.title}</span>
        <span className="text-ink/50 text-xl font-light">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <p className="text-sm text-ink/70 leading-relaxed italic">{spec.content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionItem;
