# Coloriage en ligne

Livraison du 2 novembre 2026. Atelier web uniquement, sur les images existantes et approuvées du catalogue ; aucun dessin ou contenu de l’app mobile n’est régénéré.

## Parcours

- `/fr/coloriage-en-ligne/` et `/en/online-coloring/` : pages indexables, contenu HTML, exemples, recherche et thèmes.
- Chaque fiche existante propose « Colorier en ligne ». Le fragment `#colorier` ouvre directement l’atelier ; l’URL canonique reste celle du dessin. Pas de deuxième catalogue de milliers de pages concurrentes.
- Crayon texturé, feutre opaque, pinceau translucide, gomme ; 12 couleurs, 3 tailles, zoom et déplacement. Pointer Events pour souris/stylet/doigt. Une seule entrée active ; capture du pointeur, annulation des gestes interrompus.
- Le calque de couleurs est séparé des contours. La gomme ne détruit pas l’original. Export PNG avec fond blanc, couleurs et contours, limité à 1 536 px sur le grand côté pour maîtriser la mémoire mobile.
- 40 gestes annulables par session. Les plus anciens restent dans le dessin. IndexedDB conserve les couleurs par URL d’image, commune aux versions FR/EN ; reprise sans historique de gestes après rechargement. Les erreurs de stockage sont visibles et n’empêchent pas l’export.
- Aucune image coloriée n’est transmise au serveur. Pas de compte, d’achat ou de publicité ajouté dans l’atelier. Le PDF vierge et les recommandations de la fiche sont conservés.

## SEO et mesure

Intention principale FR : « coloriage en ligne gratuit », complétée par « colorier à la souris », « coloriage au doigt » et « coloriage sur tablette ». EN : « free online coloring pages ». Titres, H1 et contenu décrivent les fonctions réellement livrées.

Liens HTML depuis navigation, accueil, catégories et fiches ; liens directs depuis le hub vers l’atelier de chaque exemple. Canonical propre à chaque langue, hreflang réciproque FR/EN/x-default, inclusion au sitemap XML. Données structurées CollectionPage / ItemList / WebApplication sans notes ou avis inventés. Les fiches à imprimer conservent leur URL et leur titre principal.

Le moteur de dessin est importé à l’ouverture uniquement. Les événements utilisent le garde de consentement existant et excluent les sessions de recette `?colotopia_test=1` :

| Événement | Déclenchement |
| --- | --- |
| `coloring_online_open` | Ouverture de l’atelier |
| `coloring_online_start` | Premier trait confirmé de la session |
| `coloring_online_complete` | Aperçu final PNG préparé avec succès |
| `coloring_online_download` | Appui sur le téléchargement PNG |

Un téléchargement est une intention d’enregistrer, pas une preuve d’impression ni de vente. Aucun suivi des coordonnées, des couleurs ou de chaque geste.

Hypothèse : une activité utilisable immédiatement attire des recherches dédiées et augmente les usages des dessins. Référence avant publication : aucune page dédiée ni ces quatre événements sur le site. Première fenêtre d’observation SEO : 2–15 novembre, bilan au plus tôt le 16 novembre, en tenant compte du délai d’indexation et du faible trafic. Comparer entrées organiques du hub, requêtes correspondantes, démarrages puis exports ; pas seulement les ouvertures. Aucune promesse de classement ou de trafic.

## Recette

Contrôles locaux réalisés : 139 tests réussis ; Astro check sans erreur ni avertissement ; export PNG réel 1 086 × 1 536, annuler/rétablir, gomme conservant les contours, reprise après rechargement et passage FR/EN. Rendus examinés en navigateur à 1 280 × 800, 390 × 844, 320 × 568 et 667 × 375. Une collision de grille en paysage a été corrigée puis revue. Aucun essai sur téléphone physique.


`npm test` vérifie notamment la correspondance des coordonnées à différentes tailles/zooms, l’historique borné, les liens et hreflang. `npm run build` exécute Astro check et la vérification complète du site généré (liens, ancres, sitemaps, canonical, hreflang, JSON-LD).

Avant publication : navigateur bureau et formats mobiles, trait, gomme, annuler/rétablir, reprise après rechargement, export PNG réel, zoom/déplacement, fermeture et retour à la navigation, PDF vierge. Après publication : recharger un onglet de l’ancienne version puis refaire le parcours. Les essais de navigateur ne constituent pas une recette sur appareil physique ; consigner cette limite dans le bilan de livraison.

Références : [liens explorables par Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events).
