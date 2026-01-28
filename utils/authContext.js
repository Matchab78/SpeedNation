import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { authService } from '../services/authService';

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

  useEffect(() => {
    // Vérifier l'état de connexion au démarrage
    checkUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
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
      // Charger le profil
      const { data: profileData, error: profileError } = await authService.getUserProfile(userId);
      
      if (!profileError && profileData) {
        setProfile(profileData);
        
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

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signOut,
    refreshUser: () => user && loadUserData(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
