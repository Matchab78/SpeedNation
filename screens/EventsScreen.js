import React, { useEffect, useMemo, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { eventService } from "../services/eventService";
import { useAuth } from "../utils/authContext";

export default function EventsScreen({ navigation }) {
  const { user, isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

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
      // Rafraîchir les données à chaque fois que l'écran obtient le focus
      setRefreshTick(prev => prev + 1);
    });

    // Écouter les paramètres de navigation pour le rafraîchissement
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      // Vérifier si on revient du formulaire avec une demande de rafraîchissement
      if (e.data?.action?.type === 'NAVIGATE' && e.data?.action?.payload?.params?.refresh) {
        setRefreshTick(prev => prev + 1);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeBeforeRemove();
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
    // Ajouter un identifiant unique pour forcer le rafraîchissement au retour
    key: Date.now()
  });
  
  const goEdit = (event) => navigation.navigate("EventForm", { 
    mode: "edit", 
    event,
    // Ajouter un identifiant unique pour forcer le rafraîchissement au retour
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

    Alert.alert(
      "Supprimer l'événement",
      `Es-tu sûr de vouloir supprimer "${event.title}" ? Cette action est définitive.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await eventService.deleteEvent(event.id, user.id);
              if (error) {
                console.error("Erreur deleteEvent:", error);
                Alert.alert(
                  "Erreur",
                  error.message || "Impossible de supprimer l'événement"
                );
                return;
              }

              setEvents((prev) => prev.filter((e) => e.id !== event.id));
            } catch (err) {
              console.error("Erreur inattendue deleteEvent:", err);
              Alert.alert("Erreur", "Une erreur inattendue est survenue");
            }
          },
        },
      ]
    );
  };

  const handleSetFeatured = async (event) => {
    if (!isAdmin) return;

    try {
      // Si déjà mis en avant, on enlève la mise en avant
      if (event.is_featured) {
        const { error } = await eventService.clearFeaturedEvent(event.id);
        if (error) {
          console.error("Erreur clearFeaturedEvent:", error);
          Alert.alert(
            "Erreur",
            error.message || "Impossible d'enlever la mise en avant"
          );
          return;
        }
      } else {
        const { error } = await eventService.setFeaturedEvent(event.id);
        if (error) {
          console.error("Erreur setFeaturedEvent:", error);
          Alert.alert(
            "Erreur",
            error.message || "Impossible de mettre cet événement en avant"
          );
          return;
        }
      }

      // Recharger la liste pour refléter le nouvel événement mis en avant
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
            ? { uri: item.image_url.trim() }
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
                {item.is_featured ? "Enlever la mise en avant" : "Mettre en avant"}
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
          color={favoriteIds.includes(item.id) ? "#ffffff" : "#ffffff"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>

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
                ? { uri: featuredEvent.image_url.trim() }
                : require("../assets/eventscreen.jpeg")
            }
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.heroEditLink}
                onPress={() => goEdit(featuredEvent)}
              >
                <Text style={styles.heroEditText}>Modifier</Text>
              </TouchableOpacity>
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
                <Text style={styles.heroButtonText}>S’inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Création/édition déplacées vers un écran dédié */}

      {/* LISTE */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={otherEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aucun événement pour le moment.
            </Text>
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },

  addButton: {
    backgroundColor: "#000000ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: -2
  },

  /* --- HERO --- */
  heroCard: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 24,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  heroOverlay: {
    flex: 1,
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: "space-between",
  },
  heroEditLink: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  heroEditText: {
    fontSize: 12,
    color: "#e5e5e5",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#e5e5e5",
  },
  heroFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  heroBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  heroPrivateTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(234,88,12,0.24)",
    borderWidth: 1,
    borderColor: "#fb923c",
    marginBottom: 6,
  },
  heroPrivateTagText: {
    color: "#ffedd5",
    fontSize: 11,
    fontWeight: "600",
  },
  heroButton: {
    backgroundColor: "#8916CB",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  /* --- CARDS LIST --- */
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },

  privateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(234,88,12,0.18)",
    borderWidth: 1,
    borderColor: "#ea580c",
    marginBottom: 4,
  },
  privateBadgeText: {
    color: "#fed7aa",
    fontSize: 10,
    fontWeight: "600",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#d4d4d4",
  },

  heartButton: {
    padding: 8,
  },
  featureLink: {
    marginTop: 4,
  },
  featureLinkText: {
    fontSize: 11,
    color: "#a855f7",
  },
  adminLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 12,
  },
  editLink: {
    marginTop: 0,
  },
  editLinkText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  deleteLink: {
    marginTop: 0,
  },
  deleteLinkText: {
    fontSize: 11,
    color: "#f97373",
  },

  // (styles de création/édition déplacés vers EventFormScreen)

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#ffffff",
    textAlign: "center",
    marginTop: 40,
  },

});
