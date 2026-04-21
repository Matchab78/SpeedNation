import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adminService } from "../services/adminService";
import { useAuth } from "../utils/authContext";

export default function AdminPanelScreen({ navigation }) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'users', 'events'
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    cars: 0,
  });
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);

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

  const handleToggleFeature = async (eventId, currentStatus) => {
    try {
      const { error } = await adminService.toggleEventFeature(eventId, !currentStatus);
      if (error) {
        Alert.alert("Erreur", "Impossible de modifier le statut de l'événement");
      } else {
        // Mettre à jour la liste locale
        setEvents(events.map(ev => 
          ev.id === eventId ? { ...ev, is_featured: !currentStatus } : ev
        ));
      }
    } catch (e) {
      console.error(e);
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
      
      <Text style={styles.soonText}>
        Sélectionnez un onglet ci-dessus pour voir les détails.
      </Text>
    </ScrollView>
  );

  const handleUserAction = (userItem) => {
    // Éviter de s'auto-gérer ou de supprimer le compte admin principal si nécessaire
    const isSelf = currentUser && userItem.id === currentUser.id;

    const options = [
      { text: "Annuler", style: "cancel" },
      { 
        text: userItem.role === 'admin' ? "Rétrograder en Utilisateur" : "Passer Administrateur",
        onPress: () => toggleAdminRole(userItem)
      },
    ];

    if (!isSelf) {
      options.push({
        text: "Supprimer le compte",
        style: "destructive",
        onPress: () => confirmDeleteUser(userItem)
      });
    }

    Alert.alert(
      "Actions sur l'utilisateur",
      `Que souhaitez-vous faire pour ${userItem.full_name || userItem.email} ?`,
      options
    );
  };

  const toggleAdminRole = async (userItem) => {
    try {
      const isCurrentlyAdmin = userItem.role === 'admin';
      const { error } = isCurrentlyAdmin 
        ? await adminService.demoteFromAdmin(userItem.id)
        : await adminService.promoteToAdmin(userItem.id);

      if (error) {
        Alert.alert("Erreur", "Impossible de changer le rôle.");
      } else {
        setUsers(users.map(u => 
          u.id === userItem.id ? { ...u, role: isCurrentlyAdmin ? 'user' : 'admin' } : u
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeleteUser = (userItem) => {
    Alert.alert(
      "Confirmation de suppression",
      `Êtes-vous certain de vouloir supprimer DÉFINITIVEMENT le compte de ${userItem.email} ? Cette action supprimera également toutes ses voitures, messages et événements.`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await adminService.deleteUser(userItem.id);
            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'utilisateur.");
            } else {
              setUsers(users.filter(u => u.id !== userItem.id));
              setStats(prev => ({ ...prev, users: prev.users - 1 }));
            }
          }
        }
      ]
    );
  };

  const renderUsers = () => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.listItem} onPress={() => handleUserAction(item)}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.full_name || 'Utilisateur sans nom'}</Text>
            <Text style={styles.itemSub}>{item.email}</Text>
            <View style={styles.tagRow}>
               <Text style={[styles.tag, item.role === 'admin' && styles.tagAdmin]}>
                 {item.role === 'admin' ? 'Admin' : 'Utilisateur'}
               </Text>
            </View>
          </View>
          <Ionicons name="ellipsis-vertical" size={20} color="#4b5563" />
        </TouchableOpacity>
      )}
    />
  );

  const renderEvents = () => (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.title}</Text>
            <Text style={styles.itemSub}>{item.location} • {new Date(item.event_date).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.itemSub}>Créé par: {item.creator_name}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.featureBtn, item.is_featured && styles.featureBtnActive]}
            onPress={() => handleToggleFeature(item.id, item.is_featured)}
          >
            <Ionicons 
              name={item.is_featured ? "star" : "star-outline"} 
              size={18} 
              color={item.is_featured ? "#f59e0b" : "#9ca3af"} 
            />
            <Text style={[styles.featureBtnText, item.is_featured && styles.featureBtnTextActive]}>
              {item.is_featured ? "Mis en avant" : "Mettre en avant"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Administration</Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Membres</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Événements</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : (
        <View style={styles.mainContent}>
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'events' && renderEvents()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  refreshBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  cardRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: 'center',
  },
  cardPlaceholder: {
    flex: 1,
  },
  cardLabel: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 4,
  },
  cardValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
  listContent: {
    padding: 20,
  },
  listItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSub: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 2,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tag: {
    fontSize: 11,
    color: '#9ca3af',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tagAdmin: {
    color: '#fff',
    backgroundColor: '#3b82f6',
  },
  featureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  featureBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  featureBtnText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
  },
  featureBtnTextActive: {
    color: '#f59e0b',
  },
  soonText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
