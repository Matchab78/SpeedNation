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
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messagingService } from "../services/messagingService";
import { authService } from "../services/authService";
import { useAuth } from "../utils/authContext";
import { profilesApi, carsApi, getImageUrl } from "../services/apiService";

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
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

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

  const openFollowers = async () => {
    setShowFollowersModal(true);
    setListLoading(true);
    try {
      const res = await profilesApi.get(userId + '/followers');
      setFollowersList(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  };

  const openFollowing = async () => {
    setShowFollowingModal(true);
    setListLoading(true);
    try {
      const res = await profilesApi.get(userId + '/following');
      setFollowingList(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
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
        onPress={() => navigation.navigate("CarDetail", { carId: item.id, imageUrl: getImageUrl(item.image_url) })}
      >
        <Image source={{ uri: getImageUrl(item.image_url) }} style={styles.gridImage} />
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
          source={{ uri: getImageUrl(profile.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "U")}` }}
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
            <TouchableOpacity style={styles.stat} onPress={openFollowers}>
              <Text style={styles.statNumber}>{profile.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stat} onPress={openFollowing}>
              <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Suivis</Text>
            </TouchableOpacity>
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

      {/* MODAL FOLLOWERS */}
      <Modal visible={showFollowersModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Followers</Text>
              <TouchableOpacity onPress={() => setShowFollowersModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {listLoading ? <ActivityIndicator color="#8916CB" /> : (
              <FlatList
                data={followersList}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.userItem} 
                    onPress={() => {
                      setShowFollowersModal(false);
                      navigation.push("UserProfile", { userId: item.id });
                    }}
                  >
                    <Image source={{ uri: getImageUrl(item.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || "U")}` }} style={styles.userAvatar} />
                    <View>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userBio}>{item.profession || "Passionné"}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyList}>Aucun follower</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL FOLLOWING */}
      <Modal visible={showFollowingModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Abonnements</Text>
              <TouchableOpacity onPress={() => setShowFollowingModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {listLoading ? <ActivityIndicator color="#8916CB" /> : (
              <FlatList
                data={followingList}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.userItem} 
                    onPress={() => {
                      setShowFollowingModal(false);
                      navigation.push("UserProfile", { userId: item.id });
                    }}
                  >
                    <Image source={{ uri: getImageUrl(item.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || "U")}` }} style={styles.userAvatar} />
                    <View>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userBio}>{item.profession || "Passionné"}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyList}>Aucun abonnement</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', height: '70%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userItem: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  userAvatar: { width: 50, height: 50, borderRadius: 25 },
  userName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userBio: { color: '#666', fontSize: 12 },
  emptyList: { color: '#666', textAlign: 'center', marginTop: 20 },
});
