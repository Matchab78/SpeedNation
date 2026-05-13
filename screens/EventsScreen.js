import React, { useEffect, useMemo, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { eventService } from "../services/eventService";
import { useAuth } from "../utils/authContext";
import { getImageUrl } from "../services/apiService";

export default function EventsScreen({ navigation, route }) {
  const { user, isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Recharger quand on revient de EventFormScreen avec un param refresh
  useEffect(() => {
    if (route?.params?.refresh) {
      setRefreshTick((prev) => prev + 1);
    }
  }, [route?.params?.refresh]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await eventService.getAllEvents();
        if (error) {
          console.error("Erreur de chargement des événements:", error);
          Alert.alert("Erreur", "Impossible de charger les événements");
          return;
        }
        setEvents(data || []);
      } catch (err) {
        console.error("Erreur inattendue de chargement des événements:", err);
        Alert.alert("Erreur", "Une erreur inattendue est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [refreshTick]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshTick(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);

  const featuredEvent = useMemo(
    () => events.find((e) => e.is_featured),
    [events]
  );

  const otherEvents = useMemo(
    () => events.filter((e) => !featuredEvent || e.id !== featuredEvent.id),
    [events, featuredEvent]
  );

  const goCreate = () => navigation.navigate("EventForm", { 
    mode: "create",
    key: Date.now()
  });
  
  const goEdit = (event) => navigation.navigate("EventForm", { 
    mode: "edit", 
    event,
    key: Date.now()
  });

  const handleToggleFavorite = (eventId) => {
    setFavoriteIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleDeleteEvent = (event) => {
    if (!isAdmin) return;
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setShowDeleteModal(false);
    try {
      const { error } = await eventService.deleteEvent(eventToDelete.id, user.id);
      if (error) {
        console.error("Erreur deleteEvent:", error);
        Alert.alert("Erreur", error.message || "Impossible de supprimer l'événement");
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
    } catch (err) {
      console.error("Erreur inattendue deleteEvent:", err);
      Alert.alert("Erreur", "Une erreur inattendue est survenue");
    } finally {
      setEventToDelete(null);
    }
  };

  const handleSetFeatured = async (event) => {
    if (!isAdmin) return;

    try {
      if (event.is_featured) {
        const { error } = await eventService.clearFeaturedEvent(event.id);
        if (error) {
          console.error("Erreur clearFeaturedEvent:", error);
          Alert.alert("Erreur", error.message || "Impossible d'enlever la mise en avant");
          return;
        }
      } else {
        const { error } = await eventService.setFeaturedEvent(event.id);
        if (error) {
          console.error("Erreur setFeaturedEvent:", error);
          Alert.alert("Erreur", error.message || "Impossible de mettre cet événement en avant");
          return;
        }
      }

      // Recharger la liste
      const { data, error: reloadError } = await eventService.getAllEvents();
      if (reloadError) {
        console.error("Erreur de rechargement des événements:", reloadError);
        return;
      }
      setEvents(data || []);
    } catch (err) {
      console.error("Erreur inattendue setFeaturedEvent:", err);
      Alert.alert("Erreur", "Une erreur inattendue est survenue");
    }
  };

  const renderEventCard = ({ item }) => (
    <View style={styles.cardRow}>
      <Image
        source={
          item.image_url
            ? { uri: getImageUrl(item.image_url.trim()) }
            : require("../assets/M3GreyList.jpg")
        }
        style={styles.cardImage}
        resizeMode="cover"
      />

      <View style={styles.cardTextContainer}>
        {item.visibility !== "public" && (
          <View style={styles.privateBadge}>
            <Text style={styles.privateBadgeText}>Privé (non publié)</Text>
          </View>
        )}

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>
          {item.event_date} • {item.location}
        </Text>

        {isAdmin && (
          <View style={styles.adminLinksRow}>
            <TouchableOpacity
              onPress={() => handleSetFeatured(item)}
              style={styles.featureLink}
            >
              <Text style={styles.featureLinkText}>
                {item.is_featured ? "✕ Enlever" : "⭐ Mettre en avant"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => goEdit(item)}
              style={styles.editLink}
            >
              <Text style={styles.editLinkText}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteEvent(item)}
              style={styles.deleteLink}
            >
              <Text style={styles.deleteLinkText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => handleToggleFavorite(item.id)}
        style={styles.heartButton}
      >
        <Ionicons
          name={favoriteIds.includes(item.id) ? "heart" : "heart-outline"}
          size={20}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Événements</Text>

        {isAdmin && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={goCreate}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* HERO ÉVÉNEMENT MIS EN AVANT */}
      {featuredEvent && (
        <View style={styles.heroCard}>
          <Image
            source={
              featuredEvent.image_url
                ? { uri: getImageUrl(featuredEvent.image_url.trim()) }
                : require("../assets/eventscreen.jpeg")
            }
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            {isAdmin && (
              <View style={styles.heroAdminRow}>
                <TouchableOpacity
                  style={styles.heroAdminBtn}
                  onPress={() => handleSetFeatured(featuredEvent)}
                >
                  <Text style={styles.heroAdminBtnText}>✕ Enlever</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroSmallBtn}
                  onPress={() => goEdit(featuredEvent)}
                >
                  <Text style={styles.heroSmallBtnText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.heroSmallBtn, { backgroundColor: 'rgba(153,27,27,0.7)' }]}
                  onPress={() => handleDeleteEvent(featuredEvent)}
                >
                  <Text style={[styles.heroSmallBtnText, { color: '#fecaca' }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}

            {featuredEvent.visibility !== "public" && (
              <View style={styles.heroPrivateTag}>
                <Text style={styles.heroPrivateTagText}>Privé (non publié)</Text>
              </View>
            )}

            <Text style={styles.heroTitle}>{featuredEvent.title}</Text>
            <Text style={styles.heroSubtitle}>
              {featuredEvent.event_date} • {featuredEvent.location}
            </Text>

            <View style={styles.heroFooterRow}>
              {isAdmin && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Événement mis en avant</Text>
                </View>
              )}
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* --- MODALE CONFIRMATION SUPPRESSION --- */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDeleteModal(false)} />
          <View style={styles.deleteModalBox}>
            <Text style={styles.deleteModalTitle}>Supprimer l'événement</Text>
            <Text style={styles.deleteModalText}>
              Es-tu sûr de vouloir supprimer "{eventToDelete?.title}" ?
              {"\n"}Cette action est définitive.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirm}
                onPress={confirmDeleteEvent}
              >
                <Text style={styles.deleteModalConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ffffff" size="large" />
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          
          <View style={{ paddingHorizontal: 0 }}>
            {otherEvents.length > 0 ? (
              otherEvents.map(item => (
                <View key={item.id}>
                  {renderEventCard({ item })}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Aucun événement pour le moment.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    marginTop: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.foreground,
    letterSpacing: -0.5,
  },

  addButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  addText: {
    color: "white",
    fontSize: 28,
    fontWeight: "300",
  },

  /* --- HERO --- */
  heroCard: {
    height: 260,
    marginHorizontal: 20,
    borderRadius: 28,
    marginBottom: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 8, 19, 0.45)",
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "flex-end",
  },
  heroAdminRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  heroAdminBtn: {
    backgroundColor: 'rgba(137,22,203,0.75)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroAdminBtnText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  heroSmallBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroSmallBtnText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#e5e5e5",
    marginBottom: 15,
    opacity: 0.9,
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(137, 22, 203, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(137, 22, 203, 0.5)",
  },
  heroBadgeText: {
    color: COLORS.primaryGlow,
    fontSize: 10,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPrivateTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(234,88,12,0.3)",
    borderWidth: 1,
    borderColor: "#fb923c",
  },
  heroPrivateTagText: {
    color: "#ffedd5",
    fontSize: 10,
    fontWeight: "700",
  },
  heroButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  /* --- CARDS LIST --- */
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 20,
  },
  cardImage: {
    width: 75,
    height: 75,
    borderRadius: 16,
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },

  privateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(234,88,12,0.15)",
    borderWidth: 1,
    borderColor: "rgba(234,88,12,0.4)",
    marginBottom: 6,
  },
  privateBadgeText: {
    color: "#fed7aa",
    fontSize: 9,
    fontWeight: "700",
    textTransform: 'uppercase',
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.foreground,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: COLORS.mutedForeground,
  },

  heartButton: {
    padding: 10,
  },
  featureLinkText: {
    fontSize: 11,
    color: COLORS.primaryGlow,
    fontWeight: '600',
  },
  adminLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
    flexWrap: 'wrap',
  },
  featureLink: {},
  editLink: {},
  deleteLink: {},
  editLinkText: {
    fontSize: 11,
    color: COLORS.mutedForeground,
  },
  deleteLinkText: {
    fontSize: 11,
    color: "#f97373",
  },

  loadingContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.mutedForeground,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },

  /* --- DELETE MODAL --- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "90%",
    maxWidth: 400,
  },
  deleteModalTitle: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteModalText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  deleteModalCancelText: {
    color: COLORS.mutedForeground,
    fontWeight: "700",
    fontSize: 14,
  },
  deleteModalConfirm: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: "#991b1b",
    alignItems: "center",
  },
  deleteModalConfirmText: {
    color: "#fecaca",
    fontWeight: "700",
    fontSize: 14,
  },
});
