import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /* Primary CTA — solid violet (cars.com), rounded-rectangle */
        gold: "bg-[#8136B2] text-white shadow-sm hover:bg-[#370B55] hover:shadow-card-hover",
        gold_outline:
          "border border-[#8136B2]/40 text-[#8136B2] bg-transparent hover:bg-[#8136B2] hover:text-white hover:border-[#8136B2]",
        ghost:
          "border border-[#E5E5EA] bg-white text-[#141414] hover:bg-[#F4F4F6] hover:border-[#D8D4C6]",
        dark: "bg-[#141414] text-white border border-[#141414] hover:bg-[#2E2C28]",
        /* Violet accent (same family as primary) */
        accent: "bg-[#8136B2] text-white shadow-sm hover:bg-[#370B55]",
        /* Light button for use ON dark/violet surfaces */
        onDark: "bg-white text-[#8136B2] shadow-sm hover:bg-[#F3EDF9]",
        emerald:
          "bg-white text-[#141414] border border-[#E5E5EA] hover:bg-[#F4F4F6]",
        link: "text-[#8136B2] underline-offset-4 hover:underline",
        danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
      },
      size: {
        xs: "h-7 px-3 text-[11px] rounded-md",
        sm: "h-8 px-3.5 text-xs rounded-md",
        md: "h-9 px-4 text-xs rounded-md",
        lg: "h-10 px-6 text-sm rounded-md",
        xl: "h-12 px-7 text-sm rounded-md",
        icon: "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        // Some browser extensions (password managers / form fillers) inject a
        // `fdprocessedid` attribute onto buttons before React hydrates, which
        // triggers a benign hydration-mismatch warning. Suppressing it here.
        suppressHydrationWarning
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
