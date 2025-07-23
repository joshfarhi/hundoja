'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Mail, Save, Eye, EyeOff, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import DebugMode from '@/components/admin/DebugMode';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import Accordion from '@/components/ui/Accordion';

interface EmailSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  encrypted: boolean;
  description: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching settings...');
      const response = await fetch('/api/admin/settings');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Settings data:', data);
      setSettings(data);
      
      // Initialize form data
      const initialData: Record<string, string> = {};
      data.forEach((setting: EmailSetting) => {
        initialData[setting.setting_key] = setting.setting_value || '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setStatus({ type: 'error', message: `Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}` });
      
      // Fallback: create default settings structure if API fails
      const defaultSettings: EmailSetting[] = [
        { id: '1', setting_key: 'gmail_user', setting_value: '', encrypted: false, description: 'Gmail email address for sending newsletters and notifications' },
        { id: '2', setting_key: 'gmail_app_password', setting_value: '', encrypted: true, description: 'Gmail app password for SMTP authentication' },
        { id: '3', setting_key: 'newsletter_from_name', setting_value: 'Hundoja', encrypted: false, description: 'Display name for newsletter emails' },
        { id: '4', setting_key: 'admin_notification_enabled', setting_value: 'true', encrypted: false, description: 'Enable admin notifications for new subscribers' }
      ];
      setSettings(defaultSettings);
      
      const initialData: Record<string, string> = {};
      defaultSettings.forEach((setting) => {
        initialData[setting.setting_key] = setting.setting_value || '';
      });
      setFormData(initialData);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setStatus({ type: 'success', message: 'Settings saved successfully!' });
      await fetchSettings(); // Refresh data
    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="text-cyan-400" size={24} />
          <h1 className="text-2xl font-bold text-white">Email Settings</h1>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 space-y-6">
          <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Mail className="text-blue-400 mt-0.5" size={20} />
            <div>
              <h3 className="text-blue-400 font-semibold">Gmail Configuration</h3>
              <p className="text-gray-300 text-sm mt-1">
                Configure your Gmail credentials to enable newsletter subscriptions and admin notifications. 
                You&apos;ll need to generate an App Password from your Google Account settings.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <p className="text-xs text-gray-400 mb-2">{setting.description}</p>
                
                <div className="relative">
                  {setting.encrypted ? (
                    <div className="flex">
                      <input
                        type={showPasswords[setting.setting_key] ? 'text' : 'password'}
                        value={formData[setting.setting_key] || ''}
                        onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                        placeholder={setting.setting_key === 'gmail_app_password' ? 'Enter Gmail App Password' : 'Enter value'}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(setting.setting_key)}
                        className="bg-zinc-800 border border-l-0 border-zinc-700 rounded-r-lg px-3 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPasswords[setting.setting_key] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  ) : (
                    <input
                      type={setting.setting_key === 'gmail_user' ? 'email' : 'text'}
                      value={formData[setting.setting_key] || ''}
                      onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                      placeholder={
                        setting.setting_key === 'gmail_user' ? 'your-email@gmail.com' :
                        setting.setting_key === 'newsletter_from_name' ? 'Hundoja' : 'Enter value'
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          {status.type && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center space-x-2 p-4 rounded-lg",
                status.type === 'success' && "bg-green-500/20 text-green-300 border border-green-500/30",
                status.type === 'error' && "bg-red-500/20 text-red-300 border border-red-500/30"
              )}
            >
              {status.type === 'success' && <CheckCircle size={16} />}
              {status.type === 'error' && <AlertCircle size={16} />}
              <span className="text-sm">{status.message}</span>
            </motion.div>
          )}

          {/* Advanced Settings */}
          <div className="pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-white">
                  Enable Advanced Email Analytics
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Track open rates, click-throughs, and more.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <ToggleSwitch
                  checked={false}
                  onChange={() => {}}
                  disabled={true}
                />
                <span className="flex items-center space-x-1.5 text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full border border-amber-500/30">
                  <Wrench size={12} />
                  <span>Under Construction</span>
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 mt-6 border-t border-zinc-800">
            <div className="relative group">
              <motion.button
                onClick={handleSave}
                disabled={true} // Always disabled
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>Save Settings</span>
              </motion.button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Settings are currently read-only.
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-700 rotate-45" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Accordion for instructions */}
        <Accordion title="How to Generate Gmail App Password">
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Go to your Google Account settings</li>
              <li>Navigate to Security → 2-Step Verification</li>
              <li>At the bottom, select &quot;App passwords&quot;</li>
              <li>Select &quot;Mail&quot; and choose your device</li>
              <li>Copy the 16-character app password and paste it above</li>
            </ol>
            <p className="text-yellow-400 text-xs mt-4">
              ⚠️ Note: You must have 2-Step Verification enabled on your Google account to generate app passwords.
            </p>
          </div>
        </Accordion>
      </motion.div>

      <DebugMode />
    </div>
  );
}