import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A93E]/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        gold: "bg-[#C8A93E] text-white shadow-sm hover:bg-[#B4972F]",
        gold_outline:
          "border border-[#C8A93E]/60 text-[#A98F2E] bg-white hover:bg-[#C8A93E]/10 hover:border-[#C8A93E]",
        ghost:
          "border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:bg-[#F4F4F4] hover:border-[#D4D4D4]",
        dark: "bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-[#333333]",
        emerald:
          "bg-white text-[#1A1A1A] border border-[#E5E5E5] hover:bg-[#F4F4F4]",
        link: "text-[#A98F2E] underline-offset-4 hover:underline",
        danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
      },
      size: {
        xs: "h-7 px-2.5 text-[11px] rounded-sm",
        sm: "h-8 px-3 text-xs rounded-sm",
        md: "h-9 px-4 text-xs rounded",
        lg: "h-10 px-5 text-sm rounded",
        xl: "h-11 px-6 text-sm rounded",
        icon: "h-8 w-8 rounded-sm",
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
