import { Compass, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="bg-[#2C3E50] text-white">  
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div 
              className="flex items-center gap-3 mb-4 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <Compass className="w-8 h-8 text-[#0077B6]" />
              <span className="text-[22px] font-bold">Voyagestics</span>
            </div>
            <p className="text-[14px] text-gray-300 leading-relaxed">
              Sharing authentic travel experiences and inspiring wanderlust in hearts across the globe.
            </p>
          </div>

          <div>
            <h4 className="text-[18px] font-semibold mb-4">Explore</h4>
            <ul className="space-y-2">
              <li>
                <a href="#latest" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  Latest Posts
                </a>
              </li>
              <li>
                <a href="#categories" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#about" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#authors" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  Our Authors
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[18px] font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#guide" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  Travel Guide
                </a>
              </li>
              <li>
                <a href="#tips" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  Travel Tips
                </a>
              </li>
              <li>
                <a href="#contact" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#faq" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[18px] font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#34495E] flex items-center justify-center hover:bg-[#F77F00] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#34495E] flex items-center justify-center hover:bg-[#F77F00] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#34495E] flex items-center justify-center hover:bg-[#F77F00] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#34495E] flex items-center justify-center hover:bg-[#F77F00] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[14px] text-gray-300">
            &copy; 2025 Voyagestics. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#privacy" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-[14px] text-gray-300 hover:text-[#F77F00] transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
