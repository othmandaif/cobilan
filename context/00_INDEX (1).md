# Documentation API CoBilan — ERPNext Headless

> Documentation complète des API ERPNext pour le frontend React de CoBilan  
> **Version ERPNext :** 15  
> **Pays :** Maroc | **Devise :** MAD  
> **Base URL :** `http://localhost:8080`  
> **Dernière mise à jour :** Janvier 2024

---

## Structure de la documentation

| Fichier | Contenu |
|---------|---------|
| `01_authentification.md` | Login, logout, session, CSRF token, API Key |
| `02_clients_fournisseurs.md` | CRUD clients, fournisseurs, adresses, contacts |
| `03_ventes_facturation.md` | Factures vente, commandes, devis, paiements reçus |
| `04_achats.md` | Factures achat, commandes, réceptions, paiements fournisseurs |
| `05_comptabilite.md` | Plan comptable, écritures, grand livre, bilan, TVA |
| `06_articles_catalogue.md` | Articles/services, groupes, prix, taxes |
| `07_rapports_analytics.md` | Tous les rapports financiers et tableaux de bord |
| `08_systeme_configuration.md` | Société, utilisateurs, rôles, fichiers, banques |
| `09_integration_react.md` | Client Axios, services, hooks, contexte auth |
| `10_avoirs_retenues_paiements.md` | Notes de crédit/débit, retenues à la source Maroc, conditions de paiement, lettrage |
| `11_outils_comptables_avances.md` | Clôture de période, amortissements, abonnements, relances, multi-devises, budgets |
| `12_projets_frais_rh.md` | Projets, feuilles de temps, notes de frais, employés, paie, congés |
| `13_impression_emails_webhooks.md` | PDF, formats d'impression, emails, webhooks, recherche, ToDo, commentaires |
| `14_paiements_banque_crm_prix.md` | Modes de paiement (chèque/virement/LCN), import relevés bancaires, ouverture de soldes, relevés clients, règles de prix, CRM (leads/opportunités), CGV |

---

## Référence rapide — Endpoints essentiels

### Authentification
```
POST   /api/method/login
GET    /api/method/logout
GET    /api/method/frappe.auth.get_logged_user
GET    /api/method/frappe.auth.get_csrf_token
```

### Clients
```
GET    /api/resource/Customer
GET    /api/resource/Customer/{name}
POST   /api/resource/Customer
PUT    /api/resource/Customer/{name}
DELETE /api/resource/Customer/{name}
```

### Fournisseurs
```
GET    /api/resource/Supplier
GET    /api/resource/Supplier/{name}
POST   /api/resource/Supplier
PUT    /api/resource/Supplier/{name}
```

### Factures de vente
```
GET    /api/resource/Sales Invoice
GET    /api/resource/Sales Invoice/{name}
POST   /api/resource/Sales Invoice
PUT    /api/resource/Sales Invoice/{name}
POST   /api/resource/Sales Invoice/{name}/submit
POST   /api/resource/Sales Invoice/{name}/cancel
DELETE /api/resource/Sales Invoice/{name}
```

### Factures d'achat
```
GET    /api/resource/Purchase Invoice
GET    /api/resource/Purchase Invoice/{name}
POST   /api/resource/Purchase Invoice
POST   /api/resource/Purchase Invoice/{name}/submit
POST   /api/resource/Purchase Invoice/{name}/cancel
```

### Comptabilité
```
GET    /api/resource/Account
GET    /api/resource/Journal Entry
POST   /api/resource/Journal Entry
POST   /api/resource/Payment Entry
```

### Rapports
```
POST   /api/method/frappe.desk.query_report.run   (tous les rapports)
```

---

## Pattern général des requêtes

### Lister avec filtres et pagination
```
GET /api/resource/{DocType}
    ?fields=["champ1","champ2"]
    &filters=[["champ","=","valeur"]]
    &limit_page_length=20
    &limit_start=0
    &order_by=creation desc
```

### Créer un document
```
POST /api/resource/{DocType}
Body: { "champ1": "valeur1", "champ2": "valeur2" }
```

### Modifier un document
```
PUT /api/resource/{DocType}/{name}
Body: { "champ_a_modifier": "nouvelle_valeur" }
```

### Soumettre un document (Draft → Submitted)
```
POST /api/resource/{DocType}/{name}/submit
Body: {}
```

---

## Codes de statut HTTP

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Créé avec succès |
| `400` | Données invalides |
| `401` | Non authentifié |
| `403` | Permissions insuffisantes |
| `404` | Document introuvable |
| `409` | Conflit (document déjà soumis) |
| `500` | Erreur serveur |

---

## Ordre recommandé pour débuter le POC

1. **Tester l'auth** → `01_authentification.md`
2. **Créer un client test** → `02_clients_fournisseurs.md`
3. **Créer un article service** → `06_articles_catalogue.md`
4. **Créer et soumettre une facture** → `03_ventes_facturation.md`
5. **Lire le grand livre** → `05_comptabilite.md`
6. **Intégrer dans React** → `09_integration_react.md`
