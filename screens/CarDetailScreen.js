import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { carService } from "../services/carService";
import { supabase } from "../config/supabase";

export default function CarDetailScreen({ route, navigation }) {
  const { carId, imageUrl } = route.params || {};

  const [car, setCar] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!carId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await carService.getCarById(carId);
      if (!mounted) return;

      if (error) {
        console.log("getCarById error:", error);
        setCar(null);
      } else {
        setCar(data);
        if (data?.user_id) {
          const { data: ownerData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", data.user_id)
            .maybeSingle();
          if (mounted) setOwner(ownerData || null);
        } else {
          setOwner(null);
        }
      }
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [carId]);

  const displayImage = car?.image_url || imageUrl;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8916CB" />
        </View>
      ) : !car && !displayImage ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Détails indisponibles</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car-sport" size={48} color="#666" />
            </View>
          )}

          {!!car?.name && <Text style={styles.title}>{car.name}</Text>}

          <View style={styles.metaBox}>
            {!!car?.brand && !!car?.model && (
              <Text style={styles.metaText}>{car.brand} {car.model}</Text>
            )}
            {!!car?.year && <Text style={styles.metaText}>Année: {car.year}</Text>}
            {!!car?.power_hp && <Text style={styles.metaText}>Puissance: {car.power_hp} ch</Text>}
            {!!car?.price_purchased && (
              <Text style={styles.metaText}>Prix: {Number(car.price_purchased).toLocaleString("fr-FR")} €</Text>
            )}
          </View>

          {!!owner?.full_name && (
            <Text style={styles.ownerText}>Ajoutée par: {owner.full_name}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", fontSize: 16 },
  content: { padding: 16, paddingBottom: 30 },
  image: { width: "100%", height: 360, borderRadius: 18, backgroundColor: "#111" },
  imagePlaceholder: {
    width: "100%",
    height: 360,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 14 },
  metaBox: {
    marginTop: 12,
    backgroundColor: "#0f0f0f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    padding: 14,
    gap: 6,
  },
  metaText: { color: "#ddd", fontSize: 14 },
  ownerText: { color: "#888", marginTop: 14 },
});
