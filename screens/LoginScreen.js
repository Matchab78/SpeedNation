import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "../services/authService";

const { width } = Dimensions.get("window");

const COLORS = {
  background: "#0B0813",
  surface: "#16121F",
  surfaceElevated: "#1E1A2B",
  border: "rgba(80, 70, 110, 0.4)",
  borderFocus: "rgba(137, 22, 203, 0.6)",
  foreground: "#FAFAFA",
  mutedForeground: "#9B95AE",
  primary: "#8916CB",
  primaryGlow: "#A855F7",
};

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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [step, setStep] = useState("login"); // login, reset
  const [tempUserId, setTempUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
      const { data, error } = await authService.signIn(email.trim(), password);

      if (error) {
        let msg = "Erreur de connexion";
        if (error.message?.includes("Identifiants invalides")) msg = "Email ou mot de passe incorrect";
        else msg = error.message || "Une erreur est survenue";
        showAlert("Erreur", msg);
        return;
      }

      if (data?.user?.must_change_password) {
        setTempUserId(data.user.id);
        setStep("reset");
        showAlert("Sécurité", "Votre mot de passe a été réinitialisé. Veuillez en créer un nouveau.");
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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { showAlert("Erreur", "Le mot de passe doit faire au moins 6 caractères"); return; }
    if (newPassword !== confirmPassword) { showAlert("Erreur", "Les mots de passe ne correspondent pas"); return; }

    setLoading(true);
    try {
      const { success, error } = await authService.changePassword(tempUserId, newPassword);
      if (success) {
        showAlert("Succès", "Mot de passe mis à jour ! Connectez-vous maintenant.");
        setStep("login");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showAlert("Erreur", error?.message || "Impossible de changer le mot de passe");
      }
    } catch (e) {
      showAlert("Erreur", "Une erreur est survenue");
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
    <View style={styles.container}>
      {/* Background décoratif */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="speedometer" size={36} color="#fff" />
            </View>
            <Text style={styles.brandName}>SpeedNation</Text>
            <Text style={styles.brandTagline}>La communauté des passionnés</Text>
          </View>

          {/* Carte principale */}
          <View style={styles.card}>
            {/* Tab selector (login / signup) */}
            {step === "login" && (
              <View style={styles.tabSelector}>
                <TouchableOpacity
                  style={[styles.tabBtn, !isSignUpMode && styles.tabBtnActive]}
                  onPress={() => setIsSignUpMode(false)}
                  disabled={loading}
                >
                  <Text style={[styles.tabBtnText, !isSignUpMode && styles.tabBtnTextActive]}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, isSignUpMode && styles.tabBtnActive]}
                  onPress={() => setIsSignUpMode(true)}
                  disabled={loading}
                >
                  <Text style={[styles.tabBtnText, isSignUpMode && styles.tabBtnTextActive]}>Créer un compte</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === "reset" && (
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Nouveau mot de passe</Text>
                <Text style={styles.cardSubtitle}>Définissez un nouveau mot de passe sécurisé</Text>
              </View>
            )}

            {step === "login" ? (
              <>
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Adresse email"
                      placeholderTextColor={COLORS.mutedForeground}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                      returnKeyType="next"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Mot de passe"
                      placeholderTextColor={COLORS.mutedForeground}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                      onSubmitEditing={isSignUpMode ? handleSignUp : handleLogin}
                      returnKeyType="done"
                      style={styles.input}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={isSignUpMode ? handleSignUp : handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isSignUpMode ? "Créer mon compte" : "Se connecter"}
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
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Nouveau mot de passe"
                      placeholderTextColor={COLORS.mutedForeground}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                      editable={!loading}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor={COLORS.mutedForeground}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!loading}
                      style={styles.input}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep("login")}
                  disabled={loading}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Retour */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={16} color={COLORS.mutedForeground} />
            <Text style={styles.backText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  bgGlow1: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(137,22,203,0.12)',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    paddingTop: 80, 
    paddingBottom: 50,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.foreground,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 14,
    color: COLORS.mutedForeground,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBtnText: {
    color: COLORS.mutedForeground,
    fontWeight: '600',
    fontSize: 14,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
  inputGroup: {
    gap: 14,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonDisabled: { 
    opacity: 0.6,
    shadowOpacity: 0,
  },
  primaryButtonText: { 
    color: "white", 
    fontWeight: "700", 
    fontSize: 16,
    letterSpacing: 0.3,
  },
  forgotPasswordButton: { 
    marginTop: 16, 
    alignItems: "center",
    paddingVertical: 4,
  },
  forgotPasswordText: { 
    color: COLORS.mutedForeground, 
    fontSize: 14,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 6,
  },
  backText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
  },
});