import { useEffect, useState } from 'react';
import { env } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import EmptyState from '../components/EmptyState';
import RoleBadge from '../components/RoleBadge';
import { getJson } from '../lib/api';

export default function ProfilePage() {
  const { session } = useAuth();
  const { t, theme, language } = usePreferences();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await getJson('/profile');
        setProfile(result.data || null);
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    load();
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="card p-6">
        <h3 className="text-xl font-semibold text-primary">Active dashboard session</h3>
        <div className="mt-5 space-y-4">
          {[
            [t('common.name'), session.name],
            [t('common.email'), session.email],
            [t('app.language'), language === 'ar' ? 'العربية' : 'English'],
            ['Theme', theme],
            ['Assigned pharmacy', session.pharmacyName || '—'],
          ].map(([label, value]) => (
            <div key={label} className="sub-card p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 font-medium text-primary">{value}</p>
            </div>
          ))}
          <div className="sub-card p-4">
            <p className="text-sm text-muted">{t('app.role')}</p>
            <div className="mt-2"><RoleBadge role={session.role} /></div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">System & AI Configuration</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['Frontend port', env.port],
              ['API base URL', env.apiBaseUrl],
              ['AI provider', env.aiProvider],
              ['Gemini model', env.geminiModel],
              ['Future AI label', env.customAiLabel],
              ['Upload limit', `${env.maxUploadSizeMb} MB`],
            ].map(([label, value]) => (
              <div key={label} className="sub-card p-4">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 break-all font-medium text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">Backend profile endpoint</h3>
          {error ? (
            <EmptyState title="Profile endpoint error" description={error} />
          ) : (
            <pre className="mt-4 overflow-auto rounded-3xl border border-soft bg-slate-50 p-4 text-sm text-primary dark:bg-slate-950/50">
{JSON.stringify(profile, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
