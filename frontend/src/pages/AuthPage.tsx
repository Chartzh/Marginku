import React, { useState } from 'react';
import logoFull from '@/assets/logo-text.png';
import { useAuth } from '@/contexts/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Store,
  Sparkles,
  ArrowLeft,
  KeyRound,
  Check,
  TrendingUp,
} from 'lucide-react';

interface AuthPageProps {
  onSuccess?: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'VERIFY_OTP' | 'SUCCESS';

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Demo Login for instant testing
  const handleQuickDemoLogin = async () => {
    setEmail('demo@warungberkah.com');
    setPassword('demomargin123');
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await signIn('demo@warungberkah.com', 'demomargin123');
      if (error) {
        localStorage.setItem(
          'marginku_demo_user',
          JSON.stringify({ email: 'demo@warungberkah.com', name: 'Warung Berkah Jaya' })
        );
      }
      if (onSuccess) onSuccess();
    } catch {
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'FORGOT_PASSWORD') {
      if (!email) {
        setErrorMessage('Silakan masukkan email akun Anda');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setMode('VERIFY_OTP');
      }, 700);
      return;
    }

    if (mode === 'VERIFY_OTP') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setMode('SUCCESS');
      }, 700);
      return;
    }

    if (!email || !password) {
      setErrorMessage('Silakan lengkapi semua kolom');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.includes('Invalid login credentials')) {
            setErrorMessage('Email atau kata sandi salah. Silakan coba lagi.');
          } else {
            setErrorMessage(error);
          }
        } else {
          if (onSuccess) onSuccess();
        }
      } else if (mode === 'REGISTER') {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMessage(error);
        } else {
          setMode('SUCCESS');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newCode = [...otpCode];
    newCode[index] = val;
    setOtpCode(newCode);

    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-[#1A1D1E] font-sans flex flex-col justify-between px-5 py-6 max-w-[430px] mx-auto selection:bg-[#15803D] selection:text-white">
      {/* Top Bar / Navigation Header */}
      <div className="flex items-center justify-between min-h-[40px]">
        {mode !== 'LOGIN' ? (
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              setMode('LOGIN');
            }}
            aria-label="Kembali"
            className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D1E] transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}

        {/* Quick Demo Tag */}
        {mode === 'LOGIN' && (
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="px-3.5 py-1.5 rounded-full bg-[#EBF5F0] border border-[#D1E7DD] text-[#15803D] text-xs font-bold flex items-center gap-1.5 hover:bg-[#DEEDE6] transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Mode Coba Cepat</span>
          </button>
        )}
      </div>

      {/* Main Body Flow */}
      <div className="my-auto py-6 space-y-5">
        {/* ===================== VIEW: SUCCESS / CONGRATULATION ===================== */}
        {mode === 'SUCCESS' ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-[#EBF5F0] border border-[#D1E7DD] mx-auto flex items-center justify-center shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-[#15803D] flex items-center justify-center">
                <Check className="w-6 h-6 text-white stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
                Selamat Datang! 🎉
              </h2>
              <p className="text-xs text-[#6B7280] max-w-[280px] mx-auto leading-relaxed">
                Akun warung Anda berhasil disiapkan. Marginku AI siap mengawal margin toko agar terbebas dari jual rugi.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] text-left space-y-3 shadow-card">
              <div className="flex items-center gap-2 text-xs font-bold text-[#15803D]">
                <TrendingUp className="w-4 h-4" />
                <span>3 Perlindungan Aktif:</span>
              </div>
              <ul className="text-xs text-[#6B7280] space-y-1.5 pl-1">
                <li>• Deteksi selisih nota kulakan vs etalase</li>
                <li>• Rekomendasi pembulatan harga cerdas</li>
                <li>• Peringatan seketika saat produk boncos</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onSuccess) onSuccess();
              }}
              className="w-full h-[52px] rounded-full bg-[#15803D] hover:bg-[#15803D]/90 text-white font-bold text-xs flex items-center justify-between px-6 transition-all shadow-floating active:scale-[0.98] cursor-pointer group"
            >
              <span>Mulai Audit Warung Sekarang</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        ) : mode === 'VERIFY_OTP' ? (
          /* ===================== VIEW: VERIFICATION / OTP ===================== */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
                Verifikasi Email
              </h2>
              <p className="text-xs text-[#6B7280]">
                Masukkan 4 digit kode yang dikirimkan ke <strong className="text-[#1A1D1E]">{email || 'email Anda'}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={otpCode[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-extrabold rounded-2xl bg-white border border-[#E5E7EB] text-[#1A1D1E] focus:outline-none focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/15 transition-all shadow-card"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-[#15803D] hover:bg-[#15803D]/90 text-white font-bold text-xs flex items-center justify-between px-6 transition-all shadow-floating active:scale-[0.98] cursor-pointer group disabled:opacity-50"
              >
                <span>{loading ? 'Memverifikasi...' : 'Lanjutkan Verifikasi'}</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setSuccessMessage('Kode baru telah dikirimkan ke email Anda')}
                  className="text-xs text-[#15803D] font-bold hover:underline cursor-pointer"
                >
                  Kirim ulang kode verifikasi
                </button>
              </div>
            </form>
          </div>
        ) : mode === 'FORGOT_PASSWORD' ? (
          /* ===================== VIEW: FORGOT PASSWORD ===================== */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2">
              <img src={logoFull} alt="Marginku" className="h-10 w-auto object-contain mb-1" />
              <h2 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
                Lupa Kata Sandi?
              </h2>
              <p className="text-xs text-[#6B7280]">
                Pilih metode pemulihan untuk mereset kata sandi akun toko Anda.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Option 1: Email */}
              <div className="p-4 rounded-3xl bg-white border border-[#15803D] flex items-center gap-3.5 shadow-card">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5F0] flex items-center justify-center text-[#15803D]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] text-[#6B7280] font-medium block">Kirim via Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email.pemilik@warung.com"
                    className="w-full bg-transparent text-xs font-semibold text-[#1A1D1E] placeholder:text-[#9CA3AF] focus:outline-none mt-0.5"
                  />
                </div>
              </div>

              {/* Option 2: WhatsApp info */}
              <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] flex items-center gap-3.5 shadow-sm opacity-70">
                <div className="w-10 h-10 rounded-2xl bg-[#F4F6F5] flex items-center justify-center text-[#6B7280]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280] font-medium">Bantuan Admin Support</span>
                  <div className="text-xs font-bold text-[#1A1D1E]">0812-8899-MARG (WhatsApp)</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-[#15803D] hover:bg-[#15803D]/90 text-white font-bold text-xs flex items-center justify-between px-6 transition-all shadow-floating active:scale-[0.98] cursor-pointer group disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Mengirim instruksi...' : 'Kirim Kode Verifikasi'}</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>
            </form>
          </div>
        ) : (
          /* ===================== VIEW: LOGIN & REGISTER ===================== */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header Titles */}
            <div className="space-y-2">
              <img src={logoFull} alt="Marginku" className="h-10 w-auto object-contain mb-1" />
              <h1 className="text-2xl font-extrabold text-[#1A1D1E] tracking-tight">
                {mode === 'LOGIN' ? 'Masuk ke Akun Toko' : 'Daftar Akun Warung'}
              </h1>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {mode === 'LOGIN'
                  ? 'Kawal margin retail dan cegah kerugian harga etalase warung Anda.'
                  : 'Buat akun dalam 1 menit untuk langsung mulai scan label rak & nota.'}
              </p>
            </div>

            {/* Switch Mode Segmented Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-full bg-[#F4F6F5] border border-[#E5E7EB] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-full transition-all cursor-pointer ${mode === 'LOGIN'
                    ? 'bg-[#15803D] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#1A1D1E]'
                  }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-full transition-all cursor-pointer ${mode === 'REGISTER'
                    ? 'bg-[#15803D] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#1A1D1E]'
                  }`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-[#D1E7DD] text-xs text-[#15803D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-bold text-[#1A1D1E] mb-1">
                    Nama Warung / Toko
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Warung Berkah Jaya"
                      className="w-full h-[48px] pl-11 pr-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#1A1D1E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/15 shadow-sm transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1A1D1E] mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pemilik@warung.com"
                    className="w-full h-[48px] pl-11 pr-4 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#1A1D1E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/15 shadow-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#1A1D1E]">
                    Kata Sandi
                  </label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setMode('FORGOT_PASSWORD');
                      }}
                      className="text-[11px] text-[#15803D] hover:underline font-bold cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-[48px] pl-11 pr-11 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#1A1D1E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/15 shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1D1E] cursor-pointer"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] rounded-full bg-[#15803D] hover:bg-[#15803D]/90 text-white font-bold text-xs flex items-center justify-between px-6 transition-all shadow-floating active:scale-[0.98] cursor-pointer group disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Memproses...'
                      : mode === 'LOGIN'
                        ? 'Masuk ke Marginku'
                        : 'Buat Akun Warung'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
              </div>
            </form>


          </div>
        )}
      </div>

      {/* Footer Trust Badges */}
      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          <span>Terenkripsi aman</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#15803D]" />
          <span>Warung Retail Indonesia</span>
        </div>
      </div>
    </div>
  );
};
