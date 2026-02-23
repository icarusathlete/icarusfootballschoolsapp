
import { Player, AttendanceRecord, AttendanceStatus, User, Match, ScheduleEvent, Announcement, FeeRecord, AcademySettings, PlayerEvaluation, Venue, Batch, Drill } from '../types';

const PLAYERS_KEY = 'icarus_players';
const ATTENDANCE_KEY = 'icarus_attendance';
const USERS_KEY = 'icarus_users';
const MATCHES_KEY = 'icarus_matches';
const SCHEDULE_KEY = 'icarus_schedule';
const NOTICES_KEY = 'icarus_notices';
const FEES_KEY = 'icarus_fees';
const SETTINGS_KEY = 'icarus_settings';
const DRAFTS_KEY = 'icarus_eval_drafts';
const LAST_INVOICE_KEY = 'icarus_last_invoice_id';
const VENUES_KEY = 'icarus_venues';
const BATCHES_KEY = 'icarus_batches';
const DRILLS_KEY = 'icarus_drills';
const POTM_KEY = 'icarus_potm_map'; // Updated Key for clean state

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to notify components of data changes
const notifyDataChange = () => {
  window.dispatchEvent(new Event('icarus_data_update'));
};

const generateSequentialMemberId = (existingPlayers: Player[]): string => {
  if (existingPlayers.length === 0) return 'ICR-0001';
  
  const ids = existingPlayers
    .map(p => {
      const match = p.memberId?.match(/ICR-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(id => !isNaN(id));

  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  const nextId = maxId + 1;
  return `ICR-${nextId.toString().padStart(4, '0')}`;
};

const initializeData = () => {
  // 1. Players
  let players: Player[] = [];
  if (!localStorage.getItem(PLAYERS_KEY)) {
    players = [
      { id: '1', memberId: 'ICR-0001', fullName: 'Leo Messi', dateOfBirth: '2015-06-24', parentName: 'Jorge', contactNumber: '555-0101', photoUrl: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=200&h=200&auto=format&fit=crop', position: 'Forward', registeredAt: new Date().toISOString(), venue: 'Main Ground', batch: 'Elite' },
      { id: '2', memberId: 'ICR-0002', fullName: 'Cristiano Jr.', dateOfBirth: '2015-06-17', parentName: 'Cristiano', contactNumber: '555-0102', photoUrl: 'https://images.unsplash.com/photo-1489985548304-9b81f123c521?q=80&w=200&h=200&auto=format&fit=crop', position: 'Forward', registeredAt: new Date().toISOString(), venue: 'Main Ground', batch: 'Elite' },
      { id: '3', memberId: 'ICR-0003', fullName: 'Kevin De Bruyne Jr', dateOfBirth: '2016-01-01', parentName: 'Kevin', contactNumber: '555-0103', photoUrl: 'https://images.unsplash.com/photo-1518611012118-2960c8bad48d?q=80&w=200&h=200&auto=format&fit=crop', position: 'Midfielder', registeredAt: new Date().toISOString(), venue: 'Turf A', batch: 'Development' },
    ];
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } else {
    players = JSON.parse(localStorage.getItem(PLAYERS_KEY) || '[]');
  }

  // 2. Users (CRITICAL: RESTORED FOR LOGIN)
  if (!localStorage.getItem(USERS_KEY)) {
    const mockUsers: User[] = [
      { id: 'admin1', username: 'admin', password: 'admin', role: 'admin' },
      { id: 'coach1', username: 'coach', password: 'coach', role: 'coach', photoUrl: 'https://ui-avatars.com/api/?name=Coach+David&background=0c4a6e&color=fff&size=256' },
      { id: 'player1', username: 'leo', password: 'leo', role: 'player', linkedPlayerId: '1' } 
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }

  // 3. Settings
  if (!localStorage.getItem(SETTINGS_KEY)) {
    const defaultSettings: AcademySettings = {
        name: 'ICARUS FOOTBALL SCHOOLS',
        logoUrl: '', 
        primaryColor: '#0ea5e9',
        secondaryColor: '#0c4a6e',
        fontFamily: 'Orbitron'
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  }

  // 4. Matches
  if (!localStorage.getItem(MATCHES_KEY)) {
     const mockMatches: Match[] = [
         {
             id: generateId(),
             date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
             opponent: 'Spartans FC',
             result: 'W',
             scoreFor: 3,
             scoreAgainst: 1,
             highlightsUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
             playerStats: [
                 { playerId: '1', goals: 2, assists: 1, rating: 9, minutesPlayed: 60, isStarter: true },
                 { playerId: '2', goals: 1, assists: 0, rating: 8, minutesPlayed: 60, isStarter: true },
                 { playerId: '3', goals: 0, assists: 2, rating: 8, minutesPlayed: 60, isStarter: false }
             ]
         }
     ];
     localStorage.setItem(MATCHES_KEY, JSON.stringify(mockMatches));
  }

  // 5. Attendance
  if (!localStorage.getItem(ATTENDANCE_KEY)) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
  }

  // 6. Schedule
  if (!localStorage.getItem(SCHEDULE_KEY)) {
    const today = new Date().toISOString().split('T')[0];
    const mockSchedule: ScheduleEvent[] = [
      { id: generateId(), title: 'Elite Training Session', date: today, time: '17:00', type: 'training', location: 'Pitch A', rsvps: {}, leadCoachId: 'coach1' },
      { id: generateId(), title: 'Weekend League Match', date: new Date(Date.now() + 172800000).toISOString().split('T')[0], time: '09:00', type: 'match', location: 'Main Stadium', rsvps: {}, leadCoachId: 'coach1' }
    ];
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(mockSchedule));
  }

  // 7. Notices
  if (!localStorage.getItem(NOTICES_KEY)) {
    const mockNotices: Announcement[] = [
      { id: generateId(), title: 'Summer Camp Registration', content: 'Enrollment for the 2025 Summer Intensive is now open.', date: new Date().toISOString(), author: 'Academy Director', priority: 'high' }
    ];
    localStorage.setItem(NOTICES_KEY, JSON.stringify(mockNotices));
  }

  // 8. Fees
  if (!localStorage.getItem(FEES_KEY)) {
    localStorage.setItem(FEES_KEY, JSON.stringify([]));
  }

  // 9. Venues
  if (!localStorage.getItem(VENUES_KEY)) {
      const defaultVenues: Venue[] = [
          { id: generateId(), name: 'Main Ground' },
          { id: generateId(), name: 'Turf A' },
          { id: generateId(), name: 'Indoor Arena' }
      ];
      localStorage.setItem(VENUES_KEY, JSON.stringify(defaultVenues));
  }

  // 10. Batches
  if (!localStorage.getItem(BATCHES_KEY)) {
      const defaultBatches: Batch[] = [
          { id: generateId(), name: 'Elite' },
          { id: generateId(), name: 'Development' },
          { id: generateId(), name: 'Grassroots' },
          { id: generateId(), name: 'Weekend' }
      ];
      localStorage.setItem(BATCHES_KEY, JSON.stringify(defaultBatches));
  }

  // 11. Drills (Initial Library)
  if (!localStorage.getItem(DRILLS_KEY)) {
      const defaultDrills: Drill[] = [
          {
              id: generateId(),
              title: '1v1 High Intensity Duel',
              category: 'Technical',
              difficulty: 'Advanced',
              duration: 15,
              minPlayers: 2,
              description: 'Continuous 1v1 battle in a restricted zone to improve dribbling and defensive reactions.',
              equipment: ['4 Cones', '1 Ball per pair', '2 Mini Goals'],
              instructions: [
                  'Set up a 15x10 yard grid.',
                  'Defender passes to attacker to start.',
                  'Attacker tries to score in mini goal.',
                  'If defender wins ball, they can score.',
                  'Play for 45 seconds then rest.'
              ],
              coachingPoints: [
                  'Attack with speed.',
                  'Use body feints.',
                  'Defender: Low center of gravity.',
                  'Force attacker to weak foot.'
              ],
              imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
      ];
      localStorage.setItem(DRILLS_KEY, JSON.stringify(defaultDrills));
  }
};

export const StorageService = {
  init: initializeData,

  getPlayers: (): Player[] => {
    const data = localStorage.getItem(PLAYERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addPlayer: (player: Omit<Player, 'id' | 'memberId' | 'registeredAt'>): Player => {
    const players = StorageService.getPlayers();
    const newMemberId = generateSequentialMemberId(players);
    const newPlayer: Player = {
      ...player,
      id: generateId(),
      memberId: newMemberId,
      registeredAt: new Date().toISOString(),
    };
    players.push(newPlayer);
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    notifyDataChange();
    return newPlayer;
  },

  deletePlayer: (playerId: string) => {
    const players = StorageService.getPlayers();
    const filtered = players.filter(p => p.id !== playerId);
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(filtered));
    notifyDataChange();
  },

  updatePlayer: (player: Player) => {
    const players = StorageService.getPlayers();
    const index = players.findIndex(p => p.id === player.id);
    if (index >= 0) {
      players[index] = player;
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
      notifyDataChange();
    }
  },

  saveEvaluation: (playerId: string, evaluation: PlayerEvaluation) => {
    const players = StorageService.getPlayers();
    const index = players.findIndex(p => p.id === playerId);
    if (index >= 0) {
      const player = players[index];
      if (!player.evaluationHistory) player.evaluationHistory = [];
      if (player.evaluation) {
          const isSameDay = player.evaluation.evaluationDate === evaluation.evaluationDate;
          if (!isSameDay) {
              player.evaluationHistory.push(player.evaluation);
              player.evaluationHistory.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
          }
      }
      player.evaluation = evaluation;
      players[index] = player;
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
      StorageService.clearDraft(playerId);
      notifyDataChange();
    }
  },

  // --- Draft Management ---
  getDrafts: (): Record<string, PlayerEvaluation> => {
      const data = localStorage.getItem(DRAFTS_KEY);
      return data ? JSON.parse(data) : {};
  },

  saveDraft: (playerId: string, evaluation: PlayerEvaluation) => {
      const drafts = StorageService.getDrafts();
      drafts[playerId] = evaluation;
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  },

  getDraft: (playerId: string): PlayerEvaluation | null => {
      const drafts = StorageService.getDrafts();
      return drafts[playerId] || null;
  },

  clearDraft: (playerId: string) => {
      const drafts = StorageService.getDrafts();
      if (drafts[playerId]) {
          delete drafts[playerId];
          localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      }
  },

  // --- POTM Management (Monthly Keyed Map) ---
  setPOTM: (playerId: string, month: string) => {
      // 1. Get existing map
      const storageRaw = localStorage.getItem(POTM_KEY);
      let storage = {};
      try {
          storage = storageRaw ? JSON.parse(storageRaw) : {};
      } catch (e) { storage = {}; }

      // 2. Set new winner for this month with current timestamp
      storage[month] = { 
          playerId, 
          timestamp: Date.now() 
      };

      // 3. Save back
      localStorage.setItem(POTM_KEY, JSON.stringify(storage));
      notifyDataChange();
  },

  getPOTM: (month: string): { playerId: string, timestamp: number } | null => {
      const storageRaw = localStorage.getItem(POTM_KEY);
      if (!storageRaw) return null;
      try {
          const storage = JSON.parse(storageRaw);
          return storage[month] || null;
      } catch (e) {
          return null;
      }
  },

  // --- Invoice Management ---
  getNextInvoiceId: (): string => {
      const last = localStorage.getItem(LAST_INVOICE_KEY) || 'INV-000';
      const match = last.match(/INV-(\d+)/);
      if (match) {
          const num = parseInt(match[1], 10) + 1;
          return `INV-${num.toString().padStart(3, '0')}`;
      }
      return 'INV-001';
  },

  saveLastInvoiceId: (id: string) => {
      localStorage.setItem(LAST_INVOICE_KEY, id);
  },

  // --- VENUE & BATCH MANAGEMENT ---
  getVenues: (): Venue[] => JSON.parse(localStorage.getItem(VENUES_KEY) || '[]'),
  
  addVenue: (name: string) => {
      const venues = StorageService.getVenues();
      venues.push({ id: generateId(), name });
      localStorage.setItem(VENUES_KEY, JSON.stringify(venues));
      notifyDataChange();
  },

  updateVenue: (id: string, name: string) => {
      const venues = StorageService.getVenues();
      const idx = venues.findIndex(v => v.id === id);
      if (idx >= 0) {
          venues[idx].name = name;
          localStorage.setItem(VENUES_KEY, JSON.stringify(venues));
          notifyDataChange();
      }
  },

  deleteVenue: (id: string) => {
      const venues = StorageService.getVenues().filter(v => v.id !== id);
      localStorage.setItem(VENUES_KEY, JSON.stringify(venues));
      notifyDataChange();
  },

  getBatches: (): Batch[] => JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]'),

  addBatch: (name: string) => {
      const batches = StorageService.getBatches();
      batches.push({ id: generateId(), name });
      localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
      notifyDataChange();
  },

  updateBatch: (id: string, name: string) => {
      const batches = StorageService.getBatches();
      const idx = batches.findIndex(b => b.id === id);
      if (idx >= 0) {
          batches[idx].name = name;
          localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
          notifyDataChange();
      }
  },

  deleteBatch: (id: string) => {
      const batches = StorageService.getBatches().filter(b => b.id !== id);
      localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
      notifyDataChange();
  },

  // --- DRILL MANAGEMENT ---
  getDrills: (): Drill[] => JSON.parse(localStorage.getItem(DRILLS_KEY) || '[]'),

  addDrill: (drill: Omit<Drill, 'id'>) => {
      const drills = StorageService.getDrills();
      drills.push({ ...drill, id: generateId() });
      localStorage.setItem(DRILLS_KEY, JSON.stringify(drills));
      notifyDataChange();
  },

  deleteDrill: (id: string) => {
      const drills = StorageService.getDrills().filter(d => d.id !== id);
      localStorage.setItem(DRILLS_KEY, JSON.stringify(drills));
      notifyDataChange();
  },

  getAttendance: (): AttendanceRecord[] => JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]'),
  
  getDailyAttendance: (date: string) => StorageService.getAttendance().filter(r => r.date === date),
  
  saveAttendanceBatch: (records: AttendanceRecord[]) => {
    const all = StorageService.getAttendance();
    const filtered = all.filter(e => !records.some(r => r.playerId === e.playerId && r.date === e.date));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([...filtered, ...records]));
    notifyDataChange();
  },
  
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  
  addUser: (u: Omit<User, 'id'>) => {
    const users = StorageService.getUsers();
    const newUser = {...u, id: generateId()};
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    notifyDataChange();
    return newUser;
  },
  
  deleteUser: (id: string) => {
      localStorage.setItem(USERS_KEY, JSON.stringify(StorageService.getUsers().filter(u => u.id !== id)));
      notifyDataChange();
  },

  updateUser: (updatedUser: User) => {
      const users = StorageService.getUsers();
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index >= 0) {
          users[index] = updatedUser;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          notifyDataChange();
      }
  },
  
  getMatches: (): Match[] => JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]'),
  
  addMatch: (m: Omit<Match, 'id'>) => {
    const matches = StorageService.getMatches();
    const newMatch = {...m, id: generateId()};
    matches.push(newMatch);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    notifyDataChange();
    return newMatch;
  },
  
  getSchedule: (): ScheduleEvent[] => JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]'),
  
  addEvent: (e: Omit<ScheduleEvent, 'id'>) => {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify([...StorageService.getSchedule(), {...e, id: generateId()}]));
      notifyDataChange();
  },
  
  updateEvent: (updatedEvent: ScheduleEvent) => {
    const events = StorageService.getSchedule();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    if (index >= 0) {
        events[index] = updatedEvent;
        localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events));
        notifyDataChange();
    }
  },

  deleteEvent: (id: string) => {
      const events = StorageService.getSchedule();
      const filtered = events.filter(e => e.id !== id);
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(filtered));
      notifyDataChange();
  },
  
  toggleRSVP: (eventId: string, playerId: string, status: 'attending' | 'declined') => {
      const schedule = StorageService.getSchedule();
      const eventIndex = schedule.findIndex(e => e.id === eventId);
      if (eventIndex >= 0) {
          const event = schedule[eventIndex];
          if (!event.rsvps) event.rsvps = {};
          if (event.rsvps[playerId] === status) {
              delete event.rsvps[playerId];
          } else {
              event.rsvps[playerId] = status;
          }
          schedule[eventIndex] = event;
          localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
          notifyDataChange();
          return schedule[eventIndex];
      }
      return null;
  },

  getNotices: (): Announcement[] => JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]'),
  
  addNotice: (n: Omit<Announcement, 'id' | 'date'>) => {
      localStorage.setItem(NOTICES_KEY, JSON.stringify([{...n, id: generateId(), date: new Date().toISOString()}, ...StorageService.getNotices()]));
      notifyDataChange();
  },
  
  getFees: (): FeeRecord[] => JSON.parse(localStorage.getItem(FEES_KEY) || '[]'),
  
  updateFee: (f: FeeRecord) => {
    const fees = StorageService.getFees();
    const idx = fees.findIndex(x => x.id === f.id || (x.playerId === f.playerId && x.month === f.month));
    if(idx >= 0) fees[idx] = {...fees[idx], ...f}; else fees.push(f);
    localStorage.setItem(FEES_KEY, JSON.stringify(fees));
    notifyDataChange();
  },
  
  getSettings: (): AcademySettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      name: 'ICARUS FOOTBALL SCHOOLS',
      logoUrl: '',
      primaryColor: '#0ea5e9',
      secondaryColor: '#0c4a6e',
      fontFamily: 'Orbitron'
    };
  },
  
  saveSettings: (s: AcademySettings) => { 
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); 
    window.dispatchEvent(new Event('settingsChanged')); 
  },
  
  exportData: () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('icarus_')) {
            try {
                data[key] = JSON.parse(localStorage.getItem(key) || 'null');
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
    }
    return JSON.stringify(data, null, 2);
  },
  
  triggerBackupDownload: () => {
    const dataStr = StorageService.exportData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `icarus_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  analyzeBackup: (jsonStr: string) => {
      try {
          const data = JSON.parse(jsonStr);
          const stats: any = { valid: false, details: {} };
          
          if (data[PLAYERS_KEY]) stats.details.players = data[PLAYERS_KEY].length;
          if (data[MATCHES_KEY]) stats.details.matches = data[MATCHES_KEY].length;
          
          if (Object.keys(data).some(k => k.startsWith('icarus_'))) {
              stats.valid = true;
          }
          return stats;
      } catch (e) {
          return { valid: false, error: 'Invalid JSON format' };
      }
  },

  restoreBackup: (jsonStr: string) => { 
    try { 
      const data = JSON.parse(jsonStr); 
      if (!data.icarus_players && !data.icarus_settings) return false;

      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('icarus_')) {
              localStorage.removeItem(key);
          }
      });

      Object.keys(data).forEach(k => {
          if (k.startsWith('icarus_')) {
              const val = typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k];
              localStorage.setItem(k, val);
          }
      });

      window.dispatchEvent(new Event('settingsChanged')); 
      notifyDataChange();
      return true; 
    } catch(e) {
      console.error("Restore failed:", e);
      return false;
    } 
  },
  
  clearData: () => { 
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('icarus_')) {
            localStorage.removeItem(key);
        }
    });
    initializeData(); 
    window.dispatchEvent(new Event('settingsChanged')); 
    notifyDataChange();
  }
};
