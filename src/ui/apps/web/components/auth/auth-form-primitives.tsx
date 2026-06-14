import { cn } from "@/lib/utils";

type AuthFormErrorProps = {
  message: string;
};

export function AuthFormError({ message }: AuthFormErrorProps) {
  return (
    <div
      className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {message}
    </div>
  );
}

type AuthFieldLabelProps = {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthFieldLabel({
  htmlFor,
  children,
  className,
}: AuthFieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-sm font-medium text-gray-700",
        className,
      )}
    >
      {children}
    </label>
  );
}
