import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Loading...</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we load your content.
        </p>
      </div>
    </div>
  );
}
