# Objective
Build LookUp monorepo (backend + mobile) from skeleton to full implementation, phase by phase.

# Tasks

### T001: Fix deps, colors, infrastructure
- Blocked By: []
- Details: Add bcryptjs to backend package.json, fix Colors (missing info/infoLight), create docker-compose.prod.yml, railway.json, create utils/format.ts and utils/platform.ts
- Acceptance: Backend compiles, colors complete, infra ready

### T002: Complete backend modules
- Blocked By: []  
- Details: Shop OAuth callbacks, product service (Shopee/TikTok fetch+cache), image service, bulk price route, webhook SSE, price service, error middleware
- Acceptance: All API endpoints implemented per docs/API.md

### T003: Complete mobile atoms + molecules
- Blocked By: [T001]
- Details: Divider, TextInput, Avatar atoms; ShopTag, StockInput, PriceInput, VariantRow, SearchBar, EmptyState, ErrorState, ProgressBar, JobStatusCard molecules
- Acceptance: All atoms and molecules in correct files

### T004: Complete mobile organisms + hooks
- Blocked By: [T003]
- Details: ProductList, VariantTable, SummaryCard organisms; useShops, useProducts, useProductDetail, useBulkJob, useRealtimeEvents hooks
- Acceptance: All organisms and hooks implemented

### T005: Complete mobile screens
- Blocked By: [T004]
- Details: All 14 screens fully implemented per UI_DESIGN.md
- Acceptance: Every screen matches spec, no stub/TODO left

### T006: Update docs per rules
- Blocked By: [T001, T002, T003, T004, T005]
- Details: Mark roadmap complete, update PROJECT_MAP.md with new files
- Acceptance: Docs updated
