import React from 'react';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Features } from '../components/landing/Features';
import { Security } from '../components/landing/Security';
import { Demo } from '../components/landing/Demo';
import { FAQ } from '../components/landing/FAQ';
import { Footer } from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />
      <HowItWorks />
      <Features />
      <Security />
      <Demo />
      <FAQ />
      <Footer />
    </div>
  );
}