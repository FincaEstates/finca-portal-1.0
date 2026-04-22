import { ReactNode } from "react";
import styles from "./portal-shell.module.css";

type PortalShellProps = {
  title: string;
  subtitle?: string;
  sidebar: ReactNode;
  children: ReactNode;
};

export default function PortalShell({
  title,
  subtitle,
  sidebar,
  children,
}: PortalShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>{sidebar}</aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
