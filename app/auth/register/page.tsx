"use client";

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
  const [focused, setFocused] = useState<"name" | "email" | "password" | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await signUp.email({ email, password, name });
      if (res.error) {
        if (res.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          toast.error("An account with this email already exists");
        } else {
          toast.error(res.error.message || "Registration failed");
        }
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

  async function handleGoogle(): Promise<void> {
    await signIn.social({ provider: "google", callbackURL: "/chat" });
  }

  const isValid = name.trim() && email.trim() && password.length >= 8;

  const steps = [
    { label: "8+ characters", done: password.length >= 8 },
    { label: "Name entered", done: name.trim().length > 0 },
    { label: "Valid email", done: /\S+@\S+\.\S+/.test(email) },
  ];

  return (
    <div className="min-h-screen flex bg-(--bg) relative overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-1/5 -right-1/10 w-150 h-150 rounded-full bg-[radial-gradient(circle,rgba(200,169,110,0.06)_0%,transparent_70%)]" />
        <div className="absolute -bottom-1/5 -left-1/10 w-125 h-125 rounded-full bg-[radial-gradient(circle,rgba(91,156,246,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="flex-1 flex items-start md:items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-105 space-y-8 animate-[fadeInUp_0.22s_ease_forwards]">
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 bg-(--accent) rounded-xl flex items-center justify-center font-extrabold text-[#0c0c0d]">
              N
            </div>
            <span className="font-bold text-base">Nexus</span>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-(--text3)">Join your team on Nexus</p>
          </div>

          <div className="bg-(--sidebar) border border-(--border) rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.35)] space-y-6">
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-(--border2) bg-(--surface) text-sm hover:border-(--border3) hover:bg-(--surface2) transition"
            >
              <span>G</span>
              Continue with Google
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-(--border)" />
              <span className="text-xs text-(--text3)">OR</span>
              <div className="flex-1 h-px bg-(--border)" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

              {password.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs -mt-1">
                  {steps.map(({ label, done }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-1 ${
                        done ? "text-(--online)" : "text-(--text3)"
                      }`}
                    >
                      <span>{done ? "✓" : "·"}</span>
                      {label}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isValid}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  isValid
                    ? "bg-(--accent) text-[#0c0c0d]"
                    : "bg-(--surface2) text-(--text3)"
                }`}
              >
                {loading ? (
                  <div className="spinner w-4 h-4" />
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[var(--text3)]">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[var(--accent)] font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center w-[380px] px-12 py-16 border-l border-[var(--border)] relative z-10 gap-10">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase text-[var(--accent)] mb-3">
            What you get
          </div>
          <div className="text-2xl font-bold leading-snug">
            A smarter way
            <br />
            to work together.
          </div>
        </div>

        <div className="flex flex-col gap-6">
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
            <div key={title} className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-sm"
                style={{ color }}
              >
                {icon}
              </div>
              <div>
                <div className="text-sm font-semibold mb-1">{title}</div>
                <div className="text-xs text-[var(--text3)] leading-relaxed">
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
