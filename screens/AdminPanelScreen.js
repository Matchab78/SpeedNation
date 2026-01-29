import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { supabase } from "../config/supabase";

export default function AdminPanelScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    cars: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [{ count: usersCount }, { count: eventsCount }, { count: carsCount }] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("events").select("id", { count: "exact", head: true }),
            supabase.from("cars").select("id", { count: "exact", head: true }),
          ]);

        setStats({
          users: usersCount || 0,
          events: eventsCount || 0,
          cars: carsCount || 0,
        });
      } catch (e) {
        console.log("loadStats error", e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel administrateur</Text>
        <Text style={styles.subtitle}>
          Vue d'ensemble de l'activité de l'application
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Utilisateurs inscrits</Text>
              <Text style={styles.cardValue}>{stats.users}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Événements</Text>
              <Text style={styles.cardValue}>{stats.events}</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Voitures publiées</Text>
              <Text style={styles.cardValue}>{stats.cars}</Text>
            </View>
          </View>

          <Text style={styles.soonText}>
            D'autres métriques utiles pour les administrateurs pourront être ajoutées ici
            plus tard (engagement, participation aux événements, etc.).
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: 40,
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardLabel: {
    color: "#9ca3af",
    fontSize: 13,
  },
  cardValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },
  soonText: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 24,
  },
});
