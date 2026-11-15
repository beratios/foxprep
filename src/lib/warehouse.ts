export function warehouse() {
  return {
    name: process.env.WAREHOUSE_NAME || "FoxPrep",
    street: process.env.WAREHOUSE_STREET || "123 Example St, Unit 4",
    city: process.env.WAREHOUSE_CITY || "Hamilton",
    province: process.env.WAREHOUSE_PROVINCE || "ON",
    postal: process.env.WAREHOUSE_POSTAL || "L8E 0A1",
    country: "Canada",
    phone: process.env.WAREHOUSE_PHONE || "+1 (905) 555-0100",
  };
}

/** Address line the supplier must print, so we can match cartons to an order on arrival. */
export function attentionLine(customerCode: string, orderRef: string) {
  return `ATTN: ${customerCode} / ${orderRef}`;
}
