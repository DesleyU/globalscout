import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "@/lib/auth/constants";

export default function EmptyProfileRedirectPage() {
  redirect(DEFAULT_AUTHENTICATED_REDIRECT);
}
