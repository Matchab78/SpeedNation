import React, { useEffect, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAuth } from "../utils/authContext";

// --- THÈME (palette SpeedNation, alignée avec le design Lovable) ---
const COLORS = {
  background: "#0B0813",        // fond noir très sombre violacé (≈ oklch(0.13 0.02 285))
  surface: "#16121F",            // surfaces de cards
  surfaceElevated: "#1E1A2B",    // boutons, badges
  border: "rgba(80, 70, 110, 0.4)",
  borderStrong: "rgba(120, 100, 160, 0.5)",
  foreground: "#FAFAFA",
  mutedForeground: "#9B95AE",
  primary: "#8916CB",            // violet SpeedNation
  primaryGlow: "#A855F7",
  primaryDark: "#6B0FA0",
};

// --- DONNÉES MOCKÉES (faciles à remplacer par eventService.getAllEvents() plus tard) ---
const FEATURED_EVENT = {
  title: "Midnight Run : A86 West Loop",
  time: "23:30",
  location: "Tunnel de Nanterre",
  tags: ["Nocturne", "JDM Only"],
  participants: 42,
  image: require("../assets/hero-event.jpg"),
};

const UPCOMING_EVENTS = [
  {
    id: "1",
    tag: "Youngtimers",
    title: "Café & Carbu : Sunday Classics",
    when: "7 Mai · 09:00",
    where: "Place Vendôme, Paris",
    participants: 12,
    img: require("../assets/event-youngtimers.jpg"),
  },
  {
    id: "2",
    tag: "Circuit",
    title: "Track Day : Montlhéry Speed Test",
    when: "15 Mai · 10:00",
    where: "Autodrome de Linas",
    participants: 28,
    img: require("../assets/event-circuit.jpg"),
  },
];

const LATEST_EVENTS = [
  {
    id: "3",
    tag: "Open",
    title: "Cars & Coffee Bordeaux",
    when: "Ajouté il y a 2h",
    where: "Quai des Chartrons",
    participants: 47,
    img: require("../assets/event-coffee.jpg"),
  },
  {
    id: "4",
    tag: "JDM",
    title: "Garage Night JDM",
    when: "Ajouté hier",
    where: "Lyon Confluence",
    participants: 22,
    img: require("../assets/event-jdm.jpg"),
  },
];

// --- COMPOSANT : Section label (kicker UPPERCASE + action "Tout voir") ---
function SectionLabel({ children, action }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabelText}>{children}</Text>
      {action}
    </View>
  );
}

// --- COMPOSANT : Card événement (horizontale avec image + infos) ---
function EventCard({ item, onJoin }) {
  return (
    <View style={styles.card}>
      <Image source={item.img} style={styles.cardImage} resizeMode="cover" />

      <View style={styles.cardContent}>
        <View style={styles.cardTagWrapper}>
          <Text style={styles.cardTagText}>{item.tag}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.when} · {item.where}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.cardParticipants}>
            <Ionicons name="people-outline" size={14} color={COLORS.mutedForeground} />
            <Text style={styles.cardParticipantsText}>
              {item.participants} participants
            </Text>
          </View>

          <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
            <Text style={styles.joinButtonText}>Rejoindre</Text>
            <Feather name="arrow-right" size={12} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- COMPOSANT : Point "EN DIRECT" qui pulse ---
function LivePulse() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
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

  // Greeting dynamique selon connexion
  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : null;
  const greeting = firstName ? `Bonsoir, ${firstName}.` : "Bienvenue sur SpeedNation";

  // Handlers de navigation (préservent tes liens existants)
  const goToLogin = () => navigation.navigate("LoginScreen");
  const goToProfile = () => navigation.navigate("Cars");
  const goToAllEvents = () => navigation.navigate("Events");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* --- HEADER STICKY (logo + bouton login/profil) --- */}
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

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
      >
        {/* --- GREETING --- */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingKicker}>BIENVENUE</Text>
          <Text style={styles.greetingTitle}>{greeting}</Text>
          <Text style={styles.greetingSubtitle}>
            Voici ce qui roule dans la communauté ce soir.
          </Text>
        </View>

        {/* --- HERO : ÉVÉNEMENT EN VEDETTE --- */}
        <View style={styles.section}>
          <SectionLabel action={<LivePulse />}>ÉVÉNEMENT EN VEDETTE</SectionLabel>

          <View style={styles.heroCard}>
            <Image source={FEATURED_EVENT.image} style={styles.heroImage} resizeMode="cover" />

            {/* Gradient noir vers transparent (rend le texte lisible sur l'image) */}
            <LinearGradient
              colors={["transparent", "rgba(11, 8, 19, 0.7)", COLORS.background]}
              locations={[0, 0.55, 1]}
              style={styles.heroGradient}
            />

            <View style={styles.heroContent}>
              {/* Tags Nocturne / JDM Only */}
              <View style={styles.heroTagsRow}>
                <View style={[styles.heroTag, styles.heroTagPrimary]}>
                  <Text style={styles.heroTagTextPrimary}>{FEATURED_EVENT.tags[0]}</Text>
                </View>
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>{FEATURED_EVENT.tags[1]}</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>{FEATURED_EVENT.title}</Text>

              <View style={styles.heroFooter}>
                <View style={styles.heroInfoRow}>
                  <View style={styles.heroInfoItem}>
                    <Ionicons name="time-outline" size={15} color={COLORS.foreground} />
                    <Text style={styles.heroInfoText}>{FEATURED_EVENT.time}</Text>
                  </View>
                  <View style={styles.heroInfoItem}>
                    <Ionicons name="location-outline" size={15} color={COLORS.foreground} />
                    <Text style={styles.heroInfoText}>{FEATURED_EVENT.location}</Text>
                  </View>
                </View>

                {/* Avatars empilés + badge +42 */}
                <View style={styles.avatarsRow}>
                  <View style={[styles.avatar, styles.avatarMuted]} />
                  <View style={[styles.avatar, styles.avatarSurface, { marginLeft: -10 }]} />
                  <LinearGradient
                    colors={[COLORS.primaryGlow, COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.avatar, styles.avatarPrimary, { marginLeft: -10 }]}
                  >
                    <Text style={styles.avatarPlusText}>+{FEATURED_EVENT.participants}</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* --- PROCHAINS RASSEMBLEMENTS --- */}
        <View style={styles.section}>
          <SectionLabel
            action={
              <TouchableOpacity onPress={goToAllEvents}>
                <Text style={styles.actionLinkText}>
                  Tout voir ({UPCOMING_EVENTS.length})
                </Text>
              </TouchableOpacity>
            }
          >
            NOS PROCHAINS RASSEMBLEMENTS
          </SectionLabel>

          <View style={styles.cardList}>
            {UPCOMING_EVENTS.map((item) => (
              <EventCard key={item.id} item={item} onJoin={() => {}} />
            ))}
          </View>
        </View>

        {/* --- DERNIERS AJOUTS --- */}
        <View style={styles.section}>
          <SectionLabel
            action={
              <TouchableOpacity onPress={goToAllEvents}>
                <Text style={styles.actionLinkText}>
                  Tout voir ({LATEST_EVENTS.length})
                </Text>
              </TouchableOpacity>
            }
          >
            NOS DERNIERS AJOUTS
          </SectionLabel>

          <View style={styles.cardList}>
            {LATEST_EVENTS.map((item) => (
              <EventCard key={item.id} item={item} onJoin={() => {}} />
            ))}
          </View>
        </View>

        {/* --- BOUTON "VOIR TOUS LES ÉVÉNEMENTS" --- */}
        <View style={styles.allEventsButtonWrapper}>
          <TouchableOpacity style={styles.allEventsButton} onPress={goToAllEvents}>
            <Ionicons name="add" size={16} color={COLORS.foreground} />
            <Text style={styles.allEventsButtonText}>Voir tous les événements</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ----- HEADER ----- */
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
  logo: {
    width: 130,
    height: 50,
  },
  loginButton: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginText: {
    color: COLORS.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
  profileButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  profileText: {
    color: COLORS.foreground,
    fontWeight: "600",
    fontSize: 14,
  },

  /* ----- SCROLL ----- */
  scrollContent: {
    paddingBottom: 120, // espace pour le TabNavigator flottant
  },

  /* ----- GREETING ----- */
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
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
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.mutedForeground,
    marginTop: 6,
  },

  /* ----- SECTIONS ----- */
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
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
  actionLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },

  /* ----- LIVE PULSE ----- */
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: COLORS.primary,
  },

  /* ----- HERO ----- */
  heroCard: {
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
  },
  heroTagsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
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
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroInfoRow: {
    flexDirection: "row",
    gap: 14,
  },
  heroInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroInfoText: {
    fontSize: 13,
    color: COLORS.foreground,
    opacity: 0.9,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarSurface: {
    backgroundColor: COLORS.surfaceElevated,
  },
  avatarMuted: {
    backgroundColor: "#3A3247",
  },
  avatarPrimary: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlusText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.foreground,
  },

  /* ----- CARDS ----- */
  cardList: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
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
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.mutedForeground,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardParticipants: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardParticipantsText: {
    fontSize: 11,
    color: COLORS.mutedForeground,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },

  /* ----- "VOIR TOUS" ----- */
  allEventsButtonWrapper: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
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
  allEventsButtonText: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "500",
  },
});
