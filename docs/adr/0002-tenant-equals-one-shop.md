# Tenant equals one shop

A **Tenant** represents one merchant business operating from one physical shop. There is no `shops` / `locations` / `branches` entity. All products, users, transactions, and stock counts belong directly to a Tenant — there is no second level of physical scope underneath it.

This matches the ERD, keeps every FK one hop from `tenants`, and lets `products.current_stock` be a single counter per product (rather than a per-shop join). The migration collapses the prototype's `stores` table into `tenants` and re-keys every former `store_id` column to `tenant_id`.

Consequences future readers should know:
- If multi-shop support is needed later, it requires a structural migration: a new `shops` table, an FK on `transactions` and `products` (or `inventory`), and re-keying historical data. Not a small change. The decision here is to ship single-shop first and pay that cost only if real demand appears.
- A merchant that runs five stalls today is modeled as one Tenant whose stock and sales are pooled. We accept that limitation rather than design for a multi-shop future that may never materialize.

Rejected alternative: introduce a `shops` table now "just in case." That adds an entity and an FK every query has to filter by, for a capability the ERD doesn't require and no concrete user has asked for. Premature complexity.
