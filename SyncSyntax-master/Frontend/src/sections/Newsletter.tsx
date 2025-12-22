import { useState } from 'react';
import Headings from '../components/Headings';
import CTAButton from '../components/CTAButton';
import { useAuth } from '../contexts/AuthContext';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { isAuthenticated, user, refreshAuthStatus } = useAuth();

  const isAlreadySubscribed = isAuthenticated && user?.isNewsletterSubscribed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const targetEmail = isAuthenticated ? user?.email : email;

    try {
      const response = await fetch('/api/newsletterapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Successfully subscribed to the community!' });
        setEmail('');
        if (isAuthenticated) {
          await refreshAuthStatus();
        }
      } else {
        const error = await response.json().catch(() => ({}));
        setStatus({ type: 'error', message: error.error || 'Subscription failed. Please try again.' });
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAlreadySubscribed) {
    return (
      <section id="newsletter" className="py-20 bg-[#E7F4F7]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0077B6]/10 rounded-full mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#0077B6]" />
          </div>
          <h2 className="text-3xl font-bold text-[#333333] mb-4">You're All Set!</h2>
          <p className="text-xl text-[#0077B6] font-medium bg-white/50 py-4 px-8 rounded-2xl border border-[#0077B6]/20 inline-block shadow-sm">
            Check Your Mail Inbox For More Content!
          </p>
          <p className="text-[#333333] mt-6 max-w-lg mx-auto leading-relaxed">
            We've sent a welcome gift to your inbox. Stay tuned for the latest travel stories and exclusive tips.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="newsletter" className="py-20 bg-[#E7F4F7]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Headings
          upheading="Stay Connected"
          mainHeading="Join Our Travel Community"
          highlightWords={['Community']}
          subheading={isAuthenticated ? "Ready to dive deeper? Click below to join our premium newsletter." : "Get the latest travel stories, tips, and exclusive content delivered straight to your inbox"}
        />

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mt-8">
          {!isAuthenticated && (
            <div className="relative flex-1 group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0077B6] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full pl-12 pr-6 py-3.5 rounded-xl text-[16px] text-[#333333] border-2 border-white focus:border-[#0077B6] focus:outline-none transition-all shadow-sm"
              />
            </div>
          )}
          <div className={isAuthenticated ? "w-full flex justify-center" : ""}>
            <CTAButton
              type="submit"
              size="large"
              disabled={isSubmitting}
              className={isAuthenticated ? "min-w-[200px]" : ""}
            >
              {isSubmitting ? 'Processing...' : 'Subscribe To The Newsletter'}
            </CTAButton>
          </div>
        </form>

        {status && (
          <p className={`text-center mt-6 font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {status.message}
          </p>
        )}

        <p className="text-center text-[14px] text-[#333333] mt-6 opacity-80">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}


