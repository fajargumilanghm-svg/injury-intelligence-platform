import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Predictive AI | Injury Intelligence Platform",
  description: "AI-powered injury risk prediction and analysis",
};

export default function PredictiveAILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
