
import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { StorageService } from '../services/storageService';
import { Player, AttendanceRecord, AttendanceStatus, AcademySettings } from '../types';
import { getAllPlayers } from '../services/userService';
import { FileText, Loader2, TrendingUp, Download, Upload, Trash2, Database, Palette, Type, Image as ImageIcon, CheckCircle, AlertTriangle, FileJson, X, Settings, ChevronRight, Users, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Settings State
    const [settings, setSettings] = useState<AcademySettings>(StorageService.getSettings());
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);


    // Import/Export Logic
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [importModal, setImportModal] = useState<{ isOpen: boolean, stats: any | null, error: string | null }>({
        isOpen: false, stats: null, error: null
    });
    const [importedContent, setImportedContent] = useState<string>('');

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch from Firestore
            const result = await getAllPlayers();
            if (result.success) {
                setPlayers(result.players);
            }

            // Fallback to local storage for attendance for now (until service updated)
            const a = StorageService.getAttendance();
            setAttendance(a || []);
            prepareChartData(a || []);
            setSettings(StorageService.getSettings());
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Re-load if data changes externally
        window.addEventListener('icarus_data_update', loadData);
        return () => window.removeEventListener('icarus_data_update', loadData);
    }, []);

    const prepareChartData = (records: AttendanceRecord[]) => {
        // Group by date
        const groups: Record<string, { present: number, absent: number, late: number }> = {};

        // Sort records by date first
        const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted.forEach(r => {
            if (!groups[r.date]) groups[r.date] = { present: 0, absent: 0, late: 0 };
            if (r.status === AttendanceStatus.PRESENT) groups[r.date].present++;
            if (r.status === AttendanceStatus.ABSENT) groups[r.date].absent++;
            if (r.status === AttendanceStatus.LATE) groups[r.date].late++;
        });

        const data = Object.keys(groups).map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            Present: groups[date].present,
            Absent: groups[date].absent,
            Late: groups[date].late
        })).slice(-10); // Last 10 days

        setChartData(data);
    };


    // Data Management Functions
    const handleExport = () => {
        StorageService.triggerBackupDownload();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target?.result as string;
            setImportedContent(json);

            // Analyze content before importing
            const stats = StorageService.analyzeBackup(json);
            if (stats.valid) {
                setImportModal({ isOpen: true, stats: stats.details, error: null });
            } else {
                setImportModal({ isOpen: true, stats: null, error: 'Invalid backup file. Missing Icarus data keys.' });
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const confirmImport = () => {
        if (StorageService.restoreBackup(importedContent)) {
            setImportModal({ ...importModal, isOpen: false });
            // Force reload to ensure all states in all components are clean
            window.location.reload();
        } else {
            setImportModal({ ...importModal, error: "Failed to write data to storage. File format might be corrupted." });
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                updateSetting('logoUrl', base64);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleClear = () => {
        if (window.confirm("WARNING: This will delete ALL players, matches, and attendance records. The app will reset to default demo data. Are you sure?")) {
            StorageService.clearData();
            // Give time for local storage to clear before reload
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };

    const saveSettings = () => {
        StorageService.saveSettings(settings);
        setHasUnsavedSettings(false);
        setShowSettingsModal(false);
    };

    const updateSetting = (key: keyof AcademySettings, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasUnsavedSettings(true);
    };

    // Stats
    const totalSessions = new Set(attendance.map(a => a.date)).size;
    const overallPresence = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const avgAttendance = totalSessions > 0
        ? Math.round((overallPresence / (totalSessions * (players.length || 1))) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-icarus-500 animate-spin" />
                <span className="ml-3 font-bold text-gray-500">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 relative animate-in fade-in duration-500">

            {/* Header with Settings Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Orbitron' }}>
                        ADMIN <span className="text-icarus-500">DASHBOARD</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Overview of academy performance and operations.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all hover:border-icarus-500 group"
                    >
                        <Palette size={18} className="text-gray-400 group-hover:text-icarus-500 transition-colors" />
                        <span className="text-xs uppercase tracking-wider">Academy Branding</span>
                    </button>
                </div>
            </div>

            {/* Professional KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Squad</span>
                        </div>
                        <h3 className="text-4xl font-black text-gray-900">{players.length}</h3>
                        <div className="flex items-center gap-1 mt-2 text-xs font-bold text-green-500">
                            <TrendingUp size={12} />
                            <span>Active</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-green-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} className="text-green-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <Activity size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Attendance</span>
                        </div>
                        <h3 className="text-4xl font-black text-gray-900">{avgAttendance}%</h3>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${avgAttendance}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-purple-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={64} className="text-purple-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <FileText size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessions Logged</span>
                        </div>
                        <h3 className="text-4xl font-black text-gray-900">{totalSessions}</h3>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Last 30 Days</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Attendance Analytics</h3>
                        <p className="text-xs text-gray-400 font-medium mt-1">Session participation trends over time</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div> Present
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div> Absent
                        </div>
                    </div>
                </div>

                <div className="h-80 w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="Present" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                                <Area type="monotone" dataKey="Absent" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAbsent)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                            <TrendingUp size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No data to display yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Management Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
                    <Database className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-800">Database Operations</h3>
                </div>
                <div className="p-8">
                    <div className="flex flex-wrap gap-4 items-center">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl border border-gray-200 transition-colors font-bold text-xs uppercase tracking-wider"
                        >
                            <Download size={16} />
                            <span>Backup JSON</span>
                        </button>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-6 py-3.5 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl border border-gray-200 transition-colors font-bold text-xs uppercase tracking-wider"
                            >
                                <Upload size={16} />
                                <span>Restore</span>
                            </button>
                        </div>

                        <div className="flex-1 border-t border-gray-100 mx-4 h-px"></div>

                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl border border-red-100 transition-colors font-bold text-xs uppercase tracking-wider"
                        >
                            <Trash2 size={16} />
                            <span>Factory Reset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* BRANDING SETTINGS MODAL */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <Palette size={20} className="text-icarus-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">Academy Branding</h3>
                                    <p className="text-xs text-gray-500 font-medium">Customize look and feel</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            {/* Name & Font */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Academy Name</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-icarus-500 focus:ring-4 focus:ring-icarus-500/10 outline-none transition-all"
                                            value={settings.name}
                                            onChange={(e) => updateSetting('name', e.target.value)}
                                            placeholder="Academy Name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Font Family</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:border-icarus-500 outline-none transition-all appearance-none"
                                        value={settings.fontFamily}
                                        onChange={(e) => updateSetting('fontFamily', e.target.value)}
                                    >
                                        <option value="Orbitron">Orbitron (Modern/Sci-Fi)</option>
                                        <option value="Inter">Inter (Clean/Standard)</option>
                                        <option value="Montserrat">Montserrat (Geometric)</option>
                                        <option value="Oswald">Oswald (Bold/Condensed)</option>
                                        <option value="Roboto">Roboto (Classic)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Logo */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Academy Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium text-gray-600 focus:bg-white focus:border-icarus-500 outline-none transition-all"
                                            value={settings.logoUrl}
                                            onChange={(e) => updateSetting('logoUrl', e.target.value)}
                                            placeholder="Image URL..."
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">OR</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={logoInputRef}
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => logoInputRef.current?.click()}
                                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <Upload size={14} /> Upload File
                                    </button>
                                </div>
                                {settings.logoUrl && (
                                    <div className="mt-2 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl inline-block">
                                        <img src={settings.logoUrl} className="h-12 object-contain" alt="Preview" />
                                    </div>
                                )}
                            </div>

                            {/* Colors */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Theme Gradient</label>
                                <div className="p-4 rounded-2xl border-2 border-gray-100 flex flex-col gap-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Start Color</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={settings.primaryColor}
                                                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                />
                                                <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">{settings.primaryColor}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">End Color</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={settings.secondaryColor}
                                                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                                                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                />
                                                <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">{settings.secondaryColor}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Preview Banner */}
                                    <div className="h-16 rounded-xl flex items-center px-6 text-white shadow-lg" style={{ background: `linear-gradient(90deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
                                        <div>
                                            <h4 className="font-bold text-lg leading-none" style={{ fontFamily: settings.fontFamily }}>{settings.name || 'ACADEMY NAME'}</h4>
                                            <p className="text-[10px] opacity-80 font-medium tracking-widest uppercase mt-1">Portal Preview</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSettings}
                                disabled={!hasUnsavedSettings}
                                className="px-8 py-3 bg-icarus-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {hasUnsavedSettings ? <CheckCircle size={16} /> : null}
                                {hasUnsavedSettings ? 'Save Changes' : 'Saved'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESTORE PREVIEW MODAL */}
            {importModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Upload size={20} className="text-icarus-600" />
                                Restore Data
                            </h3>
                            <button onClick={() => setImportModal({ ...importModal, isOpen: false })} className="p-1 hover:bg-gray-200 rounded-full text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {importModal.error ? (
                                <div className="text-center py-4">
                                    <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle size={32} />
                                    </div>
                                    <h4 className="text-red-700 font-bold mb-2">Invalid File</h4>
                                    <p className="text-sm text-gray-600">{importModal.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <FileJson className="text-blue-500" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-bold">Backup File Detected</p>
                                            <p className="text-xs opacity-80">Ready to restore the following data:</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="block text-xs text-gray-400 font-bold uppercase">Players</span>
                                            <span className="block text-xl font-black text-gray-800">{importModal.stats?.players || 0}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="block text-xs text-gray-400 font-bold uppercase">Matches</span>
                                            <span className="block text-xl font-black text-gray-800">{importModal.stats?.matches || 0}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="block text-xs text-gray-400 font-bold uppercase">Attendance</span>
                                            <span className="block text-xl font-black text-gray-800">{importModal.stats?.attendance || 0}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="block text-xs text-gray-400 font-bold uppercase">Events</span>
                                            <span className="block text-xl font-black text-gray-800">{importModal.stats?.events || 0}</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
                                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                        <p>Warning: Restoring this backup will <strong>permanently replace</strong> all current data on this device. This action cannot be undone.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
                            <button
                                onClick={() => setImportModal({ ...importModal, isOpen: false })}
                                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            {!importModal.error && (
                                <button
                                    onClick={confirmImport}
                                    className="px-6 py-2 bg-icarus-900 text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all text-sm flex items-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Confirm Restore
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
