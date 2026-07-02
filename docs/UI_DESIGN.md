# UI_DESIGN.md — LookUp Mobile UI Design

> Read `docs/AGENT.md` first. This file defines every screen, component, and visual decision for the Expo React Native app. No ASCII art — pure instructional design specifications.

---

## Design System

### Color Palette

All colors are defined in `src/constants/colors.ts` and referenced via NativeWind tokens or StyleSheet.

**Brand Colors**
- Primary: `#2563EB` (Blue 600) — actions, links, active states
- Primary Dark: `#1D4ED8` (Blue 700) — pressed state
- Primary Light: `#EFF6FF` (Blue 50) — backgrounds, chips

**Semantic Colors**
- Success: `#16A34A` (Green 600) — stock healthy, update success
- Warning: `#D97706` (Amber 600) — low stock warning
- Danger: `#DC2626` (Red 600) — out of stock, errors, destructive actions
- Info: `#0284C7` (Sky 600) — informational states

**Neutral Scale**
- `#F9FAFB` — screen background
- `#F3F4F6` — card backgrounds, input backgrounds
- `#E5E7EB` — dividers, borders
- `#9CA3AF` — placeholder text, disabled state
- `#6B7280` — secondary text
- `#374151` — primary text
- `#111827` — headings

**Platform Brand Colors**
- Shopee Orange: `#EE4D2D`
- Shopee Orange Light: `#FFF0EE`
- TikTok Black: `#161722`
- TikTok Pink: `#FE2C55`
- TikTok Light: `#FFF0F3`

### Dark Mode Palette

Defined in `src/constants/colors.ts` as a parallel `dark` export, toggled via `useColorScheme()`. Semantic colors (`Success`/`Warning`/`Danger`/`Info`) and platform brand colors stay the same in both modes — only neutrals and primary tints change, so a `StockIndicator` or `PlatformTag` never needs a dark-mode branch.

**Neutral Scale (Dark)**
- `#0B0F17` — screen background
- `#1A1F2B` — card backgrounds, input backgrounds
- `#2A3040` — dividers, borders
- `#6B7280` — placeholder text, disabled state (unchanged)
- `#9CA3AF` — secondary text
- `#E5E7EB` — primary text
- `#F9FAFB` — headings

**Primary Tints (Dark)**
- Primary: `#3B82F6` (Blue 500 — one step lighter than light-mode Primary, for contrast against dark backgrounds)
- Primary Light: `#1E3A8A` at 24% opacity — chip/badge backgrounds

Rule: any component that currently reads a hardcoded hex from the light neutral scale must instead read the themed token (e.g. `colors.background`, `colors.cardBackground`) so it resolves correctly in both modes. No component should branch on `useColorScheme()` directly for anything other than selecting which palette object to read from.

### Typography

All font sizes in `src/constants/typography.ts`.

- `xs`: 11px — badges, micro labels
- `sm`: 13px — secondary text, captions
- `base`: 15px — body text, inputs
- `md`: 17px — card titles, list items
- `lg`: 20px — section headers
- `xl`: 24px — screen titles
- `2xl`: 28px — dashboard numbers

Font weights: `regular` (400), `medium` (500), `semibold` (600), `bold` (700).

### Spacing

Use multiples of 4 only: 4, 8, 12, 16, 20, 24, 32, 40, 48.

### Border Radius

- `sm`: 6px — tags, badges
- `md`: 10px — cards, inputs
- `lg`: 14px — bottom sheets, modals
- `full`: 9999px — pills, circular elements

### Shadows

Use a single shadow definition in `constants/shadows.ts` — light elevation only. No heavy drop shadows on list items.

---

## Navigation Structure

### Root Navigator

The app has two root stacks managed by `navigation/RootNavigator.tsx`:

**Auth Stack** (shown when user is not logged in)
- `LoginScreen`
- `RegisterScreen`

**Main Stack** (shown when user is logged in)
- Bottom Tab Navigator
  - Tab 1: Home — icon: house
  - Tab 2: Products — icon: cube
  - Tab 3: Shops — icon: store
  - Tab 4: Activity — icon: clock
- Modal Stack (overlays bottom tabs)
  - `ConnectShopScreen`
  - `BulkStockUpdateScreen`
  - `BulkPriceUpdateScreen`
  - `BulkProgressScreen`
  - `EditStockScreen`
  - `EditPriceScreen`
  - `EditImageScreen`
- Pushed screens (header shown, not modal)
  - `ProductDetailScreen`
  - `ProfileScreen` — only entry point is the avatar button in `HomeScreen`'s header; not a bottom tab (low-frequency action, keeps tab bar at 4 items)

### Stack Inside Bottom Tab "Products"

`ProductListScreen` → `ProductDetailScreen` → `EditStockScreen` / `EditPriceScreen` / `EditImageScreen`

---

## Atoms (Base Components)

Located in `src/components/atoms/`.

### Button

File: `Button.tsx`

Variants:
- `primary` — solid blue background, white text
- `secondary` — white background, blue border, blue text
- `ghost` — no background, no border, blue text
- `danger` — solid red background, white text
- `platform-shopee` — Shopee orange background, white text
- `platform-tiktok` — TikTok black background, white text

Sizes:
- `sm` — 32px height, 13px text
- `md` — 44px height, 15px text (default)
- `lg` — 52px height, 17px text

Props include `loading` (shows spinner, disables tap), `disabled`, `fullWidth`, `icon` (left icon), and `iconRight`.

### Badge

File: `Badge.tsx`

A small pill-shaped label. Used for stock status, platform labels, job status.

Variants: `success`, `warning`, `danger`, `info`, `neutral`, `shopee`, `tiktok`

Size: Fixed height of 20px, horizontal padding 8px, text 11px.

### StockIndicator

File: `StockIndicator.tsx`

Displays stock number with color-coded background.

Logic:
- Stock 0: Danger background, text "Habis"
- Stock 1-10: Warning background, shows number
- Stock 11+: Success background, shows number

### PlatformTag

File: `PlatformTag.tsx`

Small tag showing platform identity. Shopee tag shows Shopee logo + "Shopee" text on orange-tinted background. TikTok tag shows TikTok logo + "TikTok" text on pink-tinted background.

### Avatar

File: `Avatar.tsx`

Circular image with fallback initials. Sizes: `sm` (32px), `md` (40px), `lg` (56px).

### Skeleton

File: `Skeleton.tsx`

Animated shimmer placeholder. Accepts `width`, `height`, `borderRadius`. Uses animated opacity 0.4 to 1.0 loop.

### Divider

File: `Divider.tsx`

1px horizontal line in `#E5E7EB`. Optional `label` prop centers text on the line.

### TextInput

File: `TextInput.tsx`

Styled input with label above, helper text below, error state. Includes `prefix` and `suffix` slot for icons or text (e.g., "Rp" prefix for price inputs).

---

## Molecules (Composed Components)

Located in `src/components/molecules/`.

### ProductCard

File: `ProductCard.tsx`

Used in product list. A horizontally laid out card with:
- Left: Product cover image, 60x60px, rounded corners. Lazy loaded via expo-image.
- Right column top: Product name, 2 lines max, `md` size, bold.
- Right column middle: Platform tag + stock indicator side by side.
- Right column bottom: Price range text, `sm` size, gray.
- Far right: Chevron icon if not in selection mode. Checkbox if in selection mode.

When selected in bulk mode: The entire card gets a blue left border (4px) and light blue background tint.

### ShopTag

File: `ShopTag.tsx`

Compact tag showing shop name with platform color. Used in product cards when viewing cross-shop results. Shows platform icon + shop name truncated to 14 chars.

### StockInput

File: `StockInput.tsx`

Input specifically for stock numbers. Features minus button on left, number input in center, plus button on right. Long-press on minus/plus for fast increment. Min value enforced as 0.

### PriceInput

File: `PriceInput.tsx`

Currency input with "Rp" prefix fixed on left (for IDR). Formats number with thousand separator as user types. Supports `originalPrice` and `salePrice` pair — shows discount percentage label when both are filled.

### VariantRow

File: `VariantRow.tsx`

Table row for variant listing inside product detail. Shows: variant name (e.g., "Merah / XL"), current stock with color, current price. Tappable to edit.

### SearchBar

File: `SearchBar.tsx`

Full-width search input with magnifier icon on left, clear button on right when has text. Debounced — calls `onSearch` after 400ms.

### EmptyState

File: `EmptyState.tsx`

Centered illustration, title, subtitle, and optional action button. Used when list has no items. Illustration is a simple SVG icon, not a heavy image.

### ErrorState

File: `ErrorState.tsx`

Red-tinted container with error message and "Coba Lagi" retry button. Used for network errors in lists.

### ProgressBar

File: `ProgressBar.tsx`

Horizontal bar showing job progress percentage. Animates fill width via Animated API. Color: blue normally, green when 100%, red if failed.

### JobStatusCard

File: `JobStatusCard.tsx`

Card showing bulk job summary. Contains: type label (Update Stok / Update Harga), progress bar, success count, failed count, status badge, timestamp.

---

## Organisms (Section-Level Components)

Located in `src/components/organisms/`.

### ProductList

File: `ProductList.tsx`

Full FlashList-based product listing. Handles: loading skeleton, error state, empty state, infinite scroll, pull-to-refresh. Accepts `onSelect` for multi-select mode. Header slot for `SearchBar` and filter chips.

### BulkActionBar

File: `BulkActionBar.tsx`

Floating bar that animates up from the bottom when products are selected in bulk mode. Sits above the tab bar. Contains: count label on left ("12 dipilih"), three action buttons: "Stok", "Harga", "Batal". Uses absolute positioning with `bottom: tabBarHeight + 8`.

Deliberately not a FAB (or stack of FABs). Primary bulk actions live inline in this bar so they read as part of the navigation surface rather than floating disconnected buttons that can cover list content — keep it this way even under future redesigns.

### ShopSelector

File: `ShopSelector.tsx`

Horizontal scrollable list of shop chips at the top of product screens. Each chip shows platform icon + shop name. Active chip is solid blue. Tapping changes active shop and reloads products.

### SummaryCard

File: `SummaryCard.tsx`

Dashboard card showing key metric for one shop. Contains shop name, platform tag, and three stat boxes: total products, low stock count, out of stock count.

### VariantTable

File: `VariantTable.tsx`

Scrollable table of product variants inside ProductDetailScreen. Columns: Variant, Stok, Harga. Each row is tappable. Header row is sticky.

---

## Screens

Located in `src/screens/`. Each screen file contains only the screen component, no reusable components.

---

### LoginScreen

File: `screens/LoginScreen.tsx`

**Layout:** Full screen white background. Content is centered vertically with KeyboardAvoidingView.

**Visual structure from top to bottom:**
The LookUp logo and app name appear at the top third of the screen. Below the logo, a subtitle reads "Kelola stok Shopee & TikTok dalam satu tempat."

Two input fields follow: Email and Password. Email input has email keyboard type and auto-lowercase. Password input has secure text entry and a show/hide toggle button on the right side.

A "Masuk" primary button (full width) submits the form. Below it, a "Belum punya akun? Daftar" ghost button navigates to RegisterScreen.

**Interaction:** While loading, the button shows a spinner and both inputs are disabled. On error, a red error message appears below the button (not as a toast — inline error text).

---

### RegisterScreen

File: `screens/RegisterScreen.tsx`

**Layout:** Scrollable to accommodate keyboard on small screens.

**Visual structure:** Back button in header. Title "Buat Akun" in large text. Three fields: Nama Lengkap, Email, Password. A "Daftar" button below. Terms of service text below the button (small, gray).

---

### HomeScreen

File: `screens/HomeScreen.tsx`

**Layout:** Scrollable screen. No header — the title "Halo, {name}" acts as a visual header.

**Visual structure from top to bottom:**

Greeting section: "Halo, [user name] 👋" in large bold text. Today's date below in gray.

Quick stats tiles: A bento-style grid, not three equal cards, rendered by the `SummaryCard` organism. Layout: one large priority tile on the left showing "Token Kedaluwarsa" count in `2xl` bold — this is the most actionable number (a seller needs to reconnect that shop), so it gets the largest visual weight. Two smaller stacked tiles on the right: "Toko Aktif" on top, "Total Produk" below. The priority tile's background auto-switches to `warningLight` when its count is greater than 0, so the eye is drawn there first without reading any label.

Do not extend this bento pattern to `ProductListScreen` or `VariantTable` — those stay as linear lists/tables. Bento tiles are reserved for dashboard summaries where tile size should signal priority; tabular/sequential data loses scannability when forced into tiles.

"Toko Anda" section header with "Lihat Semua" link. Below it, a vertical list of SummaryCard components, one per connected shop. If no shops connected, show empty state with "Hubungkan Toko" button.

"Aktivitas Terbaru" section showing last 5 update logs as small timeline items with icon, description, and time ago text.

---

### ProfileScreen

File: `screens/ProfileScreen.tsx`

**Presentation:** Pushed screen with navigation header ("Profil" + back button) — not a modal, not a tab. Only reachable via the avatar button in `HomeScreen`'s header.

**Layout:** ScrollView, no sticky footer.

**Visual structure:**

Account summary: centered Avatar (`lg`), user's name in bold below it, email in gray below that.

"Info Akun" section: card with two rows (Nama, Email) — read-only, icon + label + value. No edit action; there is no update-profile endpoint yet.

"Tampilan" section: three-way segmented control (Terang / Gelap / Sistem) that calls `useTheme().setMode()`. Active option gets a `primaryLight` background tint.

"Keluar" button in `danger` variant, full width. Tapping shows a confirm alert ("Batal" / "Keluar" destructive). Confirming: best-effort revokes the refresh token server-side, clears the React Query cache, resets shop store, then clears local auth state — in that order, so the UI can't show stale data for whoever logs in next.

Footer: small gray app version text.

---

### ProductListScreen

File: `screens/ProductListScreen.tsx`

**Layout:** The screen has a fixed header area and scrollable list below.

**Visual structure:**

Header area (not scrollable): ShopSelector horizontal scroll at the top. SearchBar below it. Filter chips row: "Semua", "Aktif", "Stok Kritis", "Habis".

When multi-select mode is active, the filter chips row is replaced by a blue bar showing "X produk dipilih" with a "Batalkan" text button on the right.

Main area: ProductList organism taking remaining screen height. Products shown as ProductCard list items.

BulkActionBar floats above bottom tab when items are selected.

**Interactions:**
- Tap product → navigate to ProductDetailScreen
- Long press product → activate multi-select mode, select that product
- Tap checkboxes → add/remove from selection
- Pull down → refresh products
- Scroll to bottom → load next page

---

### ProductDetailScreen

File: `screens/ProductDetailScreen.tsx`

**Layout:** ScrollView with sticky bottom action bar.

**Visual structure:**

Navigation header: Back button left, product name truncated to 20 chars, three-dot menu right (with options: Refresh, View on Platform).

Image section: Horizontal pager showing product images with page dots indicator. Images are full-width and square (aspect ratio 1:1). Tapping an image opens it full screen.

Below images: An "Edit Gambar" button in secondary style centered under the image pager.

Product info section: Product name in large bold text. Platform tag + status badge in a row. Category text in gray.

Variants section: "Varian & Stok" section header. VariantTable component showing all variants. "Edit Semua Stok" button in secondary style below table.

Price section: "Harga" section header. Price info displayed as a table. "Edit Semua Harga" button below.

Sticky bottom bar (not scrollable): Two large buttons side by side — "Update Stok" (primary) and "Update Harga" (secondary).

---

### EditStockScreen

File: `screens/EditStockScreen.tsx`

**Presentation:** Presented as a full-screen modal with its own navigation header.

**Layout:** ScrollView with sticky bottom save button.

**Visual structure:**

Header: "Edit Stok" title, close (X) button on right.

Product info summary at top: Small product thumbnail, product name, platform tag. Non-interactive.

"Varian" section: List of VariantRow components, each with a StockInput on the right instead of just text. If product has no variants (single SKU), show one StockInput with label "Stok".

Shortcut row above the variant list: "Isi Semua" button that opens a bottom sheet to input one value and apply to all variants.

Sticky bottom: Save button. Shows count of changes: "Simpan (3 perubahan)". Disabled if no changes.

---

### EditPriceScreen

File: `screens/EditPriceScreen.tsx`

**Presentation:** Full-screen modal.

**Layout:** Same pattern as EditStockScreen but with PriceInput per variant.

**Visual structure:**

Each variant row shows: variant name, two PriceInput fields labeled "Harga Coret" (original) and "Harga Jual" (sale price). Between them, a small label auto-calculates and shows "Diskon X%" when both filled.

Warning text appears if sale price is higher than original price.

---

### EditImageScreen

File: `screens/EditImageScreen.tsx`

**Presentation:** Full-screen modal.

**Layout:** Fixed header, scrollable grid, sticky bottom.

**Visual structure:**

Header: "Edit Gambar" title, close button. Subtitle text: "Maks 9 gambar. Urutan pertama jadi cover."

Image grid: 3-column grid. Each cell is square. Existing images show the image with a delete (X) button in top-right corner. The last cell (if < 9 images) shows a plus (+) button in dashed border style to add new image.

Reorder instructions: Small gray text "Tekan & tahan untuk mengubah urutan."

Each image can be long-pressed to enter reorder mode — cards become draggable.

Sticky bottom: "Simpan Urutan" button. Disabled if no changes.

---

### BulkStockUpdateScreen

File: `screens/BulkStockUpdateScreen.tsx`

**Presentation:** Full-screen modal.

**Layout:** Header + scrollable product list + sticky bottom.

**Visual structure:**

Header: "Update Stok Massal" title. Subtitle: "X produk dipilih."

Quick fill bar: "Isi Semua Dengan" text + number input + "Terapkan" button in one row. Lets user set one value for all selected products at once.

Product list: Each selected product shows as a card with product image (small), product name, and a StockInput on the right. If product has multiple variants, show a expandable section per variant.

Sticky bottom: "Mulai Update" button. Shows estimate: "~30 detik untuk X produk."

---

### BulkPriceUpdateScreen

File: `screens/BulkPriceUpdateScreen.tsx`

Same layout pattern as BulkStockUpdateScreen but for prices. Each product shows PriceInput fields. Quick fill applies one price to all selected products.

---

### BulkProgressScreen

File: `screens/BulkProgressScreen.tsx`

**Presentation:** Full-screen modal, cannot be dismissed while processing.

**Visual structure:**

Top half: Large circular progress indicator (not a bar — a circle) showing percentage in center. Below it, status text: "Memproses..." or "Selesai!" or "Sebagian Gagal."

Stats row: Three columns — "Total", "Berhasil" (green), "Gagal" (red) — each showing their counts.

Progress bar below stats for linear progress reference.

When completed: A "Selesai" button appears to dismiss. If partial failures, "Coba Ulang yang Gagal" button appears in secondary style next to Selesai.

Error list (if any failures): Accordion-style list of failed items showing product name and error reason. User can see what failed without leaving the screen.

---

### ShopListScreen

File: `screens/ShopListScreen.tsx`

**Layout:** Standard scrollable list in "Toko" bottom tab.

**Visual structure:**

Header: "Toko Terhubung" title. "Tambah Toko" button (primary, with + icon) in top right.

Shop cards: Each connected shop as a card with platform icon (large, color), shop name in bold, region badge, status badge (Aktif / Token Kedaluwarsa), connected date, and product count. Also a right chevron.

Tapping a shop card shows a bottom sheet with options: "Lihat Produk", "Sinkronisasi Ulang", "Putuskan Toko."

Empty state: If no shops, show illustration + "Hubungkan toko pertama Anda" + button.

---

### ConnectShopScreen

File: `screens/ConnectShopScreen.tsx`

**Presentation:** Full-screen modal.

**Visual structure:**

Step 1 — Platform Selection:
Title "Hubungkan Toko Baru." Two large cards: Shopee card (orange accent) and TikTok Shop card (black accent). Each card shows platform logo, name, and "Hubungkan" button.

Step 2 — WebView OAuth:
After selecting platform, an in-app WebView loads the OAuth URL. Native loading indicator while WebView loads. A cancel button in the top-left to go back to step 1.

Step 3 — Success:
After OAuth completes, WebView disappears and a success screen shows: checkmark animation, shop name, "Berhasil terhubung!", and a "Lihat Produk" button.

---

### ActivityScreen

File: `screens/ActivityScreen.tsx`

**Layout:** "Aktivitas" bottom tab. Tab-level scrollable list.

**Visual structure:**

Segmented control at top: "Update Stok", "Update Harga", "Bulk Job". Defaults to all.

Timeline list: Each item shows type icon, product name (or "Bulk Update X produk"), status badge, platform tag, time ago. Tapping a bulk job item navigates to job detail.

Filter chips row: "Hari Ini", "7 Hari", "30 Hari."

---

## Layout Patterns

### SafeArea
All screens must be wrapped in `SafeAreaView` from `react-native-safe-area-context`. Use `edges={['top', 'bottom']}` for tab screens, `edges={['top']}` for screens with navigation headers.

### Keyboard Handling
All screens with inputs must use `KeyboardAvoidingView` with `behavior="padding"` on iOS and `behavior="height"` on Android.

### Bottom Sheet
Use `@gorhom/bottom-sheet` for all bottom sheets (shop actions, quick fill, image options). Always set `backdropComponent` for dimmed overlay. Prefer a bottom sheet over pushing a new full-screen modal for anything that doesn't need its own navigation header — settings, confirmations, quick-fill inputs, and option menus all qualify.

### Bento Tiles (Dashboard Only)
Reserve variable-size tile grids for `HomeScreen`-style summaries where tile size should communicate priority (see Quick Stats Tiles above). Never use this pattern for:
- `ProductListScreen` — stays a linear FlashList
- `VariantTable` — stays a table
- Any screen where reading order matters (forms, step flows)

Rule of thumb: if the content has a natural sequence or is inherently tabular, it belongs in a list/table, not a tile grid.

### Motion & Microinteractions
Motion exists to give feedback, not to decorate. Keep every animation under ~250ms and tie it to a state change the user caused:
- Save success → brief checkmark scale-in on the button (not a full-screen animation)
- Stock/price value increments via long-press → no animation, just the number updating (speed matters more than delight here)
- Bulk job reaching 100% → the circular progress indicator on `BulkProgressScreen` fills and settles; no confetti or celebratory overlays

Avoid animating more than one property per interaction (e.g. don't scale AND fade AND slide the same element).

### Dark Mode Toggle
Read the active palette via a single `useTheme()` hook (`src/hooks/useTheme.tsx`) that returns the light or dark token object based on `useColorScheme()`, with a manual override (`light` / `dark` / `system`) persisted via `expo-secure-store` — reuses the same dependency already used for auth tokens rather than adding `@react-native-async-storage/async-storage` just for this. The toggle lives in `ProfileScreen` under "Tampilan". No screen-level component should call `useColorScheme()` directly.

### Loading States
Every screen that fetches data must show a skeleton layout (not a spinner) on initial load. The skeleton matches the visual structure of the loaded state.

---

## Assets & Icons

**Icon Library:** `@expo/vector-icons` using the `Feather` set exclusively. Do not mix icon sets.

**Key icon mappings:**
- Home tab: `home`
- Products tab: `package`
- Shops tab: `shopping-bag`
- Activity tab: `activity`
- Add: `plus`
- Edit: `edit-2`
- Delete: `trash-2`
- Search: `search`
- Close/X: `x`
- Back: `chevron-left`
- More options: `more-vertical`
- Success: `check-circle`
- Error: `alert-circle`
- Stock: `layers`
- Price: `tag`
- Image: `image`
- Bulk: `list`
- Sync: `refresh-cw`
- Connect: `link`

**App Icon:** To be designed. Should be a simple cube/box in brand blue on white background.

**Splash Screen:** Brand blue (#2563EB) background, white LookUp wordmark centered.

---

*Last updated: 2026-07-01 | See AGENT.md for update conventions.*
