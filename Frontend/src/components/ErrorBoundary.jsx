import React from 'react';

function getCopy() {
  let language = 'en';
  try { language = window.localStorage.getItem('adwety_language') || 'en'; } catch (_) {}
  if (language === 'ar') {
    return {
      title: 'تعذر تشغيل لوحة التحكم',
      description: 'جلسة محفوظة أو خطأ في الواجهة منع React من عرض الصفحة. استخدم الزر التالي لمسح الجلسة وفتح تسجيل الدخول.',
      button: 'إعادة الضبط وفتح تسجيل الدخول',
    };
  }
  return {
    title: 'The dashboard could not start',
    description: 'A saved browser session or a frontend runtime error stopped React from rendering. Use the button below to reset the local session and open Login.',
    button: 'Reset and open login',
  };
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ADWETY UI error:', error, info);
  }

  clearAndReload = () => {
    try {
      window.localStorage.removeItem('adwety_dashboard_session');
      window.sessionStorage.removeItem('adwety_dashboard_session');
      window.localStorage.removeItem('adwety_theme');
    } catch (_error) {
      // ignore storage errors
    }
    window.location.href = '/login';
  };

  render() {
    if (!this.state.error) return this.props.children;
    const copy = getCopy();
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
        <section style={{ width: 'min(720px, 100%)', border: '1px solid #e2e8f0', borderRadius: 24, background: '#fff', padding: 28, boxShadow: '0 20px 50px -25px rgba(15,23,42,.35)' }}>
          <p style={{ margin: 0, color: '#0891b2', fontWeight: 700, letterSpacing: '.2em', fontSize: 12 }}>ADWETY</p>
          <h1 style={{ margin: '12px 0 8px', fontSize: 28 }}>{copy.title}</h1>
          <p style={{ margin: '0 0 18px', color: '#64748b' }}>{copy.description}</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', padding: 14, borderRadius: 16, background: '#f1f5f9', color: '#be123c', fontSize: 13 }}>{String(this.state.error?.message || this.state.error)}</pre>
          <button onClick={this.clearAndReload} style={{ marginTop: 18, border: 0, borderRadius: 16, background: '#0891b2', color: '#fff', padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>{copy.button}</button>
        </section>
      </main>
    );
  }
}
