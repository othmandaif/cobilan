import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cobilan-700 to-cobilan-900 text-white flex-col justify-between p-12">
        <div>
          <img src="/logo.png" alt="CoBilan" className="h-60 brightness-0 invert mb-2" />
          <p className="mt-1 text-cobilan-200 text-sm">Gestion comptable simplifiée</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold leading-tight">
              Votre comptabilité,
              <br />
              sous contrôle.
            </h2>
            <p className="mt-4 text-cobilan-200 max-w-md leading-relaxed">
              Factures, achats, trésorerie, TVA, grand livre — tout est centralisé
              dans une interface pensée pour les entreprises marocaines.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-cobilan-300">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Conforme CGNC
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Multi-devises
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              On-premise
            </div>
          </div>
        </div>

        <p className="text-xs text-cobilan-400">© 2024 CoBilan. Tous droits réservés.</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.png" alt="CoBilan" className="h-60 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Gestion comptable simplifiée</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
            <p className="mt-1 text-sm text-gray-500">
              Accédez à votre espace de gestion
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.ma"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                    placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent
                    transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm pr-10
                      placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:border-transparent
                      transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !email || !password}
                className="w-full rounded-lg bg-cobilan-600 px-4 py-2.5 text-sm font-semibold text-white
                  hover:bg-cobilan-700 focus:outline-none focus:ring-2 focus:ring-cobilan-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Propulsé par ERPNext · Devise MAD
          </p>
        </div>
      </div>
    </div>
  );
}