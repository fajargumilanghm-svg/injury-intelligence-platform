import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Wellness | Injury Intelligence Platform",
  description: "Track daily wellness metrics and recovery status",
};

export default function WellnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
