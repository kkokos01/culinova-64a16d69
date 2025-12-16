import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeartButtonProps {
  isLiked: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const HeartButton = ({ isLiked, onToggle, className, size = 'md' }: HeartButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create particles
    if (!isLiked) {
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x,
        y
      }));
      setParticles(newParticles);
      
      // Remove particles after animation
      setTimeout(() => {
        setParticles([]);
      }, 1000);
    }

    setIsAnimating(true);
    onToggle();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={cn(
          "relative transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded-full p-1",
          className
        )}
      >
        <motion.div
          animate={isAnimating ? 'liked' : 'normal'}
          variants={{
            normal: { scale: 1 },
            liked: { scale: [1, 1.3, 1] }
          }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={cn(
              sizeClasses[size],
              "transition-colors duration-200",
              isLiked
                ? "fill-red-500 text-red-500"
                : "text-slate-400 hover:text-red-400"
            )}
          />
        </motion.div>
      </button>

      {/* Particle effects */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute pointer-events-none"
            style={{ left: particle.x, top: particle.y }}
            initial={{ 
              scale: 0,
              x: 0,
              y: 0,
              opacity: 1
            }}
            animate={{
              scale: [0, 1, 0.5],
              x: [
                0,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 100
              ],
              y: [
                0,
                -Math.random() * 30 - 20,
                -Math.random() * 60 - 40
              ],
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1,
              ease: "easeOut"
            }}
          >
            <Heart className="h-3 w-3 fill-red-400 text-red-400" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HeartButton;
