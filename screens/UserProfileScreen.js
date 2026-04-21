import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messagingService } from "../services/messagingService";
import { authService } from "../services/authService";
import { useAuth } from "../utils/authContext";
import { profilesApi, carsApi } from "../services/apiService";

const { width } = Dimensions.get("window");
const GRID_GAP = 2;
const COLS = 3;
const ITEM_SIZE = Math.floor((width - GRID_GAP * (COLS - 1)) / COLS);

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isMe = useMemo(() => currentUser && currentUser.id === userId, [currentUser, userId]);

  useEffect(() => {
    loadData();
  }, [userId, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadCars(),
        loadFollowStatus()
      ]);
    } catch (e) {
      console.error("loadData error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await profilesApi.getById(userId);
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error("loadProfile error:", error);
    }
  };

  const loadCars = async () => {
    try {
      const response = await carsApi.getByUserId(userId);
      if (response.data) {
        setCars(response.data.filter(c => !!c.image_url));
      }
    } catch (error) {
      console.error("loadCars error:", error);
    }
  };

  const loadFollowStatus = async () => {
    if (!currentUser || isMe) return;
    try {
      const response = await profilesApi.getFollowStatus(userId, currentUser.id);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error("loadFollowStatus error:", error);
    }
  };

  const toggleFollow = async () => {
    if (followLoading || !currentUser || isMe) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profilesApi.unfollow(userId, currentUser.id);
        setIsFollowing(false);
        setProfile(prev => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }));
      } else {
        await profilesApi.follow(userId, currentUser.id);
        setIsFollowing(true);
        setProfile(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le suivi.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser?.id || !userId || isMe) return;

    try {
      const res = await messagingService.getOrCreatePrivateConversation(currentUser.id, userId);
      if (res?.error) throw res.error;

      navigation.navigate("Chat", {
        conversationId: res.conversation.id,
        otherUser: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ouvrir la conversation.");
    }
  };

  const toggleRoleVisibility = async () => {
    if (!isMe || !profile) return;
    const next = !profile.show_role_public;
    try {
      await authService.updateProfile(userId, { show_role_public: next });
      setProfile(prev => ({ ...prev, show_role_public: next }));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier la visibilité.");
    }
  };

  const renderPhoto = ({ item, index }) => {
    const marginRight = index % COLS !== COLS - 1 ? GRID_GAP : 0;
    return (
      <TouchableOpacity
        style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginRight, marginBottom: GRID_GAP }}
        onPress={() => navigation.navigate("CarDetail", { carId: item.id, imageUrl: item.image_url })}
      >
        <Image source={{ uri: item.image_url }} style={styles.gridImage} />
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  if (!profile) return <View style={styles.center}><Text style={{ color: "#fff" }}>Profil introuvable</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.headerBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileTop}>
        <Image
          source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "U")}` }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.full_name || "Utilisateur"}</Text>
          
          {profile.show_role_public !== false && !!profile.role && (
            <View style={styles.roleBadgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{profile.role === 'admin' ? 'Administrateur' : profile.role}</Text>
              </View>
              {isMe && (
                <TouchableOpacity onPress={toggleRoleVisibility}>
                  <Text style={styles.roleToggleText}>Cacher</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statNumber}>{cars.length}</Text><Text style={styles.statLabel}>Photos</Text></View>
            <View style={styles.stat}><Text style={styles.statNumber}>{profile.followers_count || 0}</Text><Text style={styles.statLabel}>Followers</Text></View>
          </View>

          {!isMe && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={toggleFollow}
                disabled={followLoading}
              >
                <Text style={styles.followText}>{followLoading ? "..." : isFollowing ? "Suivi ✓" : "Follow"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.bioContainer}>
             {!!profile.profession && <Text style={styles.bio}>{profile.profession}</Text>}
             {!!profile.location && <Text style={styles.bio}>{profile.location}</Text>}
          </View>
        </View>
      </View>

      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={renderPhoto}
        numColumns={COLS}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        ListEmptyComponent={<View style={styles.emptyWrap}><Text style={styles.empty}>Aucune photo</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 50 },
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, marginBottom: 15 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtnText: { color: "#fff", fontWeight: '600' },
  profileTop: { flexDirection: "row", paddingHorizontal: 16, gap: 15, marginBottom: 20 },
  avatar: { width: 85, height: 85, borderRadius: 42 },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  roleBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 5 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#333" },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  roleToggleText: { color: "#666", fontSize: 11 },
  statsRow: { flexDirection: "row", gap: 20, marginTop: 12 },
  stat: { alignItems: "center" },
  statNumber: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#888", fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  followBtn: { flex: 1, backgroundColor: "#8916CB", paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  followingBtn: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333" },
  followText: { color: "#fff", fontWeight: "700" },
  messageBtn: { backgroundColor: "#1a1a1a", width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#333" },
  bioContainer: { marginTop: 10 },
  bio: { color: "#888", fontSize: 13 },
  gridImage: { width: "100%", height: "100%", backgroundColor: "#111" },
  emptyWrap: { alignItems: "center", marginTop: 50 },
  empty: { color: "#444" },
});
