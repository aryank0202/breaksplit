import { Linking } from "react-native";

type VenmoPayload = {
  recipientHandle: string;
  amountDollars: string;
  note: string;
};

export async function openVenmoPay({
  recipientHandle,
  amountDollars,
  note,
}: VenmoPayload) {
  const handle = recipientHandle.replace(/^@/, "").trim();
  const encodedNote = encodeURIComponent(note);
  const encodedHandle = encodeURIComponent(handle);
  const encodedAmount = encodeURIComponent(amountDollars);

  const appUrl = `venmo://paycharge?txn=pay&recipients=${encodedHandle}&amount=${encodedAmount}&note=${encodedNote}`;
  const webUrl = `https://venmo.com/?txn=pay&recipients=${encodedHandle}&amount=${encodedAmount}&note=${encodedNote}`;

  try {
    await Linking.openURL(appUrl);
    return;
  } catch {
    // Fall back to web when Venmo app deeplink is unavailable.
  }

  await Linking.openURL(webUrl);
}
