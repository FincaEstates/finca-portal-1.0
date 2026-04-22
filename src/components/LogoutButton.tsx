"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import styles from "@/components/layout/portal-shell.module.css";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={styles.secondaryButton}
    >
      Sign Out
    </button>
  );
}
