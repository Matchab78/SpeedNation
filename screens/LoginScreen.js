import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from "react-native";
import { authService } from "../services/authService";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre mot de passe");
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer un email valide");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authService.signIn(email.trim(), password);

      if (error) {
        // Gérer les erreurs spécifiques
        let errorMessage = "Erreur de connexion";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou mot de passe incorrect";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter";
        } else {
          errorMessage = error.message || "Une erreur est survenue";
        }

        Alert.alert("Erreur", errorMessage);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Connexion réussie - Supabase gère automatiquement la persistance de session
        // La session est stockée localement et persiste entre les redémarrages
        Alert.alert("Succès", "Connexion réussie !", [
          {
            text: "OK",
            onPress: () => {
              // Retourner à l'écran précédent
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur inattendue est survenue");
      console.error("Erreur de connexion:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/logincar.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>SpeedNation</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              returnKeyType="next"
              style={styles.input}
            />

            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#888"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
              style={styles.input}
            />

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "white",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backText: {
    color: "white",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 18,
    padding: 20,
    marginTop: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "white",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "white",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  loginButton: {
    backgroundColor: "#000000ff",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

