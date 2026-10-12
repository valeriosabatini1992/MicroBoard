'use client';
import { useEffect } from 'react';

export const PwaRegister = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('MicroBoard Service Worker registered with scope:', registration.scope);
          },
          (err) => {
            console.warn('MicroBoard Service Worker registration failed:', err);
          }
        );
      });
    }
  }, []);

  return null;
};
