# MusicGenerator

## Description

Site de création de musique générée automatiquement via IA.

## Technos

Back

- Bun
- Hono
- Drizzle
- Zod
- PostGreSQL

Front

- VueJs 3
- HonoClient

## Ressources

- [Site exemple](https://mymusic-studio.com/products/creer-votre-chanson-personnalisee)
- [Anthropic](https://docs.anthropic.com/fr/home)
- [Suno](https://suno.com/)
- [Site final](https://www.personalia.ai/)

## Fonctionnement

### Déroulé global d'une génération de musique 

1. Sélection d'une catégorie de musique
2. Remplissage d'un formulaire
3. Appel API Anthropic pour génération des paroles
4. Appel API Suno pour génération de la musique
5. Transmission de la musique générée à l'utilisateur

## Etapes

Dev

- [ ] Installer un linter
- [ ] Installer un logger

Prototypage

- [x] Génération des paroles avec Claude
- [x] Installation de la base de données
- [ ] Définition du schéma de DB
- [ ] Stockage de quelques config de formulaires avec prompt IA etc..
- [ ] Utilisation d'une référence de config pour génération des lyrics
    - Validation Zod
    - Faire remonter le typage du formulaire avec Drizzle



