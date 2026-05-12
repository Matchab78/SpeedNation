import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { eventService } from "../services/eventService";
import { getImageUrl } from "../services/apiService";
import { useAuth } from "../utils/authContext";

// --- THÈME (palette SpeedNation, alignée avec le design Lovable) ---
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

// --- HELPERS ---

// Source d'image pour les cards (avec fallback)
function getCardImageSource(event, fallbackIndex = 0) {
  const fallbacks = [
    require("../assets/event-youngtimers.jpg"),
    require("../assets/event-circuit.jpg"),
    require("../assets/event-coffee.jpg"),
    require("../assets/event-jdm.jpg"),
  ];
  if (event?.image_url) {
    return { uri: getImageUrl(event.image_url.trim()) };
  }
  return fallbacks[fallbackIndex % fallbacks.length];
}

// Source d'image pour le hero (avec fallback)
function getHeroImageSource(event) {
  if (event?.image_url) {
    return { uri: getImageUrl(event.image_url.trim()) };
  }
  return require("../assets/hero-event.jpg");
}

// Tag d'affichage déduit de la visibility
function getEventTag(event, fallback = "Event") {
  if (event?.visibility === "private") return "Privé";
  if (event?.visibility === "public") return "Public";
  return fallback;
}

// --- COMPOSANT : Label de section ---
function SectionLabel({ children, action }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabelText}>{children}</Text>
      {action}
    </View>
  );
}

// --- COMPOSANT : Card événement ---
function EventCard({ item, fallbackIndex, onJoin, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={getCardImageSource(item, fallbackIndex)}
        style={styles.cardImage}
        resizeMode="cover"
      />

      <View style={styles.cardContent}>
        <View style={styles.cardTagWrapper}>
          <Text style={styles.cardTagText}>{getEventTag(item)}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.event_date} · {item.location || "Lieu à confirmer"}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.cardParticipants}>
            <Ionicons name="people-outline" size={14} color={COLORS.mutedForeground} />
            <Text style={styles.cardParticipantsText}>
              {item.participant_count || 0} participants
            </Text>
          </View>

          <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
            <Text style={styles.joinButtonText}>Rejoindre</Text>
            <Feather name="arrow-right" size={12} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// --- COMPOSANT : Point "EN DIRECT" qui pulse ---
function LivePulse() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.liveRow}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Text style={styles.liveText}>EN DIRECT</Text>
    </View>
  );
}

// --- ÉCRAN PRINCIPAL ---
export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Greeting dynamique
  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : null;
  const greeting = firstName ? `Bonsoir, ${firstName}.` : "Bienvenue sur SpeedNation";

  // === FETCH (même pattern que EventsScreen) ===
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await eventService.getAllEvents();
        if (error) {
          console.error("Erreur de chargement des événements:", error);
          // On n'affiche pas d'Alert sur la HomeScreen pour ne pas être trop intrusif
          // (l'utilisateur verra juste l'écran vide). Si tu préfères une Alert, décommente :
          // Alert.alert("Erreur", "Impossible de charger les événements");
          return;
        }
        setEvents(data || []);
      } catch (err) {
        console.error("Erreur inattendue de chargement des événements:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchEvents();
  }, [refreshTick]);

  // === REFRESH AUTO AU FOCUS (même pattern que EventsScreen) ===
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setRefreshTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  // === PULL-TO-REFRESH ===
  const onRefresh = () => {
    setRefreshing(true);
    setRefreshTick((prev) => prev + 1);
  };

  // === DÉRIVATION : hero + 2 listes ===
  const featuredEvent = useMemo(() => events.find((e) => e.is_featured), [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => {
        if (e.is_featured) return false;
        if (!e.event_date) return false;
        const eventDate = new Date(e.event_date);
        return eventDate >= today;
      })
      .slice(0, 2);
  }, [events]);

  const latestEvents = useMemo(() => {
    const upcomingIds = new Set(upcomingEvents.map((e) => e.id));
    return [...events]
      .filter((e) => !e.is_featured && !upcomingIds.has(e.id))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 2);
  }, [events, upcomingEvents]);

  // === HANDLERS NAVIGATION ===
  const goToLogin = () => navigation.navigate("LoginScreen");
  const goToProfile = () => navigation.navigate("Cars");
  const goToAllEvents = () => navigation.navigate("Events");

  // Rejoindre un événement (placeholder pour l'instant — à brancher quand tu auras
  // décidé du flux : participation via eventService.joinEvent ? autre ?)
  const handleJoinEvent = (eventId) => {
    if (!user) {
      navigation.navigate("LoginScreen");
      return;
    }
    // TODO: brancher à eventService.joinEvent(eventId, user.id) quand prêt
    Alert.alert("Bientôt", "L'inscription aux événements arrive prochainement !");
  };

  // === RENDU ===
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />

        {user ? (
          <TouchableOpacity style={styles.profileButton} onPress={goToProfile}>
            <Text style={styles.profileText}>{firstName || "Profil"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* GREETING */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingKicker}>BIENVENUE</Text>
          <Text style={styles.greetingTitle}>{greeting}</Text>
          <Text style={styles.greetingSubtitle}>
            Voici ce qui roule dans la communauté ce soir.
          </Text>
        </View>

        {/* LOADING */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* CONTENU */}
        {!loading && (
          <>
            {/* HERO */}
            {featuredEvent && (
              <View style={styles.section}>
                <SectionLabel action={<LivePulse />}>ÉVÉNEMENT EN VEDETTE</SectionLabel>

                <View style={styles.heroCard}>
                  <Image
                    source={getHeroImageSource(featuredEvent)}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />

                  <LinearGradient
                    colors={["transparent", "rgba(11, 8, 19, 0.7)", COLORS.background]}
                    locations={[0, 0.55, 1]}
                    style={styles.heroGradient}
                  />

                  <View style={styles.heroContent}>
                    <View style={styles.heroTagsRow}>
                      <View style={[styles.heroTag, styles.heroTagPrimary]}>
                        <Text style={styles.heroTagTextPrimary}>
                          {getEventTag(featuredEvent, "Vedette")}
                        </Text>
                      </View>
                      {featuredEvent.max_participants && (
                        <View style={styles.heroTag}>
                          <Text style={styles.heroTagText}>
                            Max {featuredEvent.max_participants}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.heroTitle} numberOfLines={2}>
                      {featuredEvent.title}
                    </Text>

                    <View style={styles.heroFooter}>
                      <View style={styles.heroInfoRow}>
                        <View style={styles.heroInfoItem}>
                          <Ionicons name="calendar-outline" size={15} color={COLORS.foreground} />
                          <Text style={styles.heroInfoText} numberOfLines={1}>
                            {featuredEvent.event_date}
                          </Text>
                        </View>
                        <View style={styles.heroInfoItem}>
                          <Ionicons name="location-outline" size={15} color={COLORS.foreground} />
                          <Text style={styles.heroInfoText} numberOfLines={1}>
                            {featuredEvent.location || "À confirmer"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.avatarsRow}>
                        <View style={[styles.avatar, styles.avatarMuted]} />
                        <View style={[styles.avatar, styles.avatarSurface, { marginLeft: -10 }]} />
                        <LinearGradient
                          colors={[COLORS.primaryGlow, COLORS.primary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.avatar, styles.avatarPrimary, { marginLeft: -10 }]}
                        >
                          <Text style={styles.avatarPlusText}>
                            +{featuredEvent.participant_count || 0}
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* PROCHAINS RASSEMBLEMENTS */}
            {upcomingEvents.length > 0 && (
              <View style={styles.section}>
                <SectionLabel
                  action={
                    <TouchableOpacity onPress={goToAllEvents}>
                      <Text style={styles.actionLinkText}>Tout voir ({events.length})</Text>
                    </TouchableOpacity>
                  }
                >
                  NOS PROCHAINS RASSEMBLEMENTS
                </SectionLabel>

                <View style={styles.cardList}>
                  {upcomingEvents.map((item, idx) => (
                    <EventCard
                      key={item.id}
                      item={item}
                      fallbackIndex={idx}
                      onPress={() => navigation.navigate("Events")}
                      onJoin={() => handleJoinEvent(item.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* DERNIERS AJOUTS */}
            {latestEvents.length > 0 && (
              <View style={styles.section}>
                <SectionLabel
                  action={
                    <TouchableOpacity onPress={goToAllEvents}>
                      <Text style={styles.actionLinkText}>Tout voir ({events.length})</Text>
                    </TouchableOpacity>
                  }
                >
                  NOS DERNIERS AJOUTS
                </SectionLabel>

                <View style={styles.cardList}>
                  {latestEvents.map((item, idx) => (
                    <EventCard
                      key={item.id}
                      item={item}
                      fallbackIndex={idx + 2}
                      onPress={() => navigation.navigate("Events")}
                      onJoin={() => handleJoinEvent(item.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* EMPTY STATE */}
            {events.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={40} color={COLORS.mutedForeground} />
                <Text style={styles.emptyTitle}>Aucun événement</Text>
                <Text style={styles.emptyMessage}>
                  Les prochains rassemblements apparaîtront ici dès qu'ils seront publiés.
                </Text>
              </View>
            )}

            {/* BOUTON "VOIR TOUS" */}
            {events.length > 0 && (
              <View style={styles.allEventsButtonWrapper}>
                <TouchableOpacity style={styles.allEventsButton} onPress={goToAllEvents}>
                  <Ionicons name="add" size={16} color={COLORS.foreground} />
                  <Text style={styles.allEventsButtonText}>Voir tous les événements</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: { width: 130, height: 50 },
  loginButton: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginText: { color: COLORS.foreground, fontWeight: "600", fontSize: 14 },
  profileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  profileText: { color: COLORS.foreground, fontWeight: "600", fontSize: 14 },

  scrollContent: { paddingBottom: 120 },

  greetingSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  greetingKicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    color: COLORS.primary,
    marginBottom: 8,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.foreground,
    letterSpacing: -0.5,
  },
  greetingSubtitle: { fontSize: 14, color: COLORS.mutedForeground, marginTop: 6 },

  loadingContainer: { paddingVertical: 60, alignItems: "center" },
  emptyContainer: { paddingVertical: 60, paddingHorizontal: 40, alignItems: "center", gap: 8 },
  emptyTitle: { color: COLORS.foreground, fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptyMessage: { color: COLORS.mutedForeground, fontSize: 13, textAlign: "center" },

  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2.2,
    color: COLORS.mutedForeground,
  },
  actionLinkText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },

  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  liveText: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: COLORS.primary },

  heroCard: {
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 18 },
  heroTagsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  heroTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(22, 18, 31, 0.8)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTagPrimary: {
    backgroundColor: "rgba(137, 22, 203, 0.2)",
    borderColor: "rgba(137, 22, 203, 0.5)",
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.foreground,
    textTransform: "uppercase",
  },
  heroTagTextPrimary: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.primaryGlow,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.foreground,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroInfoRow: { flexDirection: "row", gap: 14, flex: 1, marginRight: 12 },
  heroInfoItem: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  heroInfoText: { fontSize: 13, color: COLORS.foreground, opacity: 0.9 },
  avatarsRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.background },
  avatarSurface: { backgroundColor: COLORS.surfaceElevated },
  avatarMuted: { backgroundColor: "#3A3247" },
  avatarPrimary: { justifyContent: "center", alignItems: "center" },
  avatarPlusText: { fontSize: 10, fontWeight: "700", color: COLORS.foreground },

  cardList: { gap: 12 },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: { width: 80, height: 80, borderRadius: 14 },
  cardContent: { flex: 1, justifyContent: "space-between" },
  cardTagWrapper: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: COLORS.foreground,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.foreground,
    marginTop: 4,
    lineHeight: 18,
  },
  cardSubtitle: { fontSize: 12, color: COLORS.mutedForeground, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardParticipants: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardParticipantsText: { fontSize: 11, color: COLORS.mutedForeground },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  joinButtonText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },

  allEventsButtonWrapper: { alignItems: "center", marginTop: 24, paddingHorizontal: 20 },
  allEventsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allEventsButtonText: { color: COLORS.foreground, fontSize: 14, fontWeight: "500" },
});
