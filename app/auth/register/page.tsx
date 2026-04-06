"use client";

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
  const [focused, setFocused] = useState<'name' | 'email' | 'password' | null>(null);

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

  async function handleGoogle(): Promise<void> {
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/chat" });
    } catch {
      toast.error("Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)] relative overflow-y-auto overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-1/5 -left-1/10 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(200,169,110,0.06)_0%,transparent_70%)]" />
        <div className="absolute -bottom-1/5 -right-1/10 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(91,156,246,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between w-[420px] px-12 py-16 border-r border-[var(--border)] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-base font-extrabold text-[#0c0c0d]">
            N
          </div>
          <span className="font-bold text-base">Nexus</span>
        </div>

        <div className="space-y-6">
          <div className="text-[30px] font-bold leading-tight tracking-tight">
            Your team,<br />
            <span className="text-[var(--accent)]">in sync.</span>
          </div>
          <p className="text-sm text-[var(--text3)] leading-relaxed max-w-sm">
            Real-time messaging with an AI teammate that joins when you need it.
            No noise, just signal.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { icon: "⚡", text: "Real-time messaging" },
            { icon: "✦", text: "AI assistant via @ai mention" },
            { icon: "🎤", text: "Voice messages" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)]"
            >
              <span className="text-base">{icon}</span>
              <span className="text-sm text-[var(--text2)]">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start md:items-center justify-center px-6 py-12 md:py-0 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-8 animate-[fadeInUp_0.22s_ease_forwards]">
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-base font-extrabold text-[#0c0c0d]">
              N
            </div>
            <span className="font-bold text-base">Nexus</span>
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-[var(--text3)]">
              Sign in to continue to your workspace
            </p>
          </div>

          <div className="bg-[var(--sidebar)] border border-[var(--border)] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.35)] space-y-6">
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border2)] bg-[var(--surface)] text-sm cursor-pointer hover:border-[var(--border3)] hover:bg-[var(--surface2)] transition"
            >
              {googleLoading ? (
                <div className="spinner w-4 h-4" />
              ) : (
                <span>G</span>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text3)] tracking-wider">OR</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                focused={focused === "email"}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                focused={focused === "password"}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  email && password
                    ? "bg-[var(--accent)] text-[#0c0c0d]"
                    : "bg-[var(--surface2)] text-[var(--text3)]"
                }`}
              >
                {loading ? <div className="spinner w-4 h-4" /> : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[var(--text3)]">
            No account?{" "}
            <Link href="/auth/register" className="text-[var(--accent)] font-medium">
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
  focused,
  onFocus,
  onBlur,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className={`block text-xs font-medium transition ${
          focused ? "text-[var(--accent)]" : "text-[var(--text2)]"
        }`}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full px-3 py-3 rounded-xl border text-sm outline-none transition ${
          focused
            ? "border-[var(--accent)] bg-[rgba(200,169,110,0.04)]"
            : "border-[var(--border2)] bg-[var(--surface)]"
        }`}
      />
    </div>
  );
}
