"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-background text-foreground">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md px-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">
              A critical error occurred. Please try again or contact support if the problem persists.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={reset} variant="default">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = "/"} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
