
import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Phone, Mail, MapPin, Briefcase, User as UserIcon, Wrench, Home, Check, X, Edit2 } from 'lucide-react';
import { User, UserType } from '../types';
import { StorageService } from '../services/storageService';

// Mock Data for demonstration
const MOCK_USERS: User[] = [
  // Residents
  { id: '1', name: 'Ana Silva', email: 'ana@email.com', phone: '(11) 99999-1111', type: UserType.RESIDENT, unit: '101', status: 'active', registeredAt: '2023-01-15' },
  { id: '2', name: 'Bruno Santos', email: 'bruno@email.com', phone: '(11) 99999-2222', type: UserType.OWNER, unit: '102', status: 'active', registeredAt: '2023-02-20' },
  { id: '3', name: 'Carla Dias', email: 'carla@email.com', phone: '(11) 99999-3333', type: UserType.TENANT, unit: '201', status: 'active', registeredAt: '2023-03-10' },
  { id: '8', name: 'Roberto Almeida', email: 'roberto@email.com', phone: '(11) 99999-8888', type: UserType.RESIDENT, unit: 'Cob-01', status: 'inactive', registeredAt: '2023-04-05' },
  // Employees
  { id: '4', name: 'Daniel Oliveira', email: 'daniel@aml.com', phone: '(11) 99999-4444', type: UserType.EMPLOYEE, status: 'active', registeredAt: '2023-01-01', serviceType: 'Porteiro' },
  { id: '5', name: 'Eduarda Lima', email: 'eduarda@aml.com', phone: '(11) 99999-5555', type: UserType.ADMIN, status: 'active', registeredAt: '2022-12-01', serviceType: 'Gerente' },
  { id: '9', name: 'Ricardo Segurança', email: 'ricardo@aml.com', phone: '(11) 99999-9999', type: UserType.EMPLOYEE, status: 'active', registeredAt: '2023-02-15', serviceType: 'Segurança' },
  // Providers
  { id: '6', name: 'Fernando Tech', email: 'fernando@tech.com', phone: '(11) 99999-6666', type: UserType.SERVICE_PROVIDER, status: 'active', registeredAt: '2023-05-15', serviceType: 'Manutenção TI' },
  { id: '7', name: 'Gabriela Limp', email: 'gabi@clean.com', phone: '(11) 99999-7777', type: UserType.SERVICE_PROVIDER, status: 'inactive', registeredAt: '2023-06-20', serviceType: 'Jardinagem' },
];

interface UserListProps {
  category: 'residents' | 'employees' | 'providers';
}

export const UserList: React.FC<UserListProps> = ({ category }) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', phone: '' });

  const getCategoryTypes = () => {
    switch(category) {
      case 'residents': return [UserType.RESIDENT, UserType.OWNER, UserType.TENANT, UserType.DEPENDENT, UserType.ASSOCIATE];
      case 'employees': return [UserType.EMPLOYEE, UserType.ADMIN];
      case 'providers': return [UserType.SERVICE_PROVIDER];
      default: return [];
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesCategory = getCategoryTypes().includes(user.type);
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesCategory && matchesSearch && matchesStatus;
  });

  const handleEditClick = (user: User) => {
    setEditingId(user.id);
    setEditForm({ email: user.email, phone: user.phone });
  };

  const handleSaveClick = (id: string) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...editForm } : u);
    setUsers(updatedUsers);
    const edited = updatedUsers.find(u => u.id === id);
    if (edited) StorageService.saveUser(edited);
    setEditingId(null);
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome, unidade ou função..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm font-medium"
          >
            <option value="all">Status: Todos</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors shadow-sm shadow-cyan-200">
            <span className="text-sm font-bold">+ Adicionar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Usuário</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Contato</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-600">
                  {category === 'residents' ? 'Unidade' : 'Função/Empresa'}
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">ID: #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <div className="space-y-2">
                          <input 
                            type="email" 
                            className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          />
                          <input 
                            type="text" 
                            className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveClick(user.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Salvar</button>
                            <button onClick={handleCancelClick} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 group/contact relative">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} /> <span className="text-xs">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} /> <span className="text-xs">{user.phone}</span>
                          </div>
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="absolute top-0 right-0 opacity-0 group-hover/contact:opacity-100 text-blue-500 hover:bg-blue-50 p-1 rounded transition-all"
                            title="Editar Contato"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {user.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        {category === 'residents' ? (
                          <>
                            <Home size={16} className="text-slate-400" />
                            <span className="font-medium">{user.unit || 'N/A'}</span>
                          </>
                        ) : (
                          <>
                            <Briefcase size={16} className="text-slate-400" />
                            <span className="font-medium">{user.serviceType || user.type}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-600' : 'bg-slate-500'}`}></span>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserIcon size={32} className="text-slate-300" />
                    </div>
                    <p className="text-sm">Nenhum usuário encontrado nesta categoria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
