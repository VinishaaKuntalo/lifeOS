import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variant === "default" && "border-border bg-card text-card-foreground",
        variant === "destructive" &&
          "border-destructive/40 bg-destructive/10 text-destructive-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Alert };
