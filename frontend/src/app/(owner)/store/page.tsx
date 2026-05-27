/* eslint-disable jsx-a11y/no-static-element-interactions */
'use client';

import { useEffect, useState } from 'react';
import { Store, Save, Palette } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function StoreSettingsPage() {
  const { store: authStore, fetchCurrentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    phone: '',
    theme_color: '#3B82F6',
  });

  useEffect(() => {
    if (authStore) {
      setFormData({
        store_name: authStore.store_name || '',
        address: authStore.address || '',
        phone: authStore.phone || '',
        theme_color: authStore.theme_color || '#3B82F6',
      });
      setIsLoading(false);
    }
  }, [authStore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put('/store', formData);
      toast.success('Store settings updated successfully');
      // Refresh user data to get updated store info
      await fetchCurrentUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <Loading text="Loading settings..." />;
  }

  const colorPresets = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
          Store Settings
        </h1>
        <p className="text-gray-500 mt-2">Manage your store information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Store Name"
              name="store_name"
              value={formData.store_name}
              onChange={handleChange}
              placeholder="My Awesome Store"
              required
            />

            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street, City, State"
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Theme Color</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={handleChange}
                    className="h-12 w-20 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
                    title="Select theme color"
                  />
                  <Input
                    value={formData.theme_color}
                    onChange={handleChange}
                    name="theme_color"
                    placeholder="#3B82F6"
                    className="w-32"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Color Presets</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_color: preset.value })}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200
                      ${formData.theme_color === preset.value
                        ? 'border-gray-900 ring-2 ring-blue-400 ring-offset-2 scale-105'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    style={{ backgroundColor: preset.value }}
                    title={`Set to ${preset.name}`}
                  >
                    <span className="sr-only">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4">Preview</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-white font-medium transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: formData.theme_color }}
                  title="Primary button preview"
                >
                  Primary Button
                </button>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium border"
                  style={{
                    backgroundColor: `${formData.theme_color}15`,
                    color: formData.theme_color,
                    borderColor: `${formData.theme_color}40`,
                  }}
                  title="Badge preview"
                >
                  Badge
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Store Info Display */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Store Details</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Store className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-600">Store ID</p>
                <p className="font-semibold text-blue-900">{authStore?.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <Store className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-600">Created On</p>
                <p className="font-semibold text-emerald-900">
                  {authStore?.created_at
                    ? new Date(authStore.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (authStore) {
                setFormData({
                  store_name: authStore.store_name || '',
                  address: authStore.address || '',
                  phone: authStore.phone || '',
                  theme_color: authStore.theme_color || '#3B82F6',
                });
              }
            }}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}