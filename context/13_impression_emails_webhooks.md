# API CoBilan — Impression, Emails, Webhooks & Utilitaires

> **Base URL :** `http://localhost:8080`  
> **Authentification :** Session cookie ou `Authorization: token KEY:SECRET`

---

## IMPRESSION & GÉNÉRATION PDF

### 1. Générer le PDF d'un document

#### `GET /api/method/frappe.utils.print_format.download_pdf`

**Params :**
```
doctype=Sales Invoice&name=SINV-2024-00001&format=Standard&no_letterhead=0&letterhead=Mon En-tête&lang=fr
```

**Utilisation depuis React :**
```javascript
const downloadPDF = async (doctype, name) => {
    const url = `${API_BASE}/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(doctype)}&name=${encodeURIComponent(name)}&format=Standard&lang=fr`;
    window.open(url, '_blank');
};
```

---

### 2. Obtenir l'aperçu HTML d'un document

#### `GET /api/method/frappe.www.printview.get_html_and_style`

**Params :**
```
doc={"doctype":"Sales Invoice","name":"SINV-2024-00001"}&print_format=Standard&no_letterhead=0
```

---

### 3. Lister les formats d'impression disponibles

#### `GET /api/resource/Print Format`

```
GET /api/resource/Print Format?filters=[["doc_type","=","Sales Invoice"]]&fields=["name","doc_type","html","css","disabled"]
```

---

### 4. Créer un format d'impression personnalisé

#### `POST /api/resource/Print Format`

```json
{
    "name": "Facture CoBilan Maroc",
    "doc_type": "Sales Invoice",
    "print_format_type": "Jinja",
    "html": "<h1>{{ doc.customer_name }}</h1>...",
    "css": "body { font-family: Arial; }",
    "disabled": 0
}
```

---

### 5. En-têtes de lettre (Letterhead)

#### `GET /api/resource/Letter Head`

```
GET /api/resource/Letter Head?fields=["name","content","footer","disabled"]
```

---

## ENVOI D'EMAILS

### 1. Envoyer un email depuis ERPNext

#### `POST /api/method/frappe.core.doctype.communication.email.make`

```json
{
    "recipients": "client@societe.ma",
    "subject": "Votre facture SINV-2024-00001",
    "content": "Veuillez trouver ci-joint votre facture.",
    "doctype": "Sales Invoice",
    "name": "SINV-2024-00001",
    "send_email": true,
    "print_html": null,
    "print_format": "Facture CoBilan Maroc",
    "attachments": []
}
```

---

### 2. Envoyer une facture par email (méthode directe)

#### `POST /api/method/erpnext.accounts.doctype.sales_invoice.sales_invoice.make_payment_request`

```json
{
    "dt": "Sales Invoice",
    "dn": "SINV-2024-00001",
    "submit_doc": 0,
    "order_type": "Shopping Cart",
    "send_email": 1
}
```

---

### 3. Lister les communications (emails envoyés/reçus)

#### `GET /api/resource/Communication`

```
GET /api/resource/Communication?filters=[["reference_doctype","=","Sales Invoice"],["reference_name","=","SINV-2024-00001"]]&fields=["name","subject","sent_or_received","sender","recipients","creation"]
```

---

### 4. Comptes email (Email Account)

#### `GET /api/resource/Email Account`

```
GET /api/resource/Email Account?fields=["name","email_id","enable_outgoing","enable_incoming","default_outgoing"]
```

---

## NOTIFICATIONS AUTOMATIQUES

### 1. Lister les notifications configurées

#### `GET /api/resource/Notification`

```
GET /api/resource/Notification?fields=["name","document_type","event","subject","enabled"]
```

---

### 2. Créer une notification automatique

#### `POST /api/resource/Notification`

```json
{
    "name": "Facture en retard - Alerte",
    "document_type": "Sales Invoice",
    "event": "Days After",
    "days_in_advance": -7,
    "date_changed": "due_date",
    "enabled": 1,
    "subject": "Facture {{ doc.name }} en retard",
    "message": "La facture {{ doc.name }} de {{ doc.customer_name }} pour {{ doc.outstanding_amount }} MAD est en retard.",
    "recipients": [
        {
            "receiver_by_document_field": "contact_email"
        }
    ]
}
```

**Événements disponibles :**

| Événement | Description |
|-----------|-------------|
| `New` | À la création |
| `Save` | À la sauvegarde |
| `Submit` | À la soumission |
| `Cancel` | À l'annulation |
| `Days Before` | N jours avant une date |
| `Days After` | N jours après une date |
| `Value Change` | Quand un champ change |

---

## WEBHOOKS

### 1. Lister les webhooks

#### `GET /api/resource/Webhook`

```
GET /api/resource/Webhook?fields=["name","webhook_doctype","webhook_docevent","request_url","enabled"]
```

---

### 2. Créer un webhook

#### `POST /api/resource/Webhook`

```json
{
    "webhook_doctype": "Sales Invoice",
    "webhook_docevent": "on_submit",
    "request_url": "https://ton-frontend.cobilan.ma/webhooks/invoice",
    "request_method": "POST",
    "enabled": 1,
    "webhook_data": [
        {"fieldname": "name", "key": "invoice_id"},
        {"fieldname": "customer", "key": "customer"},
        {"fieldname": "grand_total", "key": "amount"}
    ]
}
```

**Événements webhook disponibles :**

| Événement | Description |
|-----------|-------------|
| `on_submit` | Après soumission |
| `on_cancel` | Après annulation |
| `after_insert` | Après insertion |
| `on_update_after_submit` | Après modification post-soumission |

---

## RECHERCHE AVANCÉE

### 1. Recherche globale full-text

#### `GET /api/method/frappe.desk.search.search_widget`

**Params :**
```
doctype=Customer&txt=Société&query=erpnext.controllers.queries.customer_query&page_length=10&searchfield=customer_name
```

---

### 2. Recherche multi-DocType

#### `POST /api/method/frappe.desk.search.web_search`

```json
{
    "text": "Société ABC",
    "scope": null
}
```

---

### 3. Recherche dans les listes de sélection (Link Field)

#### `GET /api/method/frappe.desk.search.search_link`

**Params :**
```
doctype=Customer&txt=Soc&page_length=5
```

---

## MÉTADONNÉES & STRUCTURE

### 1. Obtenir les champs d'un DocType

#### `GET /api/method/frappe.client.get_meta`

**Params :**
```
doctype=Sales Invoice
```

Retourne tous les champs, leurs types, labels et validations.

---

### 2. Vérifier les permissions sur un DocType

#### `GET /api/method/frappe.client.has_permission`

**Params :**
```
doctype=Sales Invoice&docname=SINV-2024-00001&perm_type=write
```

**Réponse :**
```json
{"message": {"has_permission": true}}
```

---

### 3. Lister tous les DocTypes disponibles

#### `GET /api/resource/DocType`

```
GET /api/resource/DocType?filters=[["module","=","Accounts"],["istable","=",0]]&fields=["name","module","document_type"]&limit_page_length=100
```

---

## IMPORT & EXPORT DE DONNÉES

### 1. Exporter des données en CSV

#### `GET /api/method/frappe.desk.reportview.export_query`

**Params :**
```
doctype=Customer&file_format_type=CSV&fields=["name","customer_name","mobile_no","email_id"]&filters=[]
```

---

### 2. Template d'import

#### `GET /api/method/frappe.desk.form.linked_with.get_linked_doctypes`

**Params :**
```
doctype=Customer
```

---

### 3. Importer des données via Data Import

#### `POST /api/resource/Data Import`

```json
{
    "reference_doctype": "Customer",
    "import_type": "Insert New Records",
    "google_sheets_url": null
}
```

---

## PARAMÈTRES RÉGIONAUX MAROC

### 1. Devises disponibles

#### `GET /api/resource/Currency`

```
GET /api/resource/Currency?filters=[["enabled","=",1]]&fields=["name","currency_name","symbol","fraction","fraction_units"]
```

---

### 2. Configuration de la devise MAD

#### `GET /api/resource/Currency/MAD`

```
GET /api/resource/Currency/MAD
```

---

### 3. Pays et villes du Maroc

#### `GET /api/resource/Country`

```
GET /api/resource/Country/Morocco
```

---

## TODO & ASSIGNATION DE TÂCHES

### 1. Lister les tâches à faire

#### `GET /api/resource/ToDo`

```
GET /api/resource/ToDo?filters=[["owner","=","cobilan@gmail.com"],["status","=","Open"]]&fields=["name","description","priority","date","assigned_by","reference_type","reference_name"]
```

---

### 2. Créer une tâche à faire liée à un document

#### `POST /api/resource/ToDo`

```json
{
    "description": "Relancer ce client pour paiement",
    "reference_type": "Sales Invoice",
    "reference_name": "SINV-2024-00001",
    "assigned_by": "cobilan@gmail.com",
    "owner": "comptable@cobilan.ma",
    "priority": "High",
    "date": "2024-02-01"
}
```

---

## COMMENTAIRES & ACTIVITÉ

### 1. Ajouter un commentaire sur un document

#### `POST /api/resource/Comment`

```json
{
    "comment_type": "Comment",
    "reference_doctype": "Sales Invoice",
    "reference_name": "SINV-2024-00001",
    "content": "Client contacté par téléphone, paiement prévu le 05/02."
}
```

---

### 2. Lire les commentaires d'un document

#### `GET /api/resource/Comment`

```
GET /api/resource/Comment?filters=[["reference_doctype","=","Sales Invoice"],["reference_name","=","SINV-2024-00001"]]&fields=["name","content","owner","creation"]
```
