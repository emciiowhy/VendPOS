'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Edit, Trash2, Lock, User as UserIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import api from '@/lib/api';
import { User, Role } from '@/types';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Cashier' as Role,
  });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await api.put(`/auth/users/${selectedUser.user_id}`, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/auth/users', formData);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/auth/users/${userId}/status`, { is_active: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Deactivate this user? Past transactions stay attributable.')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api.patch(`/auth/users/${selectedUser?.user_id}/password`, { password: passwordData.newPassword });
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ email: user.email, password: '', name: user.name, role: user.role });
    setIsModalOpen(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormData({ email: '', password: '', name: '', role: 'Cashier' });
  };

  if (isLoading) return <Loading text="Loading users..." />;

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage Owners and Cashiers for this tenant. Soft-delete keeps history attributable."
        action={
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <UserPlus className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      {users.length === 0 ? (
        <Empty
          title="No users found"
          description="Add cashiers to help run your tenant"
          action={{ label: 'Add First User', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.user_id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === 'Owner' ? 'primary' : 'gray'}>
                    {user.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <Badge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openPasswordModal(user)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Change Password"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.role !== 'Owner' && (
                      <button
                        onClick={() => handleDelete(user.user_id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {user.role !== 'Owner' && (
                  <Button
                    size="sm"
                    variant={user.is_active ? 'secondary' : 'primary'}
                    fullWidth
                    onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={selectedUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!selectedUser}
          />
          {!selectedUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Min 8 characters with uppercase, lowercase, and number"
              required
            />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Cashier">Cashier</option>
              <option value="Owner">Owner</option>
            </select>
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">{selectedUser ? 'Update User' : 'Create User'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordData({ newPassword: '', confirmPassword: '' });
          setSelectedUser(null);
        }}
        title={`Change Password: ${selectedUser?.name}`}
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            helperText="Min 8 characters with uppercase, lowercase, and number"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            required
          />
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => {
              setIsPasswordModalOpen(false);
              setPasswordData({ newPassword: '', confirmPassword: '' });
              setSelectedUser(null);
            }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">Change Password</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
