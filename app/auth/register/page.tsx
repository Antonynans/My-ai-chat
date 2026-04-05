"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await signUp.email({ email, password, name });
      if (res.error) {
        toast.error(
          res.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
            ? "An account with this email already exists"
            : res.error.message || "Registration failed",
        );
        return;
      }
      toast.success("Account created!");
      await signIn.email({ email, password });
      router.push("/chat");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn.social({ provider: "google", callbackURL: "/chat" });
  }

  const isValid = name.trim() && email.trim() && password.length >= 8;

  const checks = [
    { label: "8+ characters", done: password.length >= 8 },
    { label: "Name entered", done: name.trim().length > 0 },
    { label: "Valid email", done: /\S+@\S+\.\S+/.test(email) },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg)] relative overflow-hidden">
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[15%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(200,169,110,0.06)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(91,156,246,0.05)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[400px] animate-[fadeInUp_0.22s_ease_forwards]">
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-9">
            <div className="w-[30px] h-[30px] bg-[var(--accent)] rounded-[7px] flex items-center justify-center text-[14px] font-black text-[#0c0c0d] font-[var(--ff-display)]">
              N
            </div>
            <span className="font-[var(--ff-display)] font-bold text-[15px]">
              Nexus
            </span>
          </div>

          <h1 className="font-[var(--ff-display)] text-[22px] font-bold text-center mb-1.5 tracking-[-0.3px]">
            Create your account
          </h1>
          <p className="text-[13px] text-[var(--text3)] text-center mb-7">
            Join your team on Nexus
          </p>

          {/* Card */}
          <div className="bg-[var(--sidebar)] border border-[var(--border)] rounded-2xl p-7 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            {/* Google */}
            <button
              onClick={handleGoogle}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-[9px] mb-5
                border border-[var(--border2)] bg-[var(--surface)] text-[var(--text)]
                text-[13.5px] font-[var(--ff)] cursor-pointer
                transition-[border-color,background] duration-150
                hover:border-[var(--border3)] hover:bg-[var(--surface2)]
              "
            >
              <GoogleIcon />
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

            {/* Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <Field
                label="Display name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Alice Chen"
                focused={focused === "name"}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="alice@company.com"
                focused={focused === "email"}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="8+ characters"
                focused={focused === "password"}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />

              {/* Password strength */}
              {password.length > 0 && (
                <div className="flex gap-1.5 flex-wrap -mt-1">
                  {checks.map(({ label, done }) => (
                    <span
                      key={label}
                      className={`flex items-center gap-1 text-[11px] transition-colors duration-200 ${
                        done ? "text-[var(--online)]" : "text-[var(--text3)]"
                      }`}
                    >
                      <span className="text-[10px]">{done ? "✓" : "·"}</span>
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !isValid}
                className={`
                  w-full flex items-center justify-center gap-2
                  px-4 py-[11px] rounded-[9px] border-none mt-1.5
                  text-[13.5px] font-[var(--ff)] font-semibold
                  transition-[background,color] duration-150
                  ${
                    isValid && !loading
                      ? "bg-[var(--accent)] text-[#0c0c0d] cursor-pointer hover:opacity-88"
                      : "bg-[var(--surface2)] text-[var(--text3)] cursor-not-allowed"
                  }
                `}
              >
                {loading ? (
                  <div
                    className="spinner"
                    style={{
                      width: 14,
                      height: 14,
                      borderTopColor: "#0c0c0d",
                      borderColor: "rgba(0,0,0,0.15)",
                    }}
                  />
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[13px] text-[var(--text3)] mt-5">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[var(--accent)] no-underline font-medium hover:opacity-80 transition-opacity"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right decorative panel (≥900px) ── */}
      <div className="hidden lg:flex flex-col justify-center flex-[0_0_380px] px-12 py-12 border-l border-[var(--border)] relative z-10 gap-8">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--accent)] mb-3">
            What you get
          </div>
          <h2 className="text-[24px] font-[var(--ff-display)] font-bold leading-[1.35] tracking-[-0.4px]">
            A smarter way
            <br />
            to work together.
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {[
            {
              icon: "✦",
              title: "AI on demand",
              desc: "Type @ai in any message to get instant help from Nexus AI.",
              color: "var(--ai)",
            },
            {
              icon: "#",
              title: "Channels",
              desc: "Organize conversations by topic, team, or project.",
              color: "var(--accent)",
            },
            {
              icon: "⊙",
              title: "Live presence",
              desc: "See who's online and who's typing in real time.",
              color: "var(--online)",
            },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="flex gap-3.5 items-start">
              <div
                className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[13px] shrink-0"
                style={{ color }}
              >
                {icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold mb-0.5">{title}</div>
                <div className="text-[12px] text-[var(--text3)] leading-relaxed">
                  {desc}
                </div>
              </div>
            </div>
          ))}
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
    <div>
      <label
        className={`block text-[12px] font-medium mb-1.5 transition-colors duration-150 ${
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
        className={`
          w-full px-3 py-2.5 rounded-lg text-[13.5px]
          font-[var(--ff)] text-[var(--text)] outline-none
          border transition-[border-color,background,box-shadow] duration-150
          placeholder:text-[var(--text3)]
          ${
            focused
              ? "border-[var(--accent)] bg-[rgba(200,169,110,0.04)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_14%,transparent)]"
              : "border-[var(--border2)] bg-[var(--surface)]"
          }
        `}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
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
  );
}
