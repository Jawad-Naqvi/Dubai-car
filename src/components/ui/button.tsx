import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0CE5C]/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        gold: "bg-[#F0CE5C] text-[#1A1208] hover:bg-[#FFE08A]",
        gold_outline:
          "border border-[#D4AF37]/50 text-[#F0CE5C] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]",
        ghost:
          "border border-white/15 text-white hover:bg-white/5 hover:border-white/30",
        dark: "bg-[#161616] text-white border border-white/10 hover:border-white/25",
        emerald:
          "bg-[#1A1A1A] text-white border border-[#D4AF37]/30 hover:bg-[#1F1F1F]",
        link: "text-[#F0CE5C] underline-offset-4 hover:underline",
        danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
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
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
