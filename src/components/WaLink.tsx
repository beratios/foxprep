/** Admin helper: a phone number that opens a WhatsApp chat. */
export function WaLink({ phone, className = "" }: { phone: string; className?: string }) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `1${digits}`; // Canadian/US number written without country code
  return (
    <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className={`font-semibold text-green-700 underline-offset-2 hover:underline ${className}`}>
      {phone}
    </a>
  );
}
