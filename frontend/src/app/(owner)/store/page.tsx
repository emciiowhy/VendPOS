'use client';

import { useEffect, useState } from 'react';
import { Save, Palette } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const PRESETS = [
  { name: 'Indigo', value: '#2563eb' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Slate', value: '#475569' },
];

export default function TenantSettingsPage() {
  const { tenant, fetchCurrentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    phone: '',
    theme_color: '#2563eb',
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        business_name: tenant.business_name || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        theme_color: tenant.theme_color || '#2563eb',
      });
      setIsLoading(false);
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/tenant', formData);
      toast.success('Settings saved');
      await fetchCurrentUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <Loading text="Loading settings..." />;

  return (
    <>
      <PageHeader
        title="Tenant settings"
        description="Business info and branding. Logo support coming in a follow-up."
        action={
          <Button form="tenant-form" type="submit" isLoading={isSaving}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        }
      />

      <form id="tenant-form" onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Business information</h2>
          <p className="text-xs text-gray-500 mt-0.5">Appears on printed receipts.</p>
          <div className="mt-5 space-y-4">
            <Input label="Business name" name="business_name" value={formData.business_name} onChange={handleChange} required />
            <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Street, City, Region" />
            <Input label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+63 917 555 0100" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Accent color for the sidebar logo block and key UI surfaces.</p>

          <div className="mt-5 space-y-5">
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="theme_color"
                value={formData.theme_color}
                onChange={handleChange}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                title="Pick color"
              />
              <Input
                value={formData.theme_color}
                onChange={handleChange}
                name="theme_color"
                placeholder="#2563eb"
                className="w-40"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-700">Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_color: preset.value })}
                    className={`h-8 w-8 rounded-md border ${
                      formData.theme_color === preset.value ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    aria-label={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Tenant details</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Tenant ID</p>
              <p className="font-mono font-medium text-gray-900">#{tenant?.tenant_id}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Subscription</p>
              <p className="font-medium text-gray-900">{tenant?.subscription_tier}</p>
            </div>
          </div>
        </Card>
      </form>
    </>
  );
}
