import { redirect } from "next/navigation";

export default function BrowseRootPage() {
  redirect("/projects/all");
}
