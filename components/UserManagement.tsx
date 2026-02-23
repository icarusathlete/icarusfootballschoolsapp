
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, Player, Venue, Batch } from '../types';
import { Shield, UserPlus, Trash2, Key, Users, Check, MapPin, Layers } from 'lucide-react';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    
    // Form State
    const [form, setForm] = useState({ 
        username: '', 
        password: '', 
        role: 'player' as User['role'], 
        linkedPlayerId: '',
        assignedVenues: [] as string[],
        assignedBatches: [] as string[]
    });

    const loadData = () => {
        setUsers(StorageService.getUsers());
        setPlayers(StorageService.getPlayers());
        setVenues(StorageService.getVenues());
        setBatches(StorageService.getBatches());
    };

    useEffect(() => {
        loadData();
        window.addEventListener('icarus_data_update', loadData);
        return () => window.removeEventListener('icarus_data_update', loadData);
    }, []);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            StorageService.addUser({
                username: form.username,
                password: form.password,
                role: form.role,
                linkedPlayerId: form.role === 'player' ? form.linkedPlayerId : undefined,
                assignedVenues: form.role === 'coach' ? form.assignedVenues : undefined,
                assignedBatches: form.role === 'coach' ? form.assignedBatches : undefined
            });
            
            // Reset Form
            setForm({ 
                username: '', 
                password: '', 
                role: 'player', 
                linkedPlayerId: '',
                assignedVenues: [],
                assignedBatches: []
            });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this user? This cannot be undone.')) {
            StorageService.deleteUser(id);
        }
    };

    const toggleAssignment = (type: 'venue' | 'batch', value: string) => {
        if (type === 'venue') {
            setForm(prev => ({
                ...prev,
                assignedVenues: prev.assignedVenues.includes(value)
                    ? prev.assignedVenues.filter(v => v !== value)
                    : [...prev.assignedVenues, value]
            }));
        } else {
            setForm(prev => ({
                ...prev,
                assignedBatches: prev.assignedBatches.includes(value)
                    ? prev.assignedBatches.filter(b => b !== value)
                    : [...prev.assignedBatches, value]
            }));
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Access Control & Staff Onboarding</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form */}
                <div className="bg-white p-8 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 h-fit">
                    <div className="flex items-center gap-3 mb-6 text-icarus-900 pb-4 border-b border-gray-50">
                        <div className="p-2 bg-icarus-50 rounded-lg"><UserPlus className="w-6 h-6 text-icarus-600" /></div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Create Credentials</h3>
                            <p className="text-xs text-gray-400">Add new system access</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Username / Full Name</label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-icarus-500/10 focus:border-icarus-500 outline-none transition-all font-medium text-gray-800"
                                value={form.username}
                                onChange={e => setForm({...form, username: e.target.value})}
                                placeholder="e.g. Coach Smith"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    required
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-icarus-500/10 focus:border-icarus-500 outline-none transition-all font-mono text-sm"
                                    value={form.password}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Role</label>
                            <select 
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-icarus-500/10 focus:border-icarus-500 outline-none font-medium bg-white"
                                value={form.role}
                                onChange={e => setForm({...form, role: e.target.value as any})}
                            >
                                <option value="player">Student (Player Portal)</option>
                                <option value="coach">Coach (Team Manager)</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                        
                        {/* Player Linking Logic */}
                        {form.role === 'player' && (
                             <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Link to Player Profile</label>
                                <select 
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-icarus-500/10 focus:border-icarus-500 outline-none font-medium bg-white"
                                    value={form.linkedPlayerId}
                                    onChange={e => setForm({...form, linkedPlayerId: e.target.value})}
                                    required={form.role === 'player'}
                                >
                                    <option value="">Select a player...</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.fullName} ({p.memberId})</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400">User will see data for this athlete.</p>
                            </div>
                        )}

                        {/* Coach Onboarding Logic */}
                        {form.role === 'coach' && (
                            <div className="space-y-4 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <MapPin size={14} /> Assign Venues
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {venues.map(v => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => toggleAssignment('venue', v.name)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                    form.assignedVenues.includes(v.name)
                                                    ? 'bg-icarus-900 text-white border-icarus-900'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {v.name}
                                            </button>
                                        ))}
                                        {venues.length === 0 && <span className="text-xs text-gray-400 italic">No venues defined.</span>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <Layers size={14} /> Assign Batches
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {batches.map(b => (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => toggleAssignment('batch', b.name)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                    form.assignedBatches.includes(b.name)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {b.name}
                                            </button>
                                        ))}
                                        {batches.length === 0 && <span className="text-xs text-gray-400 italic">No batches defined.</span>}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded">Coach will only see players belonging to selected venues AND batches.</p>
                            </div>
                        )}

                        <button className="w-full bg-icarus-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all shadow-lg shadow-icarus-900/20 active:scale-95 mt-4">
                            Create Account
                        </button>
                    </form>
                </div>

                {/* User List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Active Accounts</h3>
                        <span className="text-xs font-bold bg-white border px-3 py-1 rounded-full text-gray-600 shadow-sm">{users.length} Users</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Username</th>
                                    <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Role</th>
                                    <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Assignments</th>
                                    <th className="px-6 py-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => {
                                    const linkedPlayer = players.find(p => p.id === u.linkedPlayerId);
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900">{u.username}</td>
                                            <td className="px-6 py-4 capitalize">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    u.role === 'coach' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {u.role === 'player' && linkedPlayer && (
                                                    <div className="flex items-center gap-2 bg-gray-50 w-fit pr-3 rounded-full border border-gray-200">
                                                        <img src={linkedPlayer.photoUrl} className="w-6 h-6 rounded-full object-cover" />
                                                        <span className="text-xs font-medium text-gray-700">{linkedPlayer.fullName}</span>
                                                    </div>
                                                )}
                                                {u.role === 'coach' && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={10} className="text-gray-400" />
                                                            <span className="text-xs">{u.assignedVenues?.join(', ') || 'All Venues'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Layers size={10} className="text-gray-400" />
                                                            <span className="text-xs">{u.assignedBatches?.join(', ') || 'All Batches'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {u.role === 'admin' && <span className="text-xs text-gray-400">Full Access</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.username !== 'admin' && (
                                                    <button 
                                                        onClick={() => handleDelete(u.id)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
