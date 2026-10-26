import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertTriangle, ShieldCheck, Building2, UserCheck, ArrowRight } from 'lucide-react';

type RoleTab = 'OFFICER' | 'INSTITUTION';

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  name: string;
  designation: string;
}

const OFFICER_ACCOUNTS: DemoAccount[] = [
  {
    email: 'officer@demo.aicte',
    password: 'demo123',
    role: 'Scrutiny Officer',
    name: 'Ms. Priya Sharma',
    designation: 'AICTE Scrutiny & Verification Cell',
  },
  {
    email: 'officer2@demo.aicte',
    password: 'demo123',
    role: 'Regional Director',
    name: 'Dr. Arvind Swaminathan',
    designation: 'AICTE Approval Bureau',
  },
];

const INSTITUTION_ACCOUNTS: DemoAccount[] = [
  {
    email: 'institution@demo.aicte',
    password: 'demo123',
    role: 'Institution Head (Principal)',
    name: 'Dr. Rajesh Kumar',
    designation: 'Delhi Institute of Technology & Engineering',
  },
];

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<RoleTab>('OFFICER');
  const [email, setEmail] = useState('officer@demo.aicte');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabSwitch = (tab: RoleTab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'OFFICER') {
      setEmail('officer@demo.aicte');
      setPassword('demo123');
    } else {
      setEmail('institution@demo.aicte');
      setPassword('demo123');
    }
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPass);

      // Enforce tab role validation
      if (activeTab === 'OFFICER' && user.role !== 'OFFICER') {
        logout();
        setError('Access Denied: This tab is exclusively for AICTE Scrutiny Officers. Technical Institutions must log in via the Institution tab.');
        return;
      }

      if (activeTab === 'INSTITUTION' && user.role !== 'INSTITUTION') {
        logout();
        setError('Access Denied: This tab is exclusively for Technical Institutions. AICTE Scrutiny Officers must log in via the Scrutiny Officer tab.');
        return;
      }

      navigate('/');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please check credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    await executeLogin(account.email, account.password);
  };

  const currentAccounts = activeTab === 'OFFICER' ? OFFICER_ACCOUNTS : INSTITUTION_ACCOUNTS;

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      {/* Demo Top Banner */}
      <div className="demo-banner flex items-center justify-center gap-4 text-xs font-medium py-1.5 px-4 bg-amber-500/10 text-amber-700 border-b border-amber-300/40">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          DEMO ENVIRONMENT · SIH26262
        </span>
        <span className="w-px h-3 bg-amber-400/50" />
        <span>SIMULATED AICTE APPROVAL WORKFLOW</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* AICTE Portal Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-navy rounded-xl shadow-md flex items-center justify-center mx-auto mb-3 border-2 border-navy/20">
              <span className="text-white font-extrabold text-2xl tracking-wider">A</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-navy tracking-tight">
              AICTE Approval Workflow Automation
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Compliance Monitoring & Automated Scrutiny System
            </p>
          </div>

          {/* Login Card */}
          <div className="card shadow-lg border border-border/80 overflow-hidden rounded-xl bg-white">
            {/* Top Tab Bar: Scrutiny Officer (Left) | Institution (Right) */}
            <div className="grid grid-cols-2 bg-gray-100/90 p-1.5 gap-1.5 border-b border-border">
              {/* Left Tab: Scrutiny Officer */}
              <button
                type="button"
                id="tab-scrutiny-officer"
                onClick={() => handleTabSwitch('OFFICER')}
                className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-lg text-sm font-semibold transition-all select-none ${
                  activeTab === 'OFFICER'
                    ? 'bg-white text-navy shadow-sm ring-1 ring-black/5 border-l-4 border-l-gov-blue'
                    : 'text-text-secondary hover:text-navy hover:bg-white/60'
                }`}
              >
                <ShieldCheck
                  size={19}
                  className={activeTab === 'OFFICER' ? 'text-gov-blue shrink-0' : 'text-text-secondary/70 shrink-0'}
                />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold">Scrutiny Officer</div>
                  <div className="text-[10px] font-normal text-text-secondary">AICTE Scrutiny Portal</div>
                </div>
              </button>

              {/* Right Tab: Institution */}
              <button
                type="button"
                id="tab-institution"
                onClick={() => handleTabSwitch('INSTITUTION')}
                className={`flex items-center justify-center gap-2.5 py-3 px-3 rounded-lg text-sm font-semibold transition-all select-none ${
                  activeTab === 'INSTITUTION'
                    ? 'bg-white text-navy shadow-sm ring-1 ring-black/5 border-r-4 border-r-emerald-600'
                    : 'text-text-secondary hover:text-navy hover:bg-white/60'
                }`}
              >
                <Building2
                  size={19}
                  className={activeTab === 'INSTITUTION' ? 'text-emerald-600 shrink-0' : 'text-text-secondary/70 shrink-0'}
                />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold">Institution</div>
                  <div className="text-[10px] font-normal text-text-secondary">College / Applicant</div>
                </div>
              </button>
            </div>

            {/* Sub-header Context Pill */}
            <div className="px-5 py-2.5 bg-gray-50/70 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${activeTab === 'OFFICER' ? 'bg-gov-blue' : 'bg-emerald-600'}`} />
                <span className="font-semibold text-text-main">
                  {activeTab === 'OFFICER' ? 'AICTE Officer Access' : 'Technical Institute Access'}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-border text-text-secondary">
                {activeTab === 'OFFICER' ? 'Role: OFFICER' : 'Role: INSTITUTION'}
              </span>
            </div>

            <div className="card-body p-5">
              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 mb-4 animate-shake">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1 font-medium leading-relaxed">{error}</div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="email" className="form-label text-xs font-semibold text-text-main mb-1 block">
                    {activeTab === 'OFFICER' ? 'Official AICTE Email' : 'Institutional Email Address'}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'OFFICER' ? 'officer@demo.aicte' : 'institution@demo.aicte'}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label text-xs font-semibold text-text-main mb-1 block">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-input text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-spin text-sm">⟳</span>
                  ) : (
                    <LogIn size={15} />
                  )}
                  {loading ? 'Authenticating...' : `Sign In as ${activeTab === 'OFFICER' ? 'Scrutiny Officer' : 'Institution'}`}
                </button>
              </form>

              {/* Quick Demo Login Section - strictly filtered by role */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={13} className="text-gov-blue" />
                    Quick Demo Login ({activeTab === 'OFFICER' ? 'Scrutiny Officers Only' : 'Institution Only'})
                  </p>
                  <span className="text-[10px] text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded">
                    1-Click
                  </span>
                </div>

                <div className="space-y-2">
                  {currentAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleQuickLogin(account)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50/70 hover:bg-blue-50/50 border border-border/80 hover:border-gov-blue/50 rounded-lg transition-all text-left group cursor-pointer"
                      disabled={loading}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-navy truncate group-hover:text-gov-blue">
                            {account.name}
                          </p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            activeTab === 'OFFICER'
                              ? 'bg-blue-100 text-gov-blue'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {account.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary truncate mt-0.5">
                          {account.designation} · <span className="font-mono text-gray-500">{account.email}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-gov-blue shrink-0 group-hover:translate-x-0.5 transition-transform">
                        <span>Login</span>
                        <ArrowRight size={13} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <p className="text-[11px] text-text-secondary text-center mt-4 leading-relaxed max-w-sm mx-auto">
            Prototype developed for Smart India Hackathon 2026.
            Role-based segregation is enforced on authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
