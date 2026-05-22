# Splitwise-Like Group Expense Splitting Feature

Add a full group expense tracking and settlement system to Spendly — users can create groups, add registered members, track shared expenses, and settle debts with a minimum-transactions algorithm.

## User Review Required

> [!IMPORTANT]
> **Navigation placement**: I plan to replace the existing "Budgets" placeholder in the mobile drawer with "Groups", and add a new "Groups" icon to the desktop sidebar. The bottom nav stays the same (5 tabs max). Groups will be accessible via `#/groups` route and through the hamburger menu / sidebar.

> [!WARNING]  
> **User discovery**: To add members to groups, users need to search for other registered users by email. This requires a Postgres `security definer` function that reads from `auth.users`. This is standard Supabase practice but worth noting — it exposes only `id`, `email`, and `display_name` to authenticated users performing a search.

## Open Questions

1. **Split types**: Should we support only **equal splits** initially, or also **custom amount splits** and **percentage splits**? I recommend starting with equal + custom amounts.
2. **Currency**: The app uses INR (₹). Should group expenses also be INR-only? I'll assume yes.
3. **Group size limit**: Any max members per group? I'll default to no limit.

---

## Proposed Changes

### Component 1: Database Schema

#### [NEW] [004_split_tables.sql](file:///home/dell-ubuntu/myfolder/Milap/Spendly/supabase/migrations/004_split_tables.sql)

5 new tables:

```sql
-- Groups
split_groups (id uuid PK, name text, description text, created_by uuid FK→auth.users, created_at timestamptz)

-- Members  
split_group_members (id uuid PK, group_id FK→split_groups, user_id FK→auth.users, joined_at timestamptz, UNIQUE(group_id, user_id))

-- Expenses
split_expenses (id uuid PK, group_id FK→split_groups, paid_by FK→auth.users, amount numeric(12,2), description text, expense_date date, created_at timestamptz)

-- Per-person shares for each expense
split_expense_shares (id uuid PK, expense_id FK→split_expenses, user_id FK→auth.users, share_amount numeric(12,2), UNIQUE(expense_id, user_id))

-- Recorded settlements between members
split_settlements (id uuid PK, group_id FK→split_groups, paid_by FK→auth.users, paid_to FK→auth.users, amount numeric(12,2), note text, settled_at timestamptz)
```

---

#### [NEW] [005_split_rls.sql](file:///home/dell-ubuntu/myfolder/Milap/Spendly/supabase/migrations/005_split_rls.sql)

- RLS on all 5 tables, scoped to group membership via `EXISTS (SELECT 1 FROM split_group_members WHERE group_id = ... AND user_id = auth.uid())`
- `search_users_by_email(query text)` — a `security definer` function that searches `auth.users` by email prefix, returning `{id, email, raw_user_meta_data->full_name}`. Limited to 10 results.

---

### Component 2: Frontend Services

#### [NEW] [groups.js](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/services/groups.js)

All Supabase client calls for the groups feature:

| Function | Purpose |
|---|---|
| `fetchGroups()` | List groups current user belongs to |
| `createGroup(name, description)` | Create group + auto-add creator as member |
| `fetchGroupDetail(groupId)` | Get group with members, expenses, shares, settlements |
| `searchUsers(query)` | Call `search_users_by_email` RPC |
| `addMember(groupId, userId)` | Insert into `split_group_members` |
| `removeMember(groupId, userId)` | Delete from `split_group_members` |
| `addExpense(groupId, paidBy, amount, description, date, shares[])` | Insert expense + shares |
| `deleteExpense(expenseId)` | Delete expense and cascaded shares |
| `recordSettlement(groupId, paidBy, paidTo, amount, note)` | Insert into `split_settlements` |

---

### Component 3: Settlement Algorithm

#### [NEW] [splitSettleUtils.js](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/lib/splitSettleUtils.js)

**Core algorithm** — minimum transactions to settle all debts:

1. For each member, compute `net = (total they paid) − (total they owe) + (settlements received) − (settlements paid)`
2. Separate into creditors (net > 0) and debtors (net < 0)
3. Greedy match: largest debtor pays largest creditor, repeat until all zero

Also exports: `computeBalances(expenses, shares, settlements, members)` → per-member balance map.

---

### Component 4: Custom Hook

#### [NEW] [useGroups.js](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/hooks/useGroups.js)

State management hook wrapping the service layer:
- `groups[]`, `selectedGroup`, `loading`, `error`
- `loadGroups()`, `loadGroupDetail(id)`, `createGroup()`, `addExpense()`, `settle()`
- Exposes computed balances via `splitSettleUtils`

---

### Component 5: UI Components (5 files)

All in a new `frontend/src/components/groups/` directory:

#### [NEW] GroupsList.jsx
- Card grid of all user's groups
- Each card: group name, member avatars (first letter circles), net balance indicator
- "Create Group" button → opens modal
- Click card → navigates to `#/groups/{id}`

#### [NEW] CreateGroupModal.jsx
- Overlay modal (follows existing `fab-popup` / `settle-panel-overlay` pattern)
- Group name + description inputs
- Email search input → debounced search → shows matching users
- Selected members list with remove buttons
- Create button

#### [NEW] GroupDetail.jsx
- Header: group name, member count, settings
- **Balances tab**: per-member balance cards (green = owed, red = owes)
- **Expenses tab**: chronological expense list with who paid, amount, split info
- **Settle tab**: computed minimum settlements with "Record Payment" buttons
- FAB-style "Add Expense" button

#### [NEW] AddExpenseModal.jsx  
- Who paid (dropdown of group members)
- Amount input (₹)
- Description input
- Date picker (reuse existing CalendarPopup pattern)
- Split among: checkboxes for members, toggle equal/custom
- If custom: individual amount inputs

#### [NEW] SettleUpModal.jsx
- Shows a specific settlement (payer → payee, amount)
- Confirm button to record the settlement
- Optional note field

---

### Component 6: Navigation & Routing Integration

#### [MODIFY] [constants.js](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/lib/constants.js)
- No change to `NAV_TABS` (keep 5 tabs, groups accessed via drawer/sidebar)

#### [MODIFY] [utils.js](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/lib/utils.js)
- Add `groups` route parsing in `getRouteFromHash()` (including `groups/:id` sub-route)

#### [MODIFY] [Icons.jsx](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/components/Icons.jsx)
- Add `"users"` and `"split"` icon cases for group-related UI

#### [MODIFY] [MobileDrawer.jsx](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/components/MobileDrawer.jsx)
- Replace "Budgets" link with "Groups" (`value: "groups"`)

#### [MODIFY] [Layout.jsx](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/components/Layout.jsx)
- Add "Groups" item to `DesktopSidebar` nav (below existing items, above user section)

#### [MODIFY] [App.jsx](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/App.jsx)
- Import new group components
- Add `useGroups` hook
- Add route handlers for `groups` and `groups/:id` in `screenContent`
- Pass session to group components

---

### Component 7: Styles

#### [MODIFY] [styles.css](file:///home/dell-ubuntu/myfolder/Milap/Spendly/frontend/src/styles.css)

New CSS sections (~400 lines) following existing design patterns:

- **Groups list**: `.groups-grid`, `.group-card` (glassmorphism cards matching existing `.card` style)
- **Create group modal**: `.create-group-overlay`, `.create-group-modal` (matching `.settle-panel-overlay` pattern)
- **Group detail**: `.group-detail`, `.group-tabs`, `.balance-card`, `.expense-row`
- **Add expense modal**: `.add-expense-modal` (matching existing form styles)
- **Member search**: `.member-search`, `.search-result-item`, `.member-chip`
- **Settlement cards**: `.settle-card` with green/red indicators
- Responsive: mobile-first, desktop adaptation via existing breakpoints

---

## Verification Plan

### Automated Tests
```bash
# 1. Run the dev server and verify no build errors
cd frontend && npm run dev

# 2. Verify migrations are syntactically valid
cat supabase/migrations/004_split_tables.sql | head
cat supabase/migrations/005_split_rls.sql | head
```

### Manual Verification (Browser Testing)
1. Navigate to Groups screen via drawer/sidebar
2. Create a new group with a name
3. Search for users by email, add 2-3 members
4. Add expenses with different payers and equal splits
5. View balance summary — verify totals are correct
6. Click "Settle Up" — verify minimum transactions algorithm output
7. Record a settlement — verify balances update
8. Test responsive layout on mobile and desktop viewports

### Algorithm Verification
- Create a scratch test for the settlement algorithm with known inputs:
  - A pays 300, B pays 0, C pays 0, split equally → B owes 100 to A, C owes 100 to A
  - A pays 600, B pays 300, C pays 0, split equally → C owes 300 to A (net minimum)
