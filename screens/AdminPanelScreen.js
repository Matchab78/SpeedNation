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
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adminService } from "../services/adminService";
import { useAuth } from "../utils/authContext";

export default function AdminPanelScreen({ navigation }) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'users', 'events'
  const [stats, setStats] = useState({ users: 0, events: 0, cars: 0 });
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

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

    const confirm = window.confirm ? window.confirm(`Supprimer DÉFINITIVEMENT le compte ${userItem.email} ?`) : true;
    if (!confirm) return;

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
  };

  const renderStats = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="people" size={24} color="#3b82f6" />
          <Text style={styles.cardValue}>{stats.users}</Text>
          <Text style={styles.cardLabel}>Utilisateurs</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="calendar" size={24} color="#10b981" />
          <Text style={styles.cardValue}>{stats.events}</Text>
          <Text style={styles.cardLabel}>Événements</Text>
        </View>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Ionicons name="car" size={24} color="#f59e0b" />
          <Text style={styles.cardValue}>{stats.cars}</Text>
          <Text style={styles.cardLabel}>Voitures</Text>
        </View>
        <View style={styles.cardPlaceholder} />
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

  return (
    <View style={styles.container}>
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
        <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>
      ) : (
        <View style={styles.mainContent}>
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'events' && (
              <View style={styles.center}><Text style={{color: '#777'}}>Gestion des événements à venir</Text></View>
          )}
        </View>
      )}
      {actionLoading && (
        <View style={styles.actionOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  backButton: { padding: 8, marginRight: 10 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", flex: 1 },
  refreshBtn: { padding: 8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#8916CB' },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  mainContent: { flex: 1 },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardRow: { flexDirection: "row", gap: 15, marginBottom: 15 },
  card: { flex: 1, backgroundColor: "#111", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#222", alignItems: 'center' },
  cardValue: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 8 },
  cardLabel: { color: "#666", fontSize: 13, marginTop: 4 },
  listContent: { padding: 20 },
  listItem: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemSub: { color: '#666', fontSize: 12 },
  tagRow: { flexDirection: 'row', marginTop: 6 },
  tag: { fontSize: 10, color: '#999', backgroundColor: '#222', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  tagAdmin: { color: '#fff', backgroundColor: '#8916CB' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  promoteBtn: { borderColor: '#8916CB', backgroundColor: 'rgba(137, 22, 203, 0.1)' },
  demoteBtn: { borderColor: '#444', backgroundColor: '#222' },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  actionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});
