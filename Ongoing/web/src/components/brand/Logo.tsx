import Link from "next/link";

export function Logo({
  href = "/",
  tone = "light",
  compact = false,
}: {
  href?: string;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link href={href} className="inline-flex items-center">
        <img src="/brand/icon.svg" alt="SurakshaSetu" width={36} height={36} />
      </Link>
    );
  }
  const src = tone === "dark" ? "/brand/logo-dark.svg" : "/brand/logo-light.svg";
  return (
    <Link href={href} className="inline-flex items-center">
      <img src={src} alt="SurakshaSetu. Connecting Streets. Protecting Lives." className="h-12 w-auto" />
    </Link>
  );
}
