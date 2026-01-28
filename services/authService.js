import { supabase } from '../config/supabase';

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   * Le profil est créé automatiquement via le trigger handle_new_user()
   */
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            profession: userData.profession,
            location: userData.location,
            age: userData.age,
          },
        },
      });

      if (error) throw error;

      // Le profil est créé automatiquement par le trigger
      // Mais on peut le mettre à jour si nécessaire
      if (data.user) {
        // Attendre un peu pour que le trigger s'exécute
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mettre à jour le profil si des données supplémentaires sont fournies
        if (userData.full_name || userData.profession || userData.location || userData.age) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: userData.full_name || null,
              profession: userData.profession || null,
              location: userData.location || null,
              age: userData.age || null,
            })
            .eq('id', data.user.id);

          if (profileError) throw profileError;
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Connexion d'un utilisateur
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Déconnexion
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Récupérer l'utilisateur actuel
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  /**
   * Récupérer le profil complet de l'utilisateur
   * Combine les données de auth.users et profiles
   */
  async getUserProfile(userId) {
    try {
      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // Si l'utilisateur n'a pas de profil, essayer de le créer
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: userId })
            .select()
            .single();

          if (createError) return { data: null, error: createError };
          
          // Récupérer l'email de l'utilisateur actuel si c'est lui
          const { data: { user } } = await supabase.auth.getUser();
          const userData = {
            ...newProfile,
            email: user?.id === userId ? user?.email : null,
          };
          return { data: userData, error: null };
        }
        throw profileError;
      }

      // Récupérer l'email de l'utilisateur actuel si c'est lui
      const { data: { user } } = await supabase.auth.getUser();
      const userData = {
        ...profile,
        email: user?.id === userId ? user?.email : null,
      };

      return { data: userData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Vérifier si un utilisateur est administrateur
   */
  async isAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { isAdmin: data?.role === 'admin', error: null };
    } catch (error) {
      return { isAdmin: false, error };
    }
  },

  /**
   * Récupérer le rôle d'un utilisateur
   */
  async getUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { role: data?.role || 'user', error: null };
    } catch (error) {
      return { role: null, error };
    }
  },
};
