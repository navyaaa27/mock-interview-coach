import React, { useState } from 'react';
import { motion, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import './CSSPeachWorld.css';

export default function CSSPeachWorld({ scrollYProgress }) {
  const [hasSplashed, setHasSplashed] = useState(false);

  // Add a spring to smooth out the raw scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --- Sphere Animations ---
  // The sphere falls down to y: 800 as we scroll to the bottom.
  const sphereY = useTransform(smoothProgress, [0, 0.4, 0.8, 1], [0, 500, 650, 800]);
  const sphereScale = useTransform(smoothProgress, [0, 0.4, 0.8, 1], [1, 0.6, 1.2, 1.2]); // Rest on water, no engulf
  
  // Opacity stays 1 so we can see it on the water
  const sphereOpacity = useTransform(smoothProgress, [0, 0.9, 1], [1, 1, 1]);

  // --- Water Reflection ---
  // The reflection is perfectly mirrored. If water is at y: 800, reflection = 800 + (800 - sphereY)
  const reflectionY = useTransform(smoothProgress, [0, 0.4, 0.8, 1], [1600, 1100, 950, 800]);

  // --- Splash Trigger ---
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    // When the sphere hits the water (progress > 0.95), trigger the splash
    if (latest > 0.95 && !hasSplashed) {
      setHasSplashed(true);
    } else if (latest < 0.9 && hasSplashed) {
      // Reset if they scroll back up
      setHasSplashed(false);
    }
  });

  // --- Ring Opacity ---
  const ringOpacity = useTransform(smoothProgress, [0, 0.2, 0.4, 1], [0, 0, 1, 1]);

  // --- Parallax Rocks & Environment ---
  const rockY = useTransform(smoothProgress, [0, 1], [0, -600]);
  const rockScale = useTransform(smoothProgress, [0, 1], [1, 1.3]);
  
  // The water physically sits at the bottom of the canyon.
  // We keep it hidden 600px below the screen, and it rises up perfectly as the camera falls down into the canyon!
  const waterY = useTransform(smoothProgress, [0, 1], [600, 0]);

  return (
    <div className="css-peach-container">
      {/* Foreground Rocks - Now with parallax scrolling and seamless kaleidoscope tiling! */}
      <motion.div 
        className="css-peach-rock-wrapper left" 
        style={{ y: rockY, scale: rockScale, transformOrigin: 'left center' }} 
      >
        <div className="css-peach-rock top" />
        <div className="css-peach-rock bottom" />
      </motion.div>

      <motion.div 
        className="css-peach-rock-wrapper right" 
        style={{ y: rockY, scale: rockScale, transformOrigin: 'right center' }} 
      >
        <div className="css-peach-rock-mirror">
          <div className="css-peach-rock top" />
          <div className="css-peach-rock bottom" />
        </div>
      </motion.div>

      {/* Static rings, CSS animations handle the spin, Framer Motion handles the fade-in */}
      <motion.div className="css-peach-ring" style={{ opacity: ringOpacity }} />
      <motion.div className="css-peach-ring-inner" style={{ opacity: ringOpacity }} />

      {/* Main Falling Sphere */}
      <motion.div 
        className="css-peach-sphere"
        style={{
          y: sphereY,
          scale: sphereScale,
          opacity: sphereOpacity
        }}
      />

      {/* Dark Ocean Water Plane (3D Perspective Floor) */}
      <motion.div 
        className="css-peach-water-plane"
        style={{ y: waterY }}
      >
        <div className="css-peach-water-surface" />
        
        {/* Mirrored Reflection Sphere with Water Filter */}
        <motion.div 
          className="css-peach-sphere-reflection"
          style={{
            y: reflectionY,
            scale: sphereScale,
          }}
        />
        
        {/* Scattered Water Rocks */}
        <div className="css-water-rock w1" />
        <div className="css-water-rock w2" />
        <div className="css-water-rock w3" />
      </motion.div>

      {/* Splash Animation Container */}
      <motion.div 
        className="css-peach-splash-container"
        style={{ y: waterY }}
      >
        <div className={`css-splash-ripple r1 ${hasSplashed ? 'animate' : ''}`} />
        <div className={`css-splash-ripple r2 ${hasSplashed ? 'animate' : ''}`} />
        <div className={`css-splash-ripple r3 ${hasSplashed ? 'animate' : ''}`} />
      </motion.div>
    </div>
  );
}
