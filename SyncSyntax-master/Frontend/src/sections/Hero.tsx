import CTAButton from '../components/CTAButton';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const scrollToNewsletter = () => {
    const newsletterSection = document.getElementById('newsletter');
    if (newsletterSection) {
      newsletterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <section
      id="hero"
      className="relative h-screen flex items-center justify-center text-center bg-cover bg-center"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1920)',
      }}
    >
      <div className="max-w-4xl px-6">
        <p className="text-[22px] font-bold uppercase tracking-wide text-white mb-4">
          Explore The World
        </p>
        <h1 className="text-[48px] lg:text-[64px] font-bold text-white mb-6 leading-tight">
          Discover Stories From <span className="text-[#F77F00]">Every Corner</span>
        </h1>
        <p className="text-[18px] text-white mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of travelers sharing their adventures, tips, and unforgettable experiences from around the globe.
        </p>
        <CTAButton size="large" onClick={scrollToNewsletter}>
          <div className="flex items-center gap-2">
            Subscribe to Newsletter
            <ChevronDown className="w-5 h-5" />
          </div>
        </CTAButton>
      </div>
    </section>
  );
}
