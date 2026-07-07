import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Load | Injury Intelligence Platform",
  description: "Log training sessions and monitor load metrics",
};

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
