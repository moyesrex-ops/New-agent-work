import { redirect } from "next/navigation";

/**
 * There is no marketing site in P0. A supplier arrives on an invite link and a
 * buyer arrives on the console; anyone else goes to the sign-in that fits the
 * device they are most likely holding.
 */
export default function Root() {
  redirect("/s");
}
