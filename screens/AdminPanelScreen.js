import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Alert,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adminService } from "../services/adminService";
import { eventService } from "../services/eventService";
import { useAuth } from "../utils/authContext";
import { getImageUrl } from "../services/apiService";

const COLORS = {
  background: "#0B0813",
  surface: "#16121F",
  surfaceElevated: "#1E1A2B",
  border: "rgba(80, 70, 110, 0.4)",
  foreground: "#FAFAFA",
  mutedForeground: "#9B95AE",
  primary: "#8916CB",
  primaryGlow: "#A855F7",
};

export default function AdminPanelScreen({ navigation }) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({ users: 0, events: 0, cars: 0 });
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, eventsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getAllEvents()
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
    } catch (e) {
      console.error("loadData error", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userItem) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const isCurrentlyAdmin = userItem.role === 'admin';
      const { error } = isCurrentlyAdmin 
        ? await adminService.demoteFromAdmin(userItem.id)
        : await adminService.promoteToAdmin(userItem.id);

      if (error) {
        Alert.alert("Erreur", "Impossible de changer le rôle : " + (error.message || "Erreur serveur"));
      } else {
        setUsers(users.map(u => 
          u.id === userItem.id ? { ...u, role: isCurrentlyAdmin ? 'user' : 'admin' } : u
        ));
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Une erreur est survenue lors du changement de rôle.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userItem) => {
    if (userItem.id === currentUser?.id) {
      Alert.alert("Action impossible", "Vous ne pouvez pas supprimer votre propre compte admin.");
      return;
    }
    Alert.alert(
      "Confirmer la suppression",
      `Supprimer DÉFINITIVEMENT le compte ${userItem.email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          setActionLoading(true);
          try {
            const { error } = await adminService.deleteUser(userItem.id);
            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'utilisateur.");
            } else {
              setUsers(users.filter(u => u.id !== userItem.id));
              setStats(prev => ({ ...prev, users: prev.users - 1 }));
            }
          } catch (e) {
            console.error(e);
          } finally {
            setActionLoading(false);
          }
        }},
      ]
    );
  };

  const handleResetPassword = async (userItem) => {
    const tempPass = typeof window !== 'undefined' && window.prompt 
      ? window.prompt(`Saisir un mot de passe temporaire pour ${userItem.email} :`, "Vitesse2024!")
      : null;
    if (!tempPass || tempPass.length < 6) {
      if (tempPass) Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setActionLoading(true);
    try {
      const { authService } = require("../services/authService");
      const { success, error } = await authService.adminResetPassword(userItem.id, tempPass);
      if (success) {
        Alert.alert("Succès", `Le mot de passe de ${userItem.full_name || userItem.email} a été réinitialisé.`);
      } else {
        Alert.alert("Erreur", error?.message || "Échec de la réinitialisation");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeature = async (event) => {
    setActionLoading(true);
    try {
      const { error } = event.is_featured
        ? await eventService.clearFeaturedEvent(event.id)
        : await eventService.setFeaturedEvent(event.id);
      
      if (error) {
        Alert.alert("Erreur", error.message || "Impossible de modifier la mise en avant");
      } else {
        const { data } = await adminService.getAllEvents();
        if (data) setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
    setShowDeleteEventModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setShowDeleteEventModal(false);
    setActionLoading(true);
    try {
      const { error } = await eventService.deleteEvent(eventToDelete.id, currentUser.id);
      if (error) {
        Alert.alert("Erreur", error.message || "Impossible de supprimer l'événement");
      } else {
        setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
        setStats(prev => ({ ...prev, events: prev.events - 1 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
      setEventToDelete(null);
    }
  };

  const renderStats = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.cardRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={28} color="#3b82f6" />
          <Text style={styles.cardValue}>{stats.users}</Text>
          <Text style={styles.cardLabel}>Utilisateurs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={28} color="#10b981" />
          <Text style={styles.cardValue}>{stats.events}</Text>
          <Text style={styles.cardLabel}>Événements</Text>
        </View>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.statCard}>
          <Ionicons name="car" size={28} color={COLORS.primary} />
          <Text style={styles.cardValue}>{stats.cars}</Text>
          <Text style={styles.cardLabel}>Voitures</Text>
        </View>
        <View style={[styles.statCard, { opacity: 0 }]} />
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.full_name || 'Utilisateur sans nom'}</Text>
            <Text style={styles.itemSub}>{item.email}</Text>
            <View style={styles.tagRow}>
              <Text style={[styles.tag, item.role === 'admin' && styles.tagAdmin]}>
                {item.role === 'admin' ? 'Admin' : 'Membre'}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => handleResetPassword(item)}
              disabled={actionLoading}
            >
              <Ionicons name="key-outline" size={18} color="#f59e0b" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, item.role === 'admin' ? styles.demoteBtn : styles.promoteBtn]} 
              onPress={() => toggleAdminRole(item)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>
                {item.role === 'admin' ? "Rétrograder" : "Faire Admin"}
              </Text>
            </TouchableOpacity>
            
            {item.id !== currentUser?.id && (
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDeleteUser(item)}
                disabled={actionLoading}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );

  const renderEvents = () => (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: COLORS.mutedForeground, marginTop: 40 }}>Aucun événement trouvé</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.eventItem}>
          {item.image_url ? (
            <Image
              source={{ uri: getImageUrl(item.image_url) }}
              style={styles.eventThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.eventThumb, { backgroundColor: COLORS.surfaceElevated, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.mutedForeground} />
            </View>
          )}

          <View style={styles.eventInfo}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
              {item.is_featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>★ Mis en avant</Text>
                </View>
              )}
            </View>
            <Text style={styles.eventSub}>{item.event_date} • {item.location}</Text>
            <Text style={[styles.eventSub, { marginTop: 2 }]}>
              Créé par : {item.creator_name || '—'}
            </Text>
            <View style={styles.eventActions}>
              <TouchableOpacity
                style={[styles.eventActionBtn, item.is_featured ? styles.unfeaturedBtn : styles.featuredBtn]}
                onPress={() => handleToggleFeature(item)}
                disabled={actionLoading}
              >
                <Text style={styles.eventActionBtnText}>
                  {item.is_featured ? '✕ Enlever' : '⭐ Mettre en avant'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.eventDeleteBtn}
                onPress={() => handleDeleteEvent(item)}
                disabled={actionLoading}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      {/* Modal suppression événement */}
      <Modal visible={showDeleteEventModal} transparent animationType="fade" onRequestClose={() => setShowDeleteEventModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDeleteEventModal(false)} />
          <View style={styles.deleteModalBox}>
            <Text style={styles.deleteModalTitle}>Supprimer l'événement</Text>
            <Text style={styles.deleteModalText}>
              Supprimer "{eventToDelete?.title}" ?{"\n"}Cette action est définitive.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity style={styles.deleteModalCancel} onPress={() => setShowDeleteEventModal(false)}>
                <Text style={styles.deleteModalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirm} onPress={confirmDeleteEvent}>
                <Text style={styles.deleteModalConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Administration</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['stats', 'users', 'events'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'stats' ? 'Rapports' : tab === 'users' ? 'Membres' : 'Événements'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <View style={styles.mainContent}>
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'events' && renderEvents()}
        </View>
      )}
      {actionLoading && (
        <View style={styles.actionOverlay}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  backButton: { padding: 8, marginRight: 10 },
  title: { color: COLORS.foreground, fontSize: 22, fontWeight: "700", flex: 1 },
  refreshBtn: { padding: 8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.mutedForeground, fontWeight: '600', fontSize: 13 },
  activeTabText: { color: COLORS.foreground },
  mainContent: { flex: 1 },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardRow: { flexDirection: "row", gap: 15, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cardValue: { color: COLORS.foreground, fontSize: 30, fontWeight: "800", marginTop: 10 },
  cardLabel: { color: COLORS.mutedForeground, fontSize: 13, marginTop: 4 },
  listContent: { padding: 16 },
  listItem: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  itemInfo: { flex: 1 },
  itemName: { color: COLORS.foreground, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemSub: { color: COLORS.mutedForeground, fontSize: 12 },
  tagRow: { flexDirection: 'row', marginTop: 6 },
  tag: { fontSize: 10, color: COLORS.mutedForeground, backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  tagAdmin: { color: '#fff', backgroundColor: COLORS.primary },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  promoteBtn: { borderColor: COLORS.primary, backgroundColor: 'rgba(137, 22, 203, 0.1)' },
  demoteBtn: { borderColor: COLORS.border, backgroundColor: COLORS.surfaceElevated },
  actionBtnText: { color: COLORS.foreground, fontSize: 11, fontWeight: '600' },
  resetBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  actionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  /* Events tab */
  eventItem: { backgroundColor: COLORS.surface, borderRadius: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  eventThumb: { width: 85, height: 85 },
  eventInfo: { flex: 1, padding: 12 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  eventTitle: { color: COLORS.foreground, fontSize: 15, fontWeight: '700', flex: 1 },
  featuredBadge: { backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 1, borderColor: COLORS.primaryGlow, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  featuredBadgeText: { color: COLORS.primaryGlow, fontSize: 9, fontWeight: '700' },
  eventSub: { color: COLORS.mutedForeground, fontSize: 12 },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  eventActionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  featuredBtn: { borderColor: COLORS.primary, backgroundColor: 'rgba(137,22,203,0.1)' },
  unfeaturedBtn: { borderColor: COLORS.border, backgroundColor: COLORS.surfaceElevated },
  eventActionBtnText: { color: COLORS.foreground, fontSize: 11, fontWeight: '600' },
  eventDeleteBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)' },

  /* Delete modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  deleteModalBox: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, marginHorizontal: 30, borderWidth: 1, borderColor: COLORS.border, width: '90%', maxWidth: 400 },
  deleteModalTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  deleteModalText: { color: COLORS.mutedForeground, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  deleteModalActions: { flexDirection: 'row', gap: 12 },
  deleteModalCancel: { flex: 1, paddingVertical: 13, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  deleteModalCancelText: { color: COLORS.mutedForeground, fontWeight: '700', fontSize: 14 },
  deleteModalConfirm: { flex: 1, paddingVertical: 13, borderRadius: 999, backgroundColor: '#991b1b', alignItems: 'center' },
  deleteModalConfirmText: { color: '#fecaca', fontWeight: '700', fontSize: 14 },
});
