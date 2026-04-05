"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn.email({ email, password });
      router.push("/chat");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/chat" });
    } catch {
      toast.error("Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(200,169,110,0.06)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(91,156,246,0.05)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="hidden md:flex flex-col justify-between flex-[0_0_420px] p-12 border-r border-[var(--border)] relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[15px] font-black text-black font-[var(--font-display,sans-serif)] shrink-0">
            N
          </div>
          <span className="font-[var(--font-display,sans-serif)] font-bold text-[16px]">
            Nexus
          </span>
        </div>

        {/* Headline */}
        <div>
          <h2 className="text-[28px] font-[var(--font-display,sans-serif)] font-bold leading-[1.3] text-[var(--text)] mb-4 tracking-[-0.5px]">
            Your team,
            <br />
            <span className="text-[var(--accent)]">in sync.</span>
          </h2>
          <p className="text-[14px] text-[var(--text3)] leading-relaxed">
            Real-time messaging with an AI teammate that joins when you need it.
            No noise, just signal.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-2.5">
          {[
            { icon: "⚡", text: "Real-time messaging" },
            { icon: "✦", text: "AI assistant via @ai mention" },
            { icon: "🎤", text: "Voice messages" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-[var(--border)]"
            >
              <span className="text-[14px]">{icon}</span>
              <span className="text-[13px] text-[var(--text2)]">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-[400px] animate-[fadeInUp_0.22s_ease_forwards]">
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-9">
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[var(--accent)] flex items-center justify-center text-[14px] font-black text-black font-[var(--font-display,sans-serif)]">
              N
            </div>
            <span className="font-[var(--font-display,sans-serif)] font-bold text-[15px]">
              Nexus
            </span>
          </div>

          <h1 className="text-[22px] font-bold font-[var(--font-display,sans-serif)] text-center mb-1.5 tracking-[-0.3px]">
            Welcome back
          </h1>
          <p className="text-[13px] text-[var(--text3)] text-center mb-7">
            Sign in to continue to your workspace
          </p>

          <div className="bg-[var(--sidebar)] border border-[var(--border)] rounded-2xl p-7 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-[9px] mb-5
                border border-[var(--border2)] bg-[var(--surface)] text-[var(--text)]
                text-[13.5px] font-[var(--ff,sans-serif)]
                transition-[border-color,background] duration-150
                hover:border-[var(--border)] hover:bg-[var(--surface2)]
                disabled:opacity-60 disabled:cursor-not-allowed
                cursor-pointer
              "
            >
              {googleLoading ? (
                <div className="spinner !w-3.5 !h-3.5" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[11px] text-[var(--text3)] tracking-[0.05em]">
                OR
              </span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`
                  w-full flex items-center justify-center gap-2
                  mt-1 py-[11px] rounded-[9px] border-none
                  text-[13.5px] font-semibold font-[var(--ff,sans-serif)]
                  transition-all duration-150
                  ${
                    email && password
                      ? "bg-[var(--accent)] text-black cursor-pointer hover:opacity-88 active:scale-[0.98]"
                      : "bg-[var(--surface2)] text-[var(--text3)] cursor-not-allowed"
                  }
                  disabled:opacity-50
                `}
              >
                {loading ? (
                  <div className="spinner !w-3.5 !h-3.5 !border-t-black !border-black/15" />
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[13px] text-[var(--text3)] mt-5">
            No account?{" "}
            <Link
              href="/auth/register"
              className="text-[var(--accent)] font-medium no-underline hover:opacity-80 transition-opacity"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        className={`
          block text-[12px] font-medium mb-1.5 transition-colors duration-150
          ${focused ? "text-[var(--accent)]" : "text-[var(--text2)]"}
        `}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full px-3 py-2.5 rounded-lg text-[13.5px]
          font-[var(--ff,sans-serif)] text-[var(--text)]
          placeholder:text-[var(--text3)] outline-none
          border transition-[border-color,background,box-shadow] duration-150
          ${
            focused
              ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface))] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
              : "border-[var(--border2)] bg-[var(--surface)]"
          }
        `}
      />
    </div>
  );
}
