require('dotenv').config();
const { query } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  if (!process.env.DB_PASSWORD) {
    console.error('ERREUR: DB_PASSWORD est indéfini. Vérifiez votre fichier .env ou vos variables d\'environnement Docker.');
    process.exit(1);
  }
  console.log('--- Démarrage de l\'injection de données ---');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const mockUsers = [
    { name: 'Jean Vitesse', email: 'jean@speednation.fr', profession: 'Pilote Pro', location: 'Paris', age: 28 },
    { name: 'Sarah Drift', email: 'sarah@speednation.fr', profession: 'Designer Auto', location: 'Lyon', age: 24 },
    { name: 'Marc Turbo', email: 'marc@speednation.fr', profession: 'Mécanicien', location: 'Marseille', age: 35 },
    { name: 'Léa Gt', email: 'lea@speednation.fr', profession: 'Photographe', location: 'Bordeaux', age: 22 },
    { name: 'Pierre Quattro', email: 'pierre@speednation.fr', profession: 'Ingénieur', location: 'Lille', age: 41 }
  ];

  const carData = [
    { name: 'M3 Competition', brand: 'BMW', model: 'M3 G80', year: 2023, price: 115000, power: 510, image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=800' },
    { name: '911 GT3 RS', brand: 'Porsche', model: '992 GT3 RS', year: 2024, price: 250000, power: 525, image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800' },
    { name: 'Golf 8 R', brand: 'Volkswagen', model: 'Golf 8 R', year: 2022, price: 60000, power: 320, image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800' },
    { name: 'RS6 Avant', brand: 'Audi', model: 'C8 RS6', year: 2023, price: 145000, power: 600, image: 'https://images.unsplash.com/photo-1606152421649-d2d7119e55a7?q=80&w=800' },
    { name: 'Huracan STO', brand: 'Lamborghini', model: 'Huracan', year: 2022, price: 350000, power: 640, image: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?q=80&w=800' }
  ];

  const events = [
    { title: 'Rassemblement Nocturne', location: 'Trocadéro, Paris', date: '2026-06-15', description: 'Rasso de nuit pour les passionnés de sportives.', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800' },
    { title: 'Track Day Circuit', location: 'Circuit du Castellet', date: '2026-07-20', description: 'Journée circuit ouverte à tous niveaux.', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=800' },
    { title: 'Roadtrip Alpes', location: 'Chamonix', date: '2026-08-10', description: 'Traversée des cols mythiques des Alpes.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800' }
  ];

  try {
    for (const mock of mockUsers) {
      console.log(`Création de l'utilisateur: ${mock.email}`);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [mock.email]);
      let userId;

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        console.log(`Utilisateur ${mock.email} existe déjà, mise à jour du profil.`);
      } else {
        const newUser = await query(
          'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
          [mock.email, passwordHash]
        );
        userId = newUser.rows[0].id;
      }

      // Création du profil
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(mock.name)}&background=random&color=fff&size=200`;
      await query(
        `INSERT INTO profiles (id, full_name, profession, location, age, avatar_url) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
         full_name = EXCLUDED.full_name, 
         profession = EXCLUDED.profession, 
         location = EXCLUDED.location, 
         age = EXCLUDED.age, 
         avatar_url = EXCLUDED.avatar_url`,
        [userId, mock.name, mock.profession, mock.location, mock.age, avatarUrl]
      );

      // Ajout de 1-2 voitures aléatoires
      const numCars = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numCars; i++) {
        const car = carData[Math.floor(Math.random() * carData.length)];
        console.log(`Ajout de la voiture ${car.name} à ${mock.name}`);
        await query(
          `INSERT INTO cars (user_id, name, brand, model, year, price_purchased, power_hp, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, car.name, car.brand, car.model, car.year, car.price, car.power, car.image]
        );
      }
    }

    // Ajout des événements
    for (const ev of events) {
      console.log(`Création de l'événement: ${ev.title}`);
      // On prend le premier utilisateur comme créateur par défaut
      const creator = await query('SELECT id FROM users LIMIT 1');
      if (creator.rows.length > 0) {
        await query(
          `INSERT INTO events (creator_id, title, location, event_date, description, visibility, image_url) 
           VALUES ($1, $2, $3, $4, $5, 'public', $6)`,
          [creator.rows[0].id, ev.title, ev.location, ev.date, ev.description, ev.image]
        );
      }
    }

    console.log('--- Injection terminée avec succès ---');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l\'injection:', err);
    process.exit(1);
  }
}

seed();
