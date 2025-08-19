'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Download, 
  Search, 
  Calendar,
  Globe,
  Trash2,
  Users,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { countries, getCountryByCode } from '@/data/countries';

interface NewsletterSubscriber {
  id: string;
  email?: string;
  phone?: string;
  country_code?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  source: string;
  created_at: string;
  updated_at: string;
  preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
  };
  last_email_sent_at?: string;
  last_email_opened_at?: string;
}

interface NewsletterAnalytics {
  active_subscribers: number;
  unsubscribed_count: number;
  new_subscribers_30d: number;
  new_subscribers_7d: number;
  subscribers_with_phone: number;
  countries_count: number;
  avg_subscription_age_days: number;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [analytics, setAnalytics] = useState<NewsletterAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubscribers();
    fetchAnalytics();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/newsletter?action=analytics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleStatusChange = async (subscriberId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subscriberId,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchSubscribers();
      await fetchAnalytics();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (subscriberId: string) => {
    if (!confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subscriberId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchSubscribers();
      await fetchAnalytics();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
    }
  };

  const exportToCSV = () => {
    const csvData = filteredSubscribers.map(sub => ({
      Email: sub.email || '',
      Phone: sub.phone || '',
      Country: sub.country_code ? getCountryByCode(sub.country_code)?.name || sub.country_code : '',
      Status: sub.status,
      Source: sub.source,
      'Subscribed Date': new Date(sub.created_at).toLocaleDateString(),
      'Email Notifications': sub.preferences?.email_notifications ? 'Yes' : 'No',
      'SMS Notifications': sub.preferences?.sms_notifications ? 'Yes' : 'No'
    }));

    const csvHeaders = Object.keys(csvData[0] || {});
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => csvHeaders.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = (subscriber.email && subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (subscriber.phone && subscriber.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || subscriber.country_code === countryFilter;
    
    return matchesSearch && matchesStatus && matchesCountry;
  });

  const getCountryName = (countryCode: string) => {
    return getCountryByCode(countryCode)?.name || countryCode;
  };

  const getCountryFlag = (countryCode: string) => {
    return getCountryByCode(countryCode)?.flag || '🌍';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Newsletter Subscribers</h1>
          <p className="text-gray-400 mt-1">Manage your newsletter subscriber list</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-800 p-6 rounded-lg border border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Subscribers</p>
                <p className="text-2xl font-bold text-white">{analytics.active_subscribers}</p>
              </div>
              <Users className="text-green-400" size={24} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-800 p-6 rounded-lg border border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">New (30 days)</p>
                <p className="text-2xl font-bold text-white">{analytics.new_subscribers_30d}</p>
              </div>
              <TrendingUp className="text-blue-400" size={24} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-800 p-6 rounded-lg border border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">With Phone</p>
                <p className="text-2xl font-bold text-white">{analytics.subscribers_with_phone}</p>
              </div>
              <Phone className="text-purple-400" size={24} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-800 p-6 rounded-lg border border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Countries</p>
                <p className="text-2xl font-bold text-white">{analytics.countries_count}</p>
              </div>
              <Globe className="text-cyan-400" size={24} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Countries</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subscriber</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subscribed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {filteredSubscribers.map((subscriber, index) => (
                <motion.tr
                  key={subscriber.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-neutral-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-3" size={16} />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {subscriber.email || (subscriber.phone ? 'Phone Only' : 'No Email')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {subscriber.email && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subscriber.preferences?.email_notifications ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                            }`}>
                              Email
                            </span>
                          )}
                          {subscriber.phone && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subscriber.preferences?.sms_notifications ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                            }`}>
                              SMS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {subscriber.phone && (
                        <div className="flex items-center text-sm text-gray-300">
                          <Phone size={14} className="mr-2" />
                          {subscriber.phone}
                        </div>
                      )}
                      {subscriber.country_code && (
                        <div className="flex items-center text-sm text-gray-300">
                          <MapPin size={14} className="mr-2" />
                          <span className="mr-1">{getCountryFlag(subscriber.country_code)}</span>
                          {getCountryName(subscriber.country_code)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={subscriber.status}
                      onChange={(e) => handleStatusChange(subscriber.id, e.target.value)}
                      className={`px-2 py-1 text-xs rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        subscriber.status === 'active' 
                          ? 'bg-green-900 text-green-300'
                          : subscriber.status === 'unsubscribed'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="unsubscribed">Unsubscribed</option>
                      <option value="bounced">Bounced</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                    {subscriber.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      {formatDate(subscriber.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {subscriber.email && (
                        <button
                          onClick={() => window.location.href = `mailto:${subscriber.email}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Send Email"
                        >
                          <Mail size={16} />
                        </button>
                      )}
                      {subscriber.phone && (
                        <button
                          onClick={() => window.location.href = `tel:${subscriber.phone}`}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="Call Phone"
                        >
                          <Phone size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Subscriber"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredSubscribers.length === 0 && (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-300">No subscribers found</h3>
              <p className="mt-2 text-sm text-gray-400">
                {searchTerm || statusFilter !== 'all' || countryFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Newsletter subscribers will appear here when people sign up.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}