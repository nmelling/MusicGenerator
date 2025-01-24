import {
  pgSchema,
} from "drizzle-orm/pg-core";

export const authSchema = pgSchema('auth');

/*
  1. Admin.
    - Gestion du site avec création de nouvelles catégories de musique/formulaires/questions
    - Modification facile des prompts lié à une catégorie musicale
    - Désactivation d'une catégorie

  2. Définir si utilisateur standard peut s'inscrire ou non le site pour suivre ses commandes
*/
