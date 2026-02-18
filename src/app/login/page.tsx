import { redirect } from "next/navigation";

// Login page is no longer needed - redirect to home page for user selection
export default function LoginPage() {
  redirect("/");
}
