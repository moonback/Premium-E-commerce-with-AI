import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, CreditCard, Shield, Truck, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Back to top button - Amazon style */}
      <button
        onClick={scrollToTop}
        className="w-full py-4 bg-[#37475a] hover:bg-[#485769] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <ArrowUp className="w-4 h-4" />
        Haut de page
      </button>

      {/* Main footer content */}
      <div className="bg-[#232f3e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Column 1 - About */}
            <div>
              <h3 className="text-white font-bold text-sm mb-4">À propos</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Qui sommes-nous
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Carrières
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Nos magasins
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Presse
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2 - Service Client */}
            <div>
              <h3 className="text-white font-bold text-sm mb-4">Service Client</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Contactez-nous
                  </Link>
                </li>
                <li>
                  <Link to="/livraison" className="text-white/70 hover:text-white text-sm transition-colors">
                    Livraison & Retours
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Suivi de commande
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 - Légal */}
            <div>
              <h3 className="text-white font-bold text-sm mb-4">Informations légales</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/mentions-legales" className="text-white/70 hover:text-white text-sm transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link to="/cgv" className="text-white/70 hover:text-white text-sm transition-colors">
                    CGV
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/70 hover:text-white text-sm transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 - Nous suivre */}
            <div>
              <h3 className="text-white font-bold text-sm mb-4">Nous suivre</h3>
              <div className="flex gap-3 mb-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Facebook className="w-5 h-5 text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Twitter className="w-5 h-5 text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Youtube className="w-5 h-5 text-white" />
                </a>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>contact@veridian.fr</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>01 23 45 67 89</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges - Amazon style */}
      <div className="bg-[#131921] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-[#ff9900]" />
              <p className="text-white/70 text-xs">Livraison rapide</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-[#ff9900]" />
              <p className="text-white/70 text-xs">Paiement sécurisé</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="w-8 h-8 text-[#ff9900]" />
              <p className="text-white/70 text-xs">Tous moyens de paiement</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8 text-[#ff9900]" />
              <p className="text-white/70 text-xs">Service client 7j/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#131921] border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-white/50 text-xs">
            <p>© 2024 Véridian. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <img src="/icons/icon-72x72.svg" alt="Véridian" className="h-6 opacity-50" />
              <span>Made with ❤️ in France</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
