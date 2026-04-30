import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register, verifyRegisterOtp } = useAuth();
  const { t, isRtl } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirm: '',
    role: 'user',
    pharmacyName: '',
    pharmacyAddress: '',
    pharmacyPhone: '',
    pharmacyEmail: '',
    workingHours: '',
    googleMapsUrl: '',
  });
  const [otpState, setOtpState] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPharmacyAdmin = form.role === 'pharmacy_admin';

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || form.password !== form.confirm) {
      setError(t('forms.checkRequired'));
      return;
    }
    if (isPharmacyAdmin && (!form.pharmacyName || !form.pharmacyAddress)) {
      setError(t('auth.pharmacyDataRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await register({
        fullName: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        role: form.role,
        pharmacy: isPharmacyAdmin ? {
          name: form.pharmacyName,
          address: form.pharmacyAddress,
          phone: form.pharmacyPhone || form.phoneNumber,
          email: form.pharmacyEmail || form.email,
          working_hours: form.workingHours,
          google_maps_url: form.googleMapsUrl,
        } : null,
      });
      if (result?.requires_otp) {
        setOtpState(result);
        toast.success(t('otp.sent'));
        return;
      }
      if (result?.pending_approval) {
        setPendingApproval(result);
        toast.info(t('auth.pendingOwnerApproval'));
        return;
      }
      toast.success(t('toast.saved'));
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await verifyRegisterOtp({ otpToken: otpState.otp_token, otp, email: form.email, role: form.role });
      if (result?.pending_approval) {
        setPendingApproval(result);
        setOtpState(null);
        toast.info(t('auth.pendingOwnerApproval'));
        return;
      }
      toast.success(t('otp.verified'));
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="card w-full max-w-2xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-200">ADWETY</p>
        <h1 className={`mt-4 text-3xl font-bold text-primary ${isRtl ? 'text-right' : ''}`}>{otpState ? t('otp.verifyAccount') : pendingApproval ? t('auth.requestSubmitted') : t('actions.register')}</h1>

        {pendingApproval ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-semibold">{t('auth.pendingOwnerApproval')}</p>
              <p className="mt-2 text-sm">{t('auth.pendingOwnerApprovalDescription')}</p>
              <p className="mt-3 text-sm"><span className="font-semibold">{t('common.email')}:</span> {pendingApproval.email || form.email}</p>
              <p className="mt-1 text-sm"><span className="font-semibold">{t('common.role')}:</span> {t(`roles.${pendingApproval.role || form.role}`)}</p>
            </div>
            <Link to="/login" className="btn-primary w-full">{t('actions.login')}</Link>
          </div>
        ) : otpState ? (
          <form className="mt-6 space-y-4" onSubmit={submitOtp}>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
              {t('otp.sentTo')} {otpState.delivery?.destination || form.email}. {t('otp.expiresIn')} {otpState.expires_in_minutes} {t('otp.minutes')}.
            </div>
            <div>
              <label className="label">{t('otp.code')}</label>
              <div className="relative">
                <ShieldCheck className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                <input className="input ps-11 tracking-[0.35em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="000000" />
              </div>
            </div>
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
            <button className="btn-primary w-full" disabled={loading}>{loading ? t('app.loading') : t('otp.verify')}</button>
          </form>
        ) : (
          <form className="mt-6" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">{t('common.name')}</label><input className="input" value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
              <div><label className="label">{t('common.email')}</label><input className="input" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></div>
              <div><label className="label">{t('common.phone')}</label><input className="input" value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} /></div>
              <div><label className="label">{t('common.role')}</label><select className="input" value={form.role} onChange={(e) => updateField('role', e.target.value)}><option value="user">{t('roles.user')}</option><option value="super_admin">{t('roles.super_admin')}</option><option value="pharmacy_admin">{t('roles.pharmacy_admin')}</option><option value="support_admin">{t('roles.support_admin')}</option><option value="owner">{t('roles.owner')}</option></select></div>
              <div><label className="label">{t('common.password')}</label><input className="input" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} /></div>
              <div><label className="label">{t('common.confirmPassword')}</label><input className="input" type="password" value={form.confirm} onChange={(e) => updateField('confirm', e.target.value)} /></div>
            </div>

            {isPharmacyAdmin ? (
              <section className="mt-6 rounded-3xl border border-soft bg-slate-50 p-5 dark:bg-white/5">
                <h2 className="text-lg font-semibold text-primary">{t('auth.pharmacyRegistrationData')}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div><label className="label">{t('common.pharmacy')}</label><input className="input" value={form.pharmacyName} onChange={(e) => updateField('pharmacyName', e.target.value)} /></div>
                  <div><label className="label">{t('common.phone')}</label><input className="input" value={form.pharmacyPhone} onChange={(e) => updateField('pharmacyPhone', e.target.value)} /></div>
                  <div className="md:col-span-2"><label className="label">{t('common.address')}</label><input className="input" value={form.pharmacyAddress} onChange={(e) => updateField('pharmacyAddress', e.target.value)} /></div>
                  <div><label className="label">{t('common.email')}</label><input className="input" value={form.pharmacyEmail} onChange={(e) => updateField('pharmacyEmail', e.target.value)} /></div>
                  <div><label className="label">{t('common.workingHours')}</label><input className="input" value={form.workingHours} onChange={(e) => updateField('workingHours', e.target.value)} /></div>
                  <div className="md:col-span-2"><label className="label">{t('common.googleMapsUrl')}</label><input className="input" value={form.googleMapsUrl} onChange={(e) => updateField('googleMapsUrl', e.target.value)} /></div>
                </div>
              </section>
            ) : null}

            <p className="mt-3 text-xs text-muted">{t('forms.passwordHint')}</p>
            {form.role !== 'user' ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{t('auth.adminRegisterNotice')}</p> : null}
            {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
            <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? t('app.loading') : t('actions.register')}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted"><Link className="font-semibold text-cyan-700 dark:text-cyan-200" to="/login">{t('actions.login')}</Link></p>
      </div>
    </main>
  );
}
