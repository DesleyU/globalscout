import { cn } from "@/lib/utils";

type PasswordStrength = {
  label: string;
  barClass: string;
  textClass: string;
  widthClass: string;
};

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (password.length === 0) {
    return null;
  }

  if (password.length < 6) {
    return {
      label: "Too short",
      barClass: "bg-red-500",
      textClass: "text-red-500",
      widthClass: "w-1/4",
    };
  }

  if (password.length < 10) {
    return {
      label: "Fair",
      barClass: "bg-amber-500",
      textClass: "text-amber-500",
      widthClass: "w-2/4",
    };
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      label: "Good",
      barClass: "bg-blue-500",
      textClass: "text-blue-500",
      widthClass: "w-3/4",
    };
  }

  return {
    label: "Strong",
    barClass: "bg-green-500",
    textClass: "text-green-500",
    widthClass: "w-full",
  };
}

type PasswordStrengthBarProps = {
  password: string;
};

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password);

  if (!strength) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="h-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            strength.barClass,
            strength.widthClass,
          )}
        />
      </div>
      <p className={cn("mt-1 text-xs", strength.textClass)}>{strength.label}</p>
    </div>
  );
}
