import React from 'react';
import ModelsAndEndpointsPage from './pages/ModelsAndEndpointsPage';
import CanvasAndControlPage from './pages/CanvasAndControlPage';
import UserAndRoleManagementPage from './pages/UserAndRoleManagementPage';
import type { AiModelConfig } from '../hooks/useAiModels';

export interface SettingsPageProps {
  initialTab?: 'profile' | 'ai' | 'canvas' | 'users';
  currentUser?: any;
  onNavigateHome?: () => void;
  onTabChange?: (tab: 'profile' | 'ai' | 'canvas' | 'users') => void;
  // AI Models
  aiModels: AiModelConfig[];
  setAiModels: React.Dispatch<React.SetStateAction<AiModelConfig[]>>;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  // Canvas Settings
  historyLimit: number;
  setHistoryLimit: (limit: number) => void;
  pastCount: number;
  futureCount: number;
  undo: () => void;
  redo: () => void;
  onClearHistory?: () => void;
}

export default function SettingsPage({
  initialTab = 'ai',
  currentUser,
  onNavigateHome,
  aiModels,
  setAiModels,
  showAlert,
  historyLimit,
  setHistoryLimit,
  pastCount,
  futureCount,
  undo,
  redo,
  onClearHistory,
}: SettingsPageProps) {
  if (initialTab === 'canvas') {
    return (
      <CanvasAndControlPage
        currentUser={currentUser}
        onNavigateHome={onNavigateHome}
        historyLimit={historyLimit}
        setHistoryLimit={setHistoryLimit}
        pastCount={pastCount}
        futureCount={futureCount}
        undo={undo}
        redo={redo}
        onClearHistory={onClearHistory}
      />
    );
  }

  if (initialTab === 'users') {
    return (
      <UserAndRoleManagementPage
        currentUser={currentUser}
        onNavigateHome={onNavigateHome}
        showAlert={showAlert}
      />
    );
  }

  // Default to Models and Endpoints
  return (
    <ModelsAndEndpointsPage
      currentUser={currentUser}
      onNavigateHome={onNavigateHome}
      aiModels={aiModels}
      setAiModels={setAiModels}
      showAlert={showAlert}
    />
  );
}
