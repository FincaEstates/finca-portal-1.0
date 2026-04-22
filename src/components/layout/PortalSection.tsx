import { ReactNode } from "react";
import styles from "./portal-shell.module.css";

type PortalSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function PortalSection({
  title,
  description,
  children,
}: PortalSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {description ? (
        <p className={styles.sectionDescription}>{description}</p>
      ) : null}
      {children}
    </section>
  );
}
