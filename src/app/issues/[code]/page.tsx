import { redirect } from "next/navigation";

export default function IssuesCodeRedirectPage({
  params,
}: {
  params: { code: string };
}) {
  redirect(`/browse/${params.code}`);
}
