import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Headings from './Headings';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "How often do you publish new blog posts?",
    answer: "We publish new travel blog posts every week, featuring fresh destinations, travel tips, and inspiring stories from around the world. Subscribe to our newsletter to never miss an update!"
  },
  {
    id: 2,
    question: "Can I submit my own travel stories?",
    answer: "Absolutely! We love featuring guest writers and their unique travel experiences. Send us your story proposal including destination, key highlights, and a brief outline. Our editorial team will review and get back to you within 5-7 business days."
  },
  {
    id: 3,
    question: "Do you provide travel planning services?",
    answer: "While we don't offer direct travel planning services, our blog posts include detailed itineraries, budget breakdowns, and practical tips to help you plan your own adventures. We also partner with trusted travel agencies that can assist with bookings."
  },
  {
    id: 4,
    question: "How can I stay updated with your latest content?",
    answer: "You can subscribe to our newsletter for weekly updates, follow us on social media, or bookmark our blog. We also have RSS feeds available for those who prefer feed readers."
  },
  {
    id: 5,
    question: "Are your travel recommendations based on personal experience?",
    answer: "Yes! All our recommendations come from actual travel experiences by our writers and contributors. We believe in authentic storytelling and only recommend places, accommodations, and activities we've personally tried and tested."
  },
  {
    id: 6,
    question: "Do you cover budget travel or just luxury destinations?",
    answer: "We cover the full spectrum of travel experiences! From budget backpacking adventures to luxury getaways, we believe great travel experiences are possible at every budget level. Each post includes budget information to help you plan accordingly."
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Headings
          upheading="Got Questions?"
          mainHeading="Frequently Asked Questions"
          highlightWords={['Questions']}
          subheading="Find answers to common questions about our travel blog and content"
        />

        <div className="space-y-4">
          {faqData.map((item) => {
            const isOpen = openItems.includes(item.id);
            
            return (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <h3 className="text-[18px] font-semibold text-gray-800 pr-4 leading-relaxed">
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0 ml-4">
                    {isOpen ? (
                      <ChevronUp size={20} className="text-[#0077B6] transition-transform duration-200" />
                    ) : (
                      <ChevronDown size={20} className="text-[#0077B6] transition-transform duration-200" />
                    )}
                  </div>
                </button>
                
                <div
                  id={`faq-answer-${item.id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 bg-white">
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[16px] text-gray-700 leading-relaxed mt-3">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 flex justify-center">
          <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200 text-center max-w-lg w-full">
            <p className="text-[16px] text-gray-700 mb-4">
              Still have questions? We'd love to hear from you!
            </p>
            <button
              type="button"
              onClick={() => {
                // Add your contact logic here or navigate to contact section
                const contactElement = document.getElementById('contact');
                if (contactElement) {
                  contactElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0077B6] text-white font-semibold rounded-lg hover:bg-[#005f8f] transition-colors duration-300 focus:outline-none"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
