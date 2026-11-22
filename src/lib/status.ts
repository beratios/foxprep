import type { OrderStatus } from "@/generated/prisma/client";

export const STATUS: Record<OrderStatus, { label: string; tone: "fox" | "ink" | "ok" | "muted" | "warn"; hint: string }> = {
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "warn", hint: "Pay to unlock the warehouse address." },
  AWAITING_INBOUND: { label: "Awaiting inbound", tone: "fox", hint: "Send the shipping address to your supplier." },
  RECEIVED: { label: "Received", tone: "ink", hint: "Your cartons are in. We're counting and checking." },
  IN_PREP: { label: "In prep", tone: "ink", hint: "Labeling and packing now." },
  AWAITING_LABELS: { label: "Waiting for labels", tone: "warn", hint: "Prep is done. Upload your shipping labels so we can send it out." },
  SHIPPED: { label: "Shipped", tone: "ok", hint: "On its way to the fulfillment center." },
  COMPLETED: { label: "Completed", tone: "ok", hint: "Done." },
  CANCELLED: { label: "Cancelled", tone: "muted", hint: "This order was cancelled." },
};

export const FLOW: OrderStatus[] = ["AWAITING_PAYMENT", "AWAITING_INBOUND", "RECEIVED", "IN_PREP", "AWAITING_LABELS", "SHIPPED", "COMPLETED"];
