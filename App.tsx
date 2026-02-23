
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { PlayerRegistration } from './components/PlayerRegistration';
import { CoachAttendance } from './components/CoachAttendance';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagement } from './components/UserManagement';
import { MatchManager } from './components/MatchManager';
import { PlayerPortal } from './components/PlayerPortal';
import { Schedule } from './components/Schedule';
import { NoticeBoard } from './components/NoticeBoard';
import { FinanceManager } from './components/FinanceManager';
import { Leaderboard } from './components/Leaderboard';
import { EvaluationManager } from './components/EvaluationManager';
import { PlayerManager } from './components/PlayerManager';
import { Team } from './components/Team'; 
import { TrainingManager } from './components/TrainingManager'; // New Import
import { StorageService } from './services/storageService';
import { AuthService } from './services/authService';
import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('schedule');

  useEffect(() => {
    StorageService.init();
    const savedUser = AuthService.getCurrentUser();
    if (savedUser) {
        handleLoginSuccess(savedUser);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      AuthService.setCurrentUser(user);
      
      // Default tabs based on role
      if (user.role === 'admin') setActiveTab('admin');
      else if (user.role === 'coach') setActiveTab('schedule');
      else if (user.role === 'player') setActiveTab('player-dashboard');
  };

  const handleLogout = () => {
      AuthService.logout();
      setCurrentUser(null);
      setActiveTab('');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'schedule': return <Schedule role={currentUser.role} />;
      case 'notices': return <NoticeBoard role={currentUser.role} />;
      case 'leaderboard': return <Leaderboard role={currentUser.role} />;
      case 'team': return <Team currentUser={currentUser} />;
      case 'coach': return <CoachAttendance />;
      case 'matches': return <MatchManager />;
      case 'evaluations': return <EvaluationManager />;
      case 'training': return <TrainingManager />; // New Route
      case 'admin': return <AdminDashboard />;
      case 'register': return <PlayerRegistration />;
      case 'players': return <PlayerManager />;
      case 'users': return <UserManagement />;
      case 'finance': return <FinanceManager />;
      case 'player-dashboard': return <PlayerPortal user={currentUser} />;
      default: return <div>Tab not found</div>;
    }
  };

  if (!currentUser) {
      return <Login onLogin={handleLoginSuccess} />;
  }

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
    >
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
