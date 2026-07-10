import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /* Primary CTA — solid ink pill (reference "Contact Us" / "Buy Now") */
        gold: "bg-[#141414] text-white shadow-sm hover:bg-[#2E2C28] hover:shadow-card-hover",
        gold_outline:
          "border border-[#141414]/25 text-[#141414] bg-transparent hover:bg-[#141414] hover:text-white hover:border-[#141414]",
        ghost:
          "border border-[#E7E4DA] bg-white text-[#141414] hover:bg-[#F3F1E9] hover:border-[#D8D4C6]",
        dark: "bg-[#181C30] text-white border border-[#181C30] hover:bg-[#23283F]",
        /* Amber accent pill for promos */
        accent: "bg-[#F0941F] text-white shadow-sm hover:bg-[#D6821A]",
        emerald:
          "bg-white text-[#141414] border border-[#E7E4DA] hover:bg-[#F3F1E9]",
        link: "text-[#141414] underline-offset-4 hover:underline",
        danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
      },
      size: {
        xs: "h-7 px-3 text-[11px] rounded-full",
        sm: "h-8 px-3.5 text-xs rounded-full",
        md: "h-9 px-4 text-xs rounded-full",
        lg: "h-10 px-6 text-sm rounded-full",
        xl: "h-12 px-7 text-sm rounded-full",
        icon: "h-8 w-8 rounded-full",
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
