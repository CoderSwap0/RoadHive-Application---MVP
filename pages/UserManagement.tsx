import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Select } from '../components/UI';
import { User, Role } from '../types';
import { userService } from '../services/userService';
import { Edit2, Trash2, Plus, Search, X } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', email: '', companyName: '', role: 'SHIPPER'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Basic route protection in component as well
    if (currentUser && !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', companyName: '', role: 'SHIPPER' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      showToast("User deleted successfully", "success");
    } catch (err) {
      showToast('Failed to delete user', "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const updated = await userService.updateUser({ ...editingUser, ...formData } as User);
        setUsers(users.map(u => u.id === updated.id ? updated : u));
        showToast("User updated successfully", "success");
      } else {
        const created = await userService.createUser(formData as Omit<User, 'id'>);
        setUsers([created, ...users]);
        showToast("User created successfully", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to save user.', "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    u.companyName.toLowerCase().includes(filter.toLowerCase())
  );

  const roleOptions = [
    { value: 'SHIPPER', label: 'Shipper' },
    { value: 'TRANSPORTER', label: 'Transporter' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'RECEIVER', label: 'Receiver' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPER_ADMIN', label: 'SuperAdmin' },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system access and roles</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-64">
                <Input 
                    placeholder="Search users..." 
                    icon={Search} 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add User
            </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold mr-3">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}
                                    `}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {u.companyName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <div className="p-4 text-center text-gray-500">No users found.</div>}
            </div>
        )}
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <Card className="w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <Input 
                        label="Full Name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    <Input 
                        label="Email Address" 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    <Input 
                        label="Company Name" 
                        value={formData.companyName} 
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        required
                    />
                    <Select 
                        label="Role"
                        options={roleOptions}
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value as Role})}
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>Save User</Button>
                    </div>
                </form>
            </Card>
        </div>
      )}
    </div>
  );
};