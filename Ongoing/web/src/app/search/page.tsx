import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchRedirect({ searchParams }: Props) {
  const params = new URLSearchParams();
  const resolved = await searchParams;
  if (resolved) {
    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === "string") params.set(key, value);
      else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
    }
  }
  const q = params.toString();
  redirect(q ? `/admin/search?${q}` : "/admin/search");
}
