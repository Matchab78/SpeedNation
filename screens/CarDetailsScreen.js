import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase/supabase";

export default function CarDetailsScreen({ route, navigation }) {
  const { carId } = route.params;

  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState(null);

  useEffect(() => {
    loadCar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const loadCar = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("cars")
      .select("id, image_url, name, brand, model, year, price_purchased, power_hp, created_at")
      .eq("id", carId)
      .single();

    if (error) {
      console.log("loadCar error:", error);
      setCar(null);
      setLoading(false);
      return;
    }

    setCar(data);
    setLoading(false);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Voiture introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff" }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.headerBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Image */}
        {car.image_url ? (
          <Image source={{ uri: car.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ color: "#777" }}>Pas d’image</Text>
          </View>
        )}

        {/* Infos */}
        <View style={styles.card}>
          <Text style={styles.title}>{car.name || "Voiture"}</Text>

          <Text style={styles.line}>
            <Text style={styles.label}>Marque :</Text> {car.brand || "—"}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Modèle :</Text> {car.model || "—"}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Année :</Text> {car.year || "—"}
          </Text>

          <View style={styles.sep} />

          <Text style={styles.line}>
            <Text style={styles.label}>Prix :</Text> {formatPrice(car.price_purchased)}
          </Text>
          <Text style={styles.line}>
            <Text style={styles.label}>Puissance :</Text> {car.power_hp ? `${car.power_hp} ch` : "—"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },

  header: { paddingTop: 55, paddingHorizontal: 16, paddingBottom: 10 },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  headerBtnText: { color: "#fff", fontSize: 14 },

  image: { width: "100%", height: 320, backgroundColor: "#111" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#0f0f0f",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#222",
    padding: 16,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 10 },
  line: { color: "#bbb", fontSize: 15, marginTop: 6 },
  label: { color: "#fff", fontWeight: "700" },
  sep: { height: 1, backgroundColor: "#222", marginVertical: 14 },

  backBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#222",
  },
});
