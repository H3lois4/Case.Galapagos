import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string;
  erro?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { rotulo, erro, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {rotulo && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[13px] font-semibold text-tinta"
        >
          {rotulo}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-12 w-full rounded-chip border border-tinta-suave/50 bg-fundo-alt px-3.5 text-[15px] text-tinta",
          "placeholder:text-tinta-suave/70 focus:border-azul-elas focus:outline-none focus:ring-2 focus:ring-azul-elas/30",
          erro && "border-perigo focus:border-perigo focus:ring-perigo/30",
          className,
        )}
        aria-invalid={erro ? true : undefined}
        {...props}
      />
      {erro && <p className="mt-1 text-[12px] text-perigo">{erro}</p>}
    </div>
  );
});
