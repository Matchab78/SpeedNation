import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { useAuth } from "../utils/authContext";
import { eventService } from "../services/eventService";
import { storageService } from "../services/storageService";

export default function EventFormScreen({ navigation, route }) {
  const { user, isAdmin } = useAuth();

  const initialEvent = route?.params?.event || null;
  const mode = route?.params?.mode || (initialEvent ? "edit" : "create");

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [date, setDate] = useState(initialEvent?.event_date || "");
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [isPublic, setIsPublic] = useState(
    (initialEvent?.visibility || "private") === "public"
  );
  const [makeFeatured, setMakeFeatured] = useState(!!initialEvent?.is_featured);
  const [selectedImage, setSelectedImage] = useState(null);

  const previewImageSource = useMemo(() => {
    if (selectedImage?.uri) return { uri: selectedImage.uri };
    if (initialEvent?.image_url) return { uri: initialEvent.image_url.trim() };
    return require("../assets/eventscreen.jpeg");
  }, [selectedImage, initialEvent]);

  const guardAdmin = () => {
    if (!user || !isAdmin) {
      Alert.alert("Accès refusé", "Seuls les administrateurs peuvent effectuer cette action");
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    if (!guardAdmin()) return;

    const result = await storageService.pickImageFromGallery();
    if (result.cancelled) {
      if (result.error) Alert.alert("Erreur", result.error);
      return;
    }
    setSelectedImage({ uri: result.uri });
  };

  const handleSave = async () => {
    if (!guardAdmin()) return;

    if (!title.trim() || !date.trim() || !location.trim()) {
      Alert.alert("Champs requis", "Titre, date et lieu sont obligatoires");
      return;
    }

    setSaving(true);

    try {
      let eventId = initialEvent?.id || null;
      let createdEvent = null;

      if (mode === "create") {
        const { data, error } = await eventService.createEvent(user.id, {
          title: title.trim(),
          description: description.trim() || null,
          event_date: date.trim(), // YYYY-MM-DD
          event_time: null,
          location: location.trim(),
          image_url: null,
          visibility: isPublic ? "public" : "private",
        });

        if (error) {
          Alert.alert("Erreur", error.message || "Impossible de créer l'événement");
          return;
        }

        createdEvent = data;
        eventId = data?.id;
      } else {
        const updates = {
          title: title.trim(),
          description: description.trim() || null,
          event_date: date.trim(),
          location: location.trim(),
          visibility: isPublic ? "public" : "private",
        };

        const { error } = await eventService.updateEvent(initialEvent.id, user.id, updates);
        if (error) {
          Alert.alert("Erreur", error.message || "Impossible de modifier l'événement");
          return;
        }
        eventId = initialEvent.id;
      }

      // Upload image (si sélectionnée)
      if (eventId && selectedImage?.uri) {
        const { url, error: uploadError } = await storageService.uploadEventImage(
          eventId,
          selectedImage.uri
        );
        if (uploadError) {
          console.error("Erreur upload image événement:", uploadError);
        } else if (url) {
          const { error: updateImageError } = await eventService.updateEvent(
            eventId,
            user.id,
            { image_url: url }
          );
          if (updateImageError) {
            console.error("Erreur update image_url:", updateImageError);
          }
        }
      }

      // Featured
      const wasFeatured = !!initialEvent?.is_featured;
      if (makeFeatured && !wasFeatured && eventId) {
        const { error } = await eventService.setFeaturedEvent(eventId);
        if (error) console.error("Erreur setFeaturedEvent:", error);
      } else if (!makeFeatured && wasFeatured) {
        const { error } = await eventService.clearFeaturedEvent();
        if (error) console.error("Erreur clearFeaturedEvent:", error);
      }

      // Retour + refresh
      navigation.navigate("EventsHome", { refresh: true, createdEvent });
    } catch (err) {
      console.error("Erreur save EventFormScreen:", err);
      Alert.alert("Erreur", "Une erreur inattendue est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Retour</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === "edit" ? "Modifier" : "Créer"} un événement
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.previewCard}>
            <Image
              source={previewImageSource}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {isAdmin && (
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={handlePickImage}
                disabled={saving}
              >
                <Text style={styles.changeImageText}>
                  {selectedImage ? "Changer l’image" : "Choisir une image"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Salon de l'Automobile"
              placeholderTextColor="#777"
              editable={!saving}
            />

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="Ex: 2026-05-25"
              placeholderTextColor="#777"
              editable={!saving}
            />

            <Text style={styles.label}>Lieu</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Paris"
              placeholderTextColor="#777"
              editable={!saving}
            />

            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décris l'événement…"
              placeholderTextColor="#777"
              editable={!saving}
              multiline
            />

            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  !isPublic && styles.visibilityOptionActive,
                ]}
                onPress={() => setIsPublic(false)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.visibilityOptionText,
                    !isPublic && styles.visibilityOptionTextActive,
                  ]}
                >
                  Privé
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  isPublic && styles.visibilityOptionActive,
                ]}
                onPress={() => setIsPublic(true)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.visibilityOptionText,
                    isPublic && styles.visibilityOptionTextActive,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.rowToggle}
              onPress={() => setMakeFeatured((p) => !p)}
              disabled={saving}
            >
              <View style={[styles.checkbox, makeFeatured && styles.checkboxChecked]} />
              <Text style={styles.rowToggleText}>Mettre cet événement en avant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120, // laisse de la place pour le bouton "Enregistrer" au-dessus de la barre
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#444",
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 56,
  },
  previewCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: 190,
  },
  changeImageButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#111",
  },
  changeImageText: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 16,
  },
  label: {
    color: "#d4d4d4",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2b2b2b",
  },
  textarea: {
    height: 90,
    textAlignVertical: "top",
  },
  rowToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  rowToggleText: {
    color: "#fff",
    fontSize: 13,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#a855f7",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#a855f7",
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2b2b2b",
    alignItems: "center",
    backgroundColor: "#18181b",
  },
  visibilityOptionActive: {
    borderColor: "#a855f7",
    backgroundColor: "#1f172a",
  },
  visibilityOptionText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  visibilityOptionTextActive: {
    color: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#8916CB",
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

