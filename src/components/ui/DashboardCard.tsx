import { ReactNode } from "react";

type DashboardCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
};

export default function DashboardCard({
  label,
  value,
  icon,
}: DashboardCardProps) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold text-black">{label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-black">
            {value}
          </p>
        </div>

        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
