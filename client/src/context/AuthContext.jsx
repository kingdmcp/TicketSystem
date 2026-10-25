import React, { createContext, useContext, useState, useEffect } from 'react';

export const PERSONAS = [
  {
    id: 'usr_vishan',
    name: 'Vishan Fernando',
    role: 'itsm_lead',
    title: 'Project Manager & ITSM Lead',
    department: 'IT Service Management',
    email: 'vishan@enterprise.local',
    avatar: 'VF',
    color: 'bg-indigo-600'
  },
  {
    id: 'usr_harindy',
    name: 'Harindy Jayasuriya',
    role: 'itam_lead',
    title: 'ITAM & CMDB Lead',
    department: 'Asset & Configuration Management',
    email: 'harindy@enterprise.local',
    avatar: 'HJ',
    color: 'bg-emerald-600'
  },
  {
    id: 'usr_pabodha',
    name: 'Pabodha Senaratne',
    role: 'discovery_lead',
    title: 'Discovery & Integration Lead',
    department: 'Network Operations & Spatial Discovery',
    email: 'pabodha@enterprise.local',
    avatar: 'PS',
    color: 'bg-cyan-600'
  },
  {
    id: 'usr_malmika',
    name: 'Malmika Wickramasinghe',
    role: 'security_lead',
    title: 'Analytics & Security Lead',
    department: 'Information Security & Compliance',
    email: 'malmika@enterprise.local',
    avatar: 'MW',
    color: 'bg-rose-600'
  },
  {
    id: 'usr_sarah',
    name: 'Sarah Jenkins',
    role: 'hr',
    title: 'HR Talent & Onboarding Specialist',
    department: 'Human Resources',
    email: 'sarah.jenkins@enterprise.local',
    avatar: 'SJ',
    color: 'bg-purple-600'
  },
  {
    id: 'usr_david',
    name: 'David Miller',
    role: 'manager',
    title: 'Engineering Department Manager',
    department: 'Software Engineering',
    email: 'david.miller@enterprise.local',
    avatar: 'DM',
    color: 'bg-amber-600'
  },
  {
    id: 'usr_priya',
    name: 'Priya Sharma',
    role: 'finance',
    title: 'Finance & Accounts Controller',
    department: 'Finance & Accounting',
    email: 'priya.sharma@enterprise.local',
    avatar: 'PS',
    color: 'bg-teal-600'
  },
  {
    id: 'usr_alex',
    name: 'Alex Wong',
    role: 'employee',
    title: 'Senior Backend Engineer (Staff)',
    department: 'Software Engineering',
    email: 'alex.wong@enterprise.local',
    avatar: 'AW',
    color: 'bg-blue-600'
  }
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('itsm_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return PERSONAS[0]; // Default Vishan (ITSM Lead)
  });

  const switchPersona = (personaId) => {
    const target = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];
    setCurrentUser(target);
    localStorage.setItem('itsm_current_user', JSON.stringify(target));
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchPersona, personas: PERSONAS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
