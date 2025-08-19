'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mail, Phone, Send, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { countries, Country } from '@/data/countries';

interface NewsletterFormProps {
  variant?: 'hero' | 'footer';
  className?: string;
}

export default function NewsletterForm({ variant = 'footer', className }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to US
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'both'>('email');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validatePhone = (phoneNumber: string) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    // Basic validation: should have at least 7 digits and max 15 digits
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on country (basic US/Canada formatting for now)
    if (countryCode === 'US' || countryCode === 'CA') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    
    // Basic international formatting (groups of 3-4 digits)
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // At least one of email or phone must be provided
    if (!email && !phone) {
      setStatus('error');
      setMessage('Please enter either your email address or phone number');
      return;
    }

    // Validate email if provided
    if (email && (!email.includes('@') || !email.includes('.'))) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      setStatus('error');
      setMessage('Please enter a valid phone number');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const subscriptionData = {
        ...(email && { email }),
        ...(phone && { 
          phone: `${selectedCountry.dialCode}${phone.replace(/\D/g, '')}`,
          country: selectedCountry.code 
        })
      };

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setMessage('🎉 Successfully subscribed to our newsletter!');
      setEmail('');
      setPhone('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {isHero && (
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">
              Stay Updated
            </h3>
            <p className="text-gray-300 text-sm">
              Get exclusive drops and style updates
            </p>
          </div>
        )}

        {/* Contact Method Selector */}
        <div className="space-y-4">
          {/* OR Divider - positioned above selector buttons */}
          {contactMethod !== 'both' && (
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black px-3 py-1 text-xs text-white/60 font-medium">
                  Choose one contact method
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => {
                if (contactMethod === 'email') {
                  setContactMethod('both');
                } else {
                  setContactMethod('email');
                  setPhone('');
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200",
                contactMethod === 'email' || contactMethod === 'both'
                  ? "bg-white text-black shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                if (contactMethod === 'phone') {
                  setContactMethod('both');
                } else {
                  setContactMethod('phone');
                  setEmail('');
                }
              }}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200",
                contactMethod === 'phone' || contactMethod === 'both'
                  ? "bg-white text-black shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Phone size={16} />
              Phone
            </button>
          </div>

          {/* Email Input */}
          <AnimatePresence>
            {(contactMethod === 'email' || contactMethod === 'both') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Mail 
                  className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2",
                    isHero ? "text-gray-300" : "text-gray-400"
                  )} 
                  size={18} 
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === 'loading'}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200",
                    "focus:outline-none focus:ring-2",
                    isHero ? [
                      "bg-black/30 border-white/20 text-white placeholder-gray-300",
                      "focus:ring-white/30 focus:border-white/40",
                      "backdrop-blur-sm"
                    ] : [
                      "bg-neutral-800 border-neutral-700 text-white placeholder-gray-400",
                      "focus:ring-cyan-500/50 focus:border-cyan-500/50"
                    ],
                    status === 'loading' && "opacity-50 cursor-not-allowed"
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Input */}
          <AnimatePresence>
            {(contactMethod === 'phone' || contactMethod === 'both') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Country Code Dropdown */}
                <div ref={dropdownRef} className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    disabled={status === 'loading'}
                    className={cn(
                      "flex items-center space-x-1 px-2 py-1 rounded text-sm",
                      "hover:bg-white/10 transition-colors duration-200",
                      "focus:outline-none",
                      isHero ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-white",
                      status === 'loading' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span className="text-xs font-mono">{selectedCountry.dialCode}</span>
                    <ChevronDown size={12} className={cn(
                      "transition-transform duration-200",
                      showCountryDropdown && "rotate-180"
                    )} />
                  </button>
                  
                  {showCountryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute top-full mt-1 w-64 max-h-60 overflow-y-auto",
                        "rounded-lg border backdrop-blur-sm z-30",
                        isHero ? [
                          "bg-black/80 border-white/20"
                        ] : [
                          "bg-neutral-800 border-neutral-700"
                        ]
                      )}
                    >
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2 text-left text-sm",
                            "hover:bg-white/10 transition-colors duration-200",
                            "focus:outline-none focus:bg-white/10",
                            selectedCountry.code === country.code && "bg-white/10",
                            isHero ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-white"
                          )}
                        >
                          <span className="text-base">{country.flag}</span>
                          <span className="font-mono text-xs">{country.dialCode}</span>
                          <span className="truncate">{country.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
                
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^\d]/g, '');
                    const formattedValue = formatPhoneNumber(rawValue, selectedCountry.code);
                    setPhone(formattedValue);
                  }}
                  placeholder="Phone number"
                  disabled={status === 'loading'}
                  className={cn(
                    "w-full pl-28 pr-4 py-3 rounded-lg border transition-all duration-200",
                    "focus:outline-none focus:ring-2",
                    isHero ? [
                      "bg-black/30 border-white/20 text-white placeholder-gray-300",
                      "focus:ring-white/30 focus:border-white/40",
                      "backdrop-blur-sm"
                    ] : [
                      "bg-neutral-800 border-neutral-700 text-white placeholder-gray-400",
                      "focus:ring-cyan-500/50 focus:border-cyan-500/50"
                    ],
                    status === 'loading' && "opacity-50 cursor-not-allowed"
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <motion.button
          type="submit"
          disabled={status === 'loading' || (!email && !phone)}
          className={cn(
            "w-full py-2 sm:py-3 px-4 sm:px-6 font-semibold transition-all duration-300",
            "flex items-center justify-center space-x-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-white text-black hover:bg-gray-200 transform hover:scale-105",
            "text-sm sm:text-base",
            "focus:outline-none focus:ring-2 focus:ring-white/30"
          )}
          whileHover={{ scale: status === 'loading' ? 1 : 1.05 }}
          whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>SUBSCRIBE</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Status Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-3 p-3 rounded-lg flex items-center space-x-2 text-sm",
            status === 'success' && "bg-green-500/20 text-green-300 border border-green-500/30",
            status === 'error' && "bg-red-500/20 text-red-300 border border-red-500/30"
          )}
        >
          {status === 'success' && <CheckCircle size={16} />}
          {status === 'error' && <AlertCircle size={16} />}
          <span>{message}</span>
        </motion.div>
      )}

      {!isHero && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Join our community for exclusive updates on upcoming fashion releases and style insights—unsubscribe anytime.
        </p>
      )}
    </div>
  );
}