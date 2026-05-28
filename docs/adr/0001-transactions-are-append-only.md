# Transactions are append-only

A **Transaction** records a completed checkout and is immutable once written. The `transactions` table carries `total_amount` + `created_at` + line items, and nothing else — no `status`, no `payment_method`, no `notes`. Void and refund are deferred features: when they are introduced, they will be modeled as separate entities (e.g. a `Void` record that references the original Transaction), not as mutable columns on the transaction itself.

This keeps the financial ledger audit-safe (the historical record can't be silently edited) and matches the ERD as drawn. The prototype's mutable `sales` table (with `status IN ('completed','void','refunded')` and a `POST /api/sales/:id/void` route that decremented stock back) is removed by this migration; the capability returns later in a different shape.

Rejected alternative: keep the `status` / `payment_method` / `notes` columns from the prototype as-is. That preserves the existing void/refund flow but makes the financial table mutable, complicates auditing, and locks us into one set of payment categories at the schema layer.
