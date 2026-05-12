import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { messagingService } from '../services/messagingService';
import { profilesApi } from '../services/apiService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Vérifier l'état de connexion au démarrage
    checkUser();

    // Écouter les changements d'authentification personnalisés
    const handleAuthChange = () => {
      checkUser();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-status-changed', handleAuthChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-status-changed', handleAuthChange);
      }
    };
  }, []);

  const checkUser = async () => {
    try {
      const { user: currentUser, error } = await authService.getCurrentUser();
      
      if (error || !currentUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      await loadUserData(currentUser.id);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      // Signaler l'activité
      profilesApi.heartbeat(userId);

      // Charger le profil
      const { data: profileData, error: profileError } = await authService.getUserProfile(userId);
      
      if (!profileError && profileData?.data?.profile) {
        setProfile(profileData.data.profile);
        
        // Vérifier si admin
        const { isAdmin: adminStatus } = await authService.isAdmin(userId);
        setIsAdmin(adminStatus);
      }

      // Charger les données utilisateur
      const { user: currentUser } = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await authService.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const { data } = await messagingService.getUserConversations(user.id);
        if (data) {
          const total = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setUnreadCount(total);
        }
      } catch (e) {
        console.warn('AuthContext unread fetch error:', e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // Toutes les 10 secondes
    return () => clearInterval(interval);
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    unreadCount,
    setUnreadCount,
    signOut,
    refreshUser: () => user && loadUserData(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
