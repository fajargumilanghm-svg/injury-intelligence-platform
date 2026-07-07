import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Injury Management | Injury Intelligence Platform",
  description: "Track injuries, recovery milestones, and return-to-play progression",
};

export default function InjuriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
