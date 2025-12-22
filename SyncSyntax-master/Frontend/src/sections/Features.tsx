import { Globe, Users, Camera, MapPin, Award } from 'lucide-react';
import Headings from '../components/Headings';

export default function Features() {
  const features = [
    {
      icon: Globe,
      title: 'Global Destinations',
    },
    {
      icon: Users,
      title: 'Traveler Community',
    },
    {
      icon: Camera,
      title: 'Visual Stories',
    },
    {
      icon: MapPin,
      title: 'Hidden Gems',
    },
    {
      icon: Award,
      title: 'Expert Guides',
    },
  ];

  return (
    <section className="py-20 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Headings
          upheading="Why Choose Us"
          mainHeading="Your Gateway to Authentic Travel"
          highlightWords={['Gateway', 'Travel']}
          subheading="Discover what makes our travel community special"
        />

        <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 rounded-full bg-[#E7F4F7] flex items-center justify-center mb-4 group-hover:bg-[#0077B6] transition-colors duration-300">
                <feature.icon className="w-10 h-10 text-[#0077B6] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#333333]">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
