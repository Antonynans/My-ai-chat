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
        if (res.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          toast.error("An account with this email already exists");
        } else {
          toast.error(res.error.message || "Registration failed");
        }

        return;
      }

      toast.success("Account created successfully!");
      if (!res.error) {
        await signIn.email({ email, password });
        router.push("/chat");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn.social({ provider: "google", callbackURL: "/chat" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg) p-5 relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-40
        bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)]
        bg-size-[40px_40px]"
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-11 h-11 bg-(--accent) rounded-xl flex items-center justify-center mx-auto mb-3 text-[20px] font-extrabold text-[#0c0c0d]">
            N
          </div>

          <h1 className="text-2xl font-bold">Create your account</h1>

          <p className="text-[13px] text-(--text3) mt-1">
            Join your team on Nexus
          </p>
        </div>

        <div className="bg-(--sidebar) border border-(--border) rounded-2xl p-7">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 mb-5 px-4 py-2.5 rounded-lg
              border border-(--border2) bg-(--surface) text-(--text)
              text-[13.5px] transition hover:border-(--border3)"
          >
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
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-(--border)" />
            <span className="text-[11px] text-(--text3)">or</span>
            <div className="flex-1 h-px bg-(--border)" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-(--text2) mb-1.5 font-medium">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alice Chen"
                className="w-full px-3 py-2.5 rounded-lg border border-(--border2)
                  bg-(--surface) text-(--text) text-sm outline-none
                  focus:border-(--accent)"
              />
            </div>

            <div>
              <label className="block text-xs text-(--text2) mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="alice@company.com"
                className="w-full px-3 py-2.5 rounded-lg border border-(--border2)
                  bg-(--surface) text-(--text) text-sm outline-none
                  focus:border-(--accent)"
              />
            </div>

            <div>
              <label className="block text-xs text-(--text2) mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8+ characters"
                className="w-full px-3 py-2.5 rounded-lg border border-(--border2)
                  bg-(--surface) text-(--text) text-sm outline-none
                  focus:border-(--accent)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                bg-(--accent) text-[#0c0c0d] text-sm font-semibold
                transition hover:opacity-90"
            >
              {loading ? (
                <div className="spinner border-t-[#0c0c0d] border-[rgba(0,0,0,0.2)]" />
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-(--text3) mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-(--accent) font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
