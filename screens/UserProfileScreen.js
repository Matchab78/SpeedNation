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
import { supabase } from "../supabase/supabase";

const { width } = Dimensions.get("window");
const GRID_GAP = 2;
const COLS = 3;
const ITEM_SIZE = Math.floor((width - GRID_GAP * (COLS - 1)) / COLS);

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;

  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const [meId, setMeId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const isMe = useMemo(() => meId && meId === userId, [meId, userId]);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    setLoading(true);

    // ✅ récup user de façon fiable
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) console.log("getSession error:", sessionErr);

    const uid = sessionData?.session?.user?.id || null;
    setMeId(uid);

    await Promise.all([
      loadProfile(),
      loadCars(),
      loadFollowersCount(),
      uid ? loadFollowState(uid) : Promise.resolve(),
    ]);

    setLoading(false);
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, profession, location")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("loadProfile error:", error);
      return;
    }
    setProfile(data);
  };

  const loadCars = async () => {
    const { data, error } = await supabase
      .from("cars")
      .select("id, image_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.log("loadCars error:", error);
      return;
    }
    setCars((data || []).filter((c) => !!c.image_url));
  };

  const loadFollowersCount = async () => {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (error) {
      console.log("loadFollowersCount error:", error);
      return;
    }
    setFollowersCount(count || 0);
  };

  const loadFollowState = async (currentUserId) => {
    if (!currentUserId || currentUserId === userId) {
      setIsFollowing(false);
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", userId)
      .maybeSingle();

    if (error) {
      console.log("loadFollowState error:", error);
      return;
    }
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (followLoading) return;

    // ✅ si pas connecté → message clair
    if (!meId) {
      Alert.alert("Connexion requise", "Tu dois être connecté pour follow.");
      return;
    }

    // ✅ éviter follow soi-même
    if (isMe) {
      Alert.alert("Info", "Tu ne peux pas te follow toi-même.");
      return;
    }

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", meId)
        .eq("following_id", userId);

      if (error) {
        console.log("unfollow error:", error);
        Alert.alert("Erreur unfollow", error.message || "Impossible de unfollow.");
        setFollowLoading(false);
        return;
      }

      setIsFollowing(false);
      setFollowersCount((v) => Math.max(0, v - 1));
      setFollowLoading(false);
      return;
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: meId,
      following_id: userId,
    });

    if (error) {
      console.log("follow error:", error);
      Alert.alert("Erreur follow", error.message || "Impossible de follow.");
      setFollowLoading(false);
      return;
    }

    setIsFollowing(true);
    setFollowersCount((v) => v + 1);
    setFollowLoading(false);
  };

  const renderPhoto = ({ item, index }) => {
    const marginRight = index % COLS !== COLS - 1 ? GRID_GAP : 0;
    const marginBottom = GRID_GAP;

    return (
      <View style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginRight, marginBottom }}>
        <Image source={{ uri: item.image_url }} style={styles.gridImage} resizeMode="cover" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Profil introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER (retour en haut à droite) */}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnText}>Retour</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* TOP PROFIL */}
      <View style={styles.profileTop}>
        <Image
          source={{
            uri:
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || "User")}`,
          }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.full_name || "Utilisateur"}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{cars.length}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          {!!profile.profession && <Text style={styles.bio}>{profile.profession}</Text>}
          {!!profile.location && <Text style={styles.bio}>{profile.location}</Text>}

          {!isMe && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={toggleFollow}
              activeOpacity={0.8}
              disabled={followLoading}
            >
              <Text style={styles.followText}>
                {followLoading ? "..." : isFollowing ? "Suivi ✓" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* GRILLE PHOTOS */}
      {cars.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>Aucune photo</Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoto}
          numColumns={COLS}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  headerBtnText: { color: "#fff", fontSize: 14 },

  profileTop: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  name: { color: "#fff", fontSize: 18, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 16, marginTop: 10 },
  stat: { alignItems: "center" },
  statNumber: { color: "#fff", fontWeight: "700", fontSize: 16 },
  statLabel: { color: "#8e8e8e", fontSize: 12, marginTop: 2 },

  bio: { color: "#aaa", marginTop: 6 },

  followBtn: {
    marginTop: 12,
    backgroundColor: "#8916CB",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
  },
  followingBtn: { backgroundColor: "#222", borderWidth: 1, borderColor: "#333" },
  followText: { color: "#fff", fontWeight: "700" },

  gridImage: { width: "100%", height: "100%", backgroundColor: "#111" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 120 },
  empty: { color: "#777" },
});
