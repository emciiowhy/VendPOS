# VendPOS

VendPOS is a multi-tenant Point-of-Sale system. Each merchant business signs up as a **Tenant** and operates inside an isolated workspace containing its own users, products, and transactions.

## Language

**Tenant**:
A single merchant business operating from one physical shop. Owns all users, products, and transactions inside its workspace and pays for a subscription tier.
_Avoid_: Store, shop, account, workspace, merchant, business

**Transaction**:
A completed checkout event: a customer paid a Tenant for one or more Products via a User (cashier). Immutable once recorded — see [ADR-0001](docs/adr/0001-transactions-are-append-only.md).
_Avoid_: Sale, order, invoice, purchase, receipt

**Transaction Item**:
A single product line inside a Transaction, recording the quantity sold and the **unit price at the moment of sale** (not the product's current price).
_Avoid_: Sale item, line item, cart item, basket item

**User**:
An Owner or Cashier employed by exactly one Tenant. Identified by a globally unique email. Soft-deletable via `is_active`.
_Avoid_: Employee, staff, member, account

**Product**:
A catalog item belonging to one Tenant. Carries its own `current_stock` and `reorder_level` — there is no separate inventory entity. Soft-deletable via `is_active`.
_Avoid_: Item, good, stock item, SKU (SKU is a field on a Product, not a synonym)

**Subscription Tier**:
The billing plan a Tenant is on — Starter, Advanced, or Pro. Stored as a string on `tenants.subscription_tier`. Controls per-tier limits (limits themselves are not yet enforced — see PRD scope).
_Avoid_: Plan, package, tier (alone)

## Flagged ambiguities

**"Sale" vs "Transaction"** — Internally (code, ADRs, this glossary) we say *Transaction*. End-user-facing UI strings may still read "Sales" if that's what cashiers and owners naturally say — that's a UX-language choice, not a domain decision.

**"Super admin" and "Customer"** — Asked for during the landing/UX session on 2026-05-29 and explicitly **not added** to the domain. Reasons: PRD D5 locked roles to Owner + Cashier (any platform staff live outside the per-tenant model); a Customer entity would change VendPOS from a POS to a POS-plus-e-commerce product, which contradicts the scope locked in [[ADR-0001]] and the PRD on GitHub Issue #1. The login page surfaces them as **disabled placeholder buttons** with a "Coming in v2" tooltip so the asks are visible but not faked. Add them later only by superseding D5 and amending or adding ADRs.

## Verified invariants

**Stock decrement is race-safe under READ COMMITTED** (verified 2026-05-28):
A throwaway prototype (`backend/src/prototypes/stock-race-prototype.js`, since deleted) ran five concurrent-decrement scenarios against the dev Neon DB. In every scenario, the guarded UPDATE pattern

```sql
UPDATE inventory SET quantity = quantity - $1
 WHERE store_id = $2 AND product_id = $3 AND quantity >= $1
-- rollback if rowCount = 0
```

produced the correct number of successes (never more than `floor(initial_stock / qty)`) and never let stock go negative. Includes the case of 20 concurrent cashiers racing for 20 units at qty=2 → exactly 10 succeeded. Conclusion: when the migration moves stock from `inventory.quantity` to `products.current_stock`, the same WHERE-guard pattern is sufficient. No `SELECT ... FOR UPDATE` or `SERIALIZABLE` isolation is required for this invariant.

## Example dialogue

_(to be filled in once more terms are resolved)_
