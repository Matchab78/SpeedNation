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

const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const goHome = () => {
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Tabs" }],
      });
    }, 100);
  };

  const handleLogin = async () => {
    if (!email.trim()) { showAlert("Erreur", "Veuillez entrer votre email"); return; }
    if (!password.trim()) { showAlert("Erreur", "Veuillez entrer votre mot de passe"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showAlert("Erreur", "Veuillez entrer un email valide"); return; }

    setLoading(true);
    try {
      const { error } = await authService.signIn(email.trim(), password);

      if (error) {
        let msg = "Erreur de connexion";
        if (error.message?.includes("Invalid login credentials")) msg = "Email ou mot de passe incorrect";
        else if (error.message?.includes("Email not confirmed")) msg = "Veuillez confirmer votre email";
        else msg = error.message || "Une erreur est survenue";
        showAlert("Erreur", msg);
        return;
      }

      goHome();
    } catch (e) {
      showAlert("Erreur", "Une erreur inattendue est survenue");
      console.error("Erreur de connexion:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim()) { showAlert("Erreur", "Veuillez entrer votre email"); return; }
    if (!password.trim()) { showAlert("Erreur", "Veuillez entrer un mot de passe"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showAlert("Erreur", "Veuillez entrer un email valide"); return; }
    if (password.length < 6) { showAlert("Erreur", "Le mot de passe doit contenir au moins 6 caractères"); return; }

    setLoading(true);
    try {
      const { error } = await authService.signUp(email.trim(), password, {});

      if (error) {
        showAlert("Erreur", error.message || "Une erreur est survenue lors de la création du compte");
        return;
      }

      goHome();
    } catch (e) {
      showAlert("Erreur", "Une erreur inattendue est survenue");
      console.error("Erreur d'inscription:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { showAlert("Email requis", "Renseigne ton email puis réessaie."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showAlert("Erreur", "Veuillez entrer un email valide"); return; }

    setLoading(true);
    try {
      const { error } = await authService.resetPassword(email.trim());
      if (error) { showAlert("Erreur", error.message || "Impossible d'envoyer l'email"); return; }
      showAlert("Email envoyé", "Un lien de réinitialisation a été envoyé si le compte existe.");
    } catch (e) {
      showAlert("Erreur", "Une erreur inattendue est survenue");
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
            <Text style={styles.cardTitle}>
              {isSignUpMode ? "Créer un compte" : "Connexion"}
            </Text>

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
              onSubmitEditing={isSignUpMode ? handleSignUp : handleLogin}
              returnKeyType="done"
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {isSignUpMode ? "Créer un compte" : "Se connecter"}
                </Text>
              )}
            </TouchableOpacity>

            {!isSignUpMode && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>
                {isSignUpMode ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUpMode((prev) => !prev)} disabled={loading}>
                <Text style={styles.switchAuthLink}>
                  {isSignUpMode ? "Se connecter" : "Créer un compte"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "white" },
  backButton: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: "white", backgroundColor: "rgba(0,0,0,0.4)" },
  backText: { color: "white", fontWeight: "500" },
  card: { backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 18, padding: 20, marginTop: 40 },
  cardTitle: { fontSize: 22, fontWeight: "600", color: "white", marginBottom: 20 },
  input: { backgroundColor: "#111", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "white", marginBottom: 14, borderWidth: 1, borderColor: "#333" },
  loginButton: { backgroundColor: "#000000ff", paddingVertical: 12, borderRadius: 20, alignItems: "center", marginTop: 10 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  forgotPasswordButton: { marginTop: 14, alignItems: "center" },
  forgotPasswordText: { color: "#cccccc", fontSize: 14, textDecorationLine: "underline" },
  switchAuthRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 18 },
  switchAuthText: { color: "#cccccc", fontSize: 14, marginRight: 6 },
  switchAuthLink: { color: "#ffffff", fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});