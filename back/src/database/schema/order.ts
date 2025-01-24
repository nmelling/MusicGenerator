import {
  pgSchema,
} from "drizzle-orm/pg-core";

export const orderSchema = pgSchema('order');

/*
  Une commande contient:
    - une liste de réponses aux question de formulaire
    - un email de destination
    - un identifiant unique
    - (a voir plus tard) une preuve de paiement ou autre

*/