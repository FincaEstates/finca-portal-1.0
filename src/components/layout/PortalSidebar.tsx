"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./portal-shell.module.css";

type SidebarItem = {
  label: string;
  href: string;
};

type PortalSidebarProps = {
  portalName: string;
  homeHref: string;
  items: SidebarItem[];
};

export default function PortalSidebar({
  portalName,
  homeHref,
  items,
}: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <div>
      <Link href={homeHref} className={styles.brand}>
        <p className={styles.brandEyebrow}>FINCA Estates</p>
        <h2 className={styles.brandTitle}>{portalName}</h2>
      </Link>

      <nav className={styles.nav}>
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
