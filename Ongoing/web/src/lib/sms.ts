/** Build SMS deep links that work across Android / iOS browsers. */
export function smsUrls(phone: string, body: string): string[] {
  const digits = phone.replace(/[^\d+]/g, "");
  const encoded = encodeURIComponent(body);
  return [
    // Android Messages / most phones
    `sms:${digits}?body=${encoded}`,
    // Older Android
    `smsto:${digits}?body=${encoded}`,
    // iOS style
    `sms:${digits}&body=${encoded}`,
    // Number only — still opens composer
    `sms:${digits}`,
  ];
}

/**
 * Open the device messaging app with a prefilled body.
 * On phones: launches Messages / SMS composer.
 * On desktop: copies the text (PCs have no SMS app).
 */
export async function openDefaultSmsApp(
  phone: string,
  body: string
): Promise<"opened" | "copied"> {
  try {
    await navigator.clipboard.writeText(body);
  } catch {
    /* clipboard optional */
  }

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Desktop browsers cannot open a phone SMS app
  if (!isMobile) {
    return "copied";
  }

  for (const href of smsUrls(phone, body)) {
    try {
      const a = document.createElement("a");
      a.href = href;
      a.setAttribute("rel", "noopener");
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return "opened";
    } catch {
      // try next format
    }
  }

  return "copied";
}
