"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import styles from "@/components/layout/portal-shell.module.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorText("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorText("Unable to load user after login.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin");
    } else if (profile?.role === "tenant") {
      router.push("/tenant");
    } else {
      setErrorText("No valid portal role is assigned to this user.");
    }

    setLoading(false);
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Portal Login</h1>
        <p className={styles.authText}>
          Sign in to access the FINCA admin or tenant portal.
        </p>

        <form onSubmit={handleLogin} className={styles.formGrid}>
          <div className={styles.field + " " + styles.fieldFull}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div className={styles.field + " " + styles.fieldFull}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <div className={styles.field + " " + styles.fieldFull}>
            <button className={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        {errorText ? <div className={styles.error}>{errorText}</div> : null}
      </div>
    </div>
  );
}
