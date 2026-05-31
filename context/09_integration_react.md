# API CoBilan — Guide d'intégration React

> Ce guide explique comment consommer l'API ERPNext depuis un frontend React pour construire CoBilan.

---

## Configuration de base

### Installation des dépendances

```bash
npm create vite@latest cobilan-frontend -- --template react
cd cobilan-frontend
npm install axios @tanstack/react-query react-router-dom
```

---

## Client API centralisé

Crée un fichier `src/api/client.js` :

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true, // indispensable pour envoyer le cookie de session
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Intercepteur : récupère automatiquement le CSRF token
apiClient.interceptors.request.use(async (config) => {
    if (['post', 'put', 'delete'].includes(config.method)) {
        try {
            const res = await axios.get(`${API_BASE}/api/method/frappe.auth.get_csrf_token`, {
                withCredentials: true
            });
            config.headers['X-Frappe-CSRF-Token'] = res.data.csrf_token;
        } catch (e) {
            console.warn('Impossible de récupérer le CSRF token');
        }
    }
    return config;
});

// Intercepteur : redirige vers /login si session expirée
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 403 || error.response?.status === 401) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
```

---

## Service d'authentification

`src/api/auth.js` :

```javascript
import apiClient from './client';

export const authService = {

    // Connexion
    login: async (email, password) => {
        const res = await apiClient.post('/api/method/login', {
            usr: email,
            pwd: password
        });
        return res.data;
    },

    // Déconnexion
    logout: async () => {
        await apiClient.get('/api/method/logout');
    },

    // Utilisateur courant
    getCurrentUser: async () => {
        const res = await apiClient.get('/api/method/frappe.auth.get_logged_user');
        return res.data.message;
    }
};
```

---

## Services par module

### `src/api/customers.js`

```javascript
import apiClient from './client';

export const customerService = {

    // Lister
    getAll: async (params = {}) => {
        const res = await apiClient.get('/api/resource/Customer', {
            params: {
                fields: JSON.stringify(["name","customer_name","customer_type","mobile_no","email_id","territory"]),
                limit_page_length: params.limit || 20,
                limit_start: params.offset || 0,
                order_by: 'creation desc',
                ...params.filters && { filters: JSON.stringify(params.filters) }
            }
        });
        return res.data.data;
    },

    // Détail
    getById: async (name) => {
        const res = await apiClient.get(`/api/resource/Customer/${name}`);
        return res.data.data;
    },

    // Créer
    create: async (data) => {
        const res = await apiClient.post('/api/resource/Customer', data);
        return res.data.data;
    },

    // Modifier
    update: async (name, data) => {
        const res = await apiClient.put(`/api/resource/Customer/${name}`, data);
        return res.data.data;
    },

    // Supprimer
    delete: async (name) => {
        await apiClient.delete(`/api/resource/Customer/${name}`);
    }
};
```

### `src/api/invoices.js`

```javascript
import apiClient from './client';

export const invoiceService = {

    // Factures de vente
    sales: {
        getAll: async (filters = {}) => {
            const res = await apiClient.get('/api/resource/Sales Invoice', {
                params: {
                    fields: JSON.stringify(["name","customer","posting_date","due_date","grand_total","outstanding_amount","status"]),
                    limit_page_length: 20,
                    order_by: 'posting_date desc',
                    ...filters
                }
            });
            return res.data.data;
        },

        getById: async (name) => {
            const res = await apiClient.get(`/api/resource/Sales Invoice/${encodeURIComponent(name)}`);
            return res.data.data;
        },

        create: async (data) => {
            const res = await apiClient.post('/api/resource/Sales Invoice', data);
            return res.data.data;
        },

        submit: async (name) => {
            const res = await apiClient.post(`/api/resource/Sales Invoice/${encodeURIComponent(name)}/submit`, {});
            return res.data;
        },

        cancel: async (name) => {
            const res = await apiClient.post(`/api/resource/Sales Invoice/${encodeURIComponent(name)}/cancel`, {});
            return res.data;
        }
    },

    // Factures d'achat
    purchase: {
        getAll: async (filters = {}) => {
            const res = await apiClient.get('/api/resource/Purchase Invoice', {
                params: {
                    fields: JSON.stringify(["name","supplier","posting_date","due_date","grand_total","outstanding_amount","status"]),
                    limit_page_length: 20,
                    order_by: 'posting_date desc',
                    ...filters
                }
            });
            return res.data.data;
        },

        getById: async (name) => {
            const res = await apiClient.get(`/api/resource/Purchase Invoice/${encodeURIComponent(name)}`);
            return res.data.data;
        },

        create: async (data) => {
            const res = await apiClient.post('/api/resource/Purchase Invoice', data);
            return res.data.data;
        },

        submit: async (name) => {
            const res = await apiClient.post(`/api/resource/Purchase Invoice/${encodeURIComponent(name)}/submit`, {});
            return res.data;
        }
    }
};
```

---

## Contexte d'authentification React

`src/context/AuthContext.jsx` :

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Vérifier si une session est active au démarrage
        authService.getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        await authService.login(email, password);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Hook générique pour lister des ressources

`src/hooks/useResource.js` :

```javascript
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export function useResource(doctype, params = {}) {
    return useQuery({
        queryKey: [doctype, params],
        queryFn: async () => {
            const res = await apiClient.get(`/api/resource/${doctype}`, { params });
            return res.data.data;
        },
        staleTime: 30000 // 30 secondes
    });
}
```

**Utilisation dans un composant :**

```jsx
function CustomerList() {
    const { data: customers, isLoading, error } = useResource('Customer', {
        fields: JSON.stringify(["name","customer_name","mobile_no"]),
        limit_page_length: 20
    });

    if (isLoading) return <div>Chargement...</div>;
    if (error) return <div>Erreur de chargement</div>;

    return (
        <ul>
            {customers.map(c => (
                <li key={c.name}>{c.customer_name} — {c.mobile_no}</li>
            ))}
        </ul>
    );
}
```

---

## Gestion de la pagination

```javascript
// Paramètres de pagination standard ERPNext
const PAGE_SIZE = 20;

const getPage = async (doctype, page = 0, filters = []) => {
    const res = await apiClient.get(`/api/resource/${doctype}`, {
        params: {
            limit_page_length: PAGE_SIZE,
            limit_start: page * PAGE_SIZE,
            filters: JSON.stringify(filters),
            order_by: 'creation desc'
        }
    });
    return res.data.data;
};

// Compter le total pour la pagination
const getCount = async (doctype, filters = []) => {
    const res = await apiClient.get('/api/method/frappe.client.get_count', {
        params: {
            doctype,
            filters: JSON.stringify(filters)
        }
    });
    return res.data.message;
};
```

---

## Encodage des noms dans les URLs

ERPNext utilise souvent des noms avec des espaces ou des tirets comme `Sales Invoice`. Toujours encoder :

```javascript
const name = 'SINV-2024-00001';
const url = `/api/resource/Sales Invoice/${encodeURIComponent(name)}`;
// → /api/resource/Sales%20Invoice/SINV-2024-00001
```

---

## Configuration CORS pour le développement

ERPNext bloque les requêtes cross-origin par défaut. Pour développer en local, ajoute dans `frappe-bench/sites/monsite.local/site_config.json` :

```json
{
    "allow_cors": "*",
    "cors_headers": "Authorization, Content-Type, X-Frappe-CSRF-Token"
}
```

Puis redémarre le container Docker.

---

## Variables d'environnement React

`src/.env.local` :

```
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=CoBilan
```

Utilisation :
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
```
