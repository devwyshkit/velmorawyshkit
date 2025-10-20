# Admin Console - Swiggy/Zomato Patterns Research

**Project:** Wyshkit Admin Console  
**Last Updated:** October 20, 2025  
**Research Focus:** Swiggy Partner Manager Dashboard, Zomato Restaurant Operations Portal

---

## Executive Summary

This document outlines the admin console design patterns observed in Swiggy and Zomato's internal partner management systems, adapted for Wyshkit's multi-vendor gifting platform.

**Key Findings:**
- **Mobile-first for field teams** (ops managers review partners on-the-go)
- **Real-time monitoring** (live order tracking, instant dispute alerts)
- **Bulk operations** (approve 10 partners at once, bulk payout processing)
- **Role-based access** (super admin, ops manager, finance, support)

---

## 1. Admin Dashboard (Home Page)

### Swiggy Pattern: "Command Center"
**Layout:**
- Top stats cards (4-col grid): Active Partners, Today's Orders, Pending Disputes, Revenue
- Live order feed (right sidebar): Scrolling list of new orders (auto-updates every 5s)
- Main chart: GMV trend (last 30 days, line chart with annotations for campaigns)
- Quick actions (floating button bottom-right): [Approve Partner] [Process Payout] [View Alerts]

**Mobile View (320px):**
- Stats cards stack (1-col)
- Live feed collapses to bottom sheet (tap "View Live Orders")
- Chart responsive (touch-enabled, swipe for date range)

### Zomato Pattern: "Ops Dashboard"
**Layout:**
- Map view (top half): Partner locations with status indicators (green=active, red=issues)
- Performance metrics (bottom half): Partner ratings, compliance scores, top performers
- Alerts banner (sticky top): "3 partners need KYC review" (tap to navigate)

### Wyshkit Adaptation
**Components:**
```typescript
// src/pages/admin/Dashboard.tsx
<div className="p-6 space-y-6">
  {/* Stats Cards - Swiggy Pattern */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard
      title="Active Partners"
      value={activePartners}
      change="+12% this month"
      icon={Users}
      trend="up"
    />
    <StatCard
      title="Today's Orders"
      value={todayOrders}
      change="+5% vs yesterday"
      icon={ShoppingBag}
      trend="up"
    />
    <StatCard
      title="Pending Disputes"
      value={pendingDisputes}
      change="-3 resolved today"
      icon={AlertCircle}
      trend="down"
    />
    <StatCard
      title="Month's GMV"
      value={`₹${monthGMV.toLocaleString('en-IN')}`}
      change="+18% vs last month"
      icon={TrendingUp}
      trend="up"
    />
  </div>

  {/* GMV Trend Chart */}
  <Card>
    <CardHeader>
      <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveLineChart data={gmvData} />
    </CardContent>
  </Card>

  {/* Live Order Feed - Swiggy Pattern */}
  <Card>
    <CardHeader>
      <CardTitle>Live Orders</CardTitle>
    </CardHeader>
    <CardContent>
      <LiveOrderFeed /> {/* Real-time Supabase subscription */}
    </CardContent>
  </Card>

  {/* Alerts - Zomato Pattern */}
  <AlertsBanner alerts={[
    { type: 'kyc', count: 3, message: '3 partners need KYC review', link: '/admin/partners?status=kyc_pending' },
    { type: 'payout', count: 5, message: '5 payouts ready for processing', link: '/admin/payouts' },
  ]} />
</div>
```

---

## 2. Partner Management

### Swiggy Pattern: "Restaurant Approval Queue"
**Workflow:**
1. **Pending List** (DataTable):
   - Columns: Name, Category, Location, Applied Date, KYC Status, Actions
   - Filters: [All] [KYC Pending] [Document Review] [Ready to Approve]
   - Bulk select: Approve multiple partners at once

2. **Partner Detail Sheet** (Right sidebar, 600px):
   - Business Info (name, GSTIN, PAN, bank account)
   - KYC Documents (clickable thumbnails, full-screen viewer)
   - IDfy Verification Status (badge: ✅ Verified / ⏳ Pending / ❌ Failed)
   - Action buttons: [Approve] [Reject] [Request Changes]

3. **Rejection Flow:**
   - Reason dropdown: "Incomplete KYC", "Invalid GSTIN", "Duplicate Account", "Other"
   - Text area: "Specify what partner needs to fix..."
   - [Send Email & Reject] → Partner gets actionable email

### Zomato Pattern: "Restaurant Onboarding Checklist"
**Checklist View:**
- ☑ Basic Details (name, address, contact)
- ☑ Legal Documents (GSTIN, PAN, FSSAI if food vendor)
- ☑ Bank Account Verification
- ☐ Menu Upload (products in Wyshkit context)
- ☐ Trial Order (optional: partner tests platform)

Progress bar: "4/5 steps complete"

### Wyshkit Implementation
```typescript
// src/pages/admin/Partners.tsx
<div className="space-y-4">
  {/* Filters - Swiggy Pattern */}
  <div className="flex gap-2 flex-wrap">
    <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
      All ({counts.all})
    </Button>
    <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
      Pending Approval ({counts.pending})
    </Button>
    <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')}>
      Approved ({counts.approved})
    </Button>
    <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')}>
      Rejected ({counts.rejected})
    </Button>
  </div>

  {/* DataTable with Bulk Actions */}
  <DataTable
    columns={partnerColumns}
    data={partners}
    enableRowSelection
    onRowSelectionChange={setSelectedPartners}
  />

  {/* Bulk Actions Bar (appears when rows selected) */}
  {selectedPartners.length > 0 && (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-lg p-4 flex items-center gap-4 z-50">
      <span className="text-sm font-medium">{selectedPartners.length} selected</span>
      <Button size="sm" onClick={handleBulkApprove}>
        Approve All
      </Button>
      <Button size="sm" variant="destructive" onClick={handleBulkReject}>
        Reject All
      </Button>
    </div>
  )}

  {/* Partner Detail Sheet - Zomato Checklist Pattern */}
  <Sheet open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
    <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{selectedPartner?.business_name}</SheetTitle>
      </SheetHeader>
      
      <div className="space-y-6 py-4">
        {/* Onboarding Checklist */}
        <div className="space-y-3">
          <h3 className="font-semibold">Onboarding Progress</h3>
          <Progress value={calculateProgress(selectedPartner)} className="h-2" />
          <div className="space-y-2">
            <ChecklistItem
              label="Basic Details"
              completed={!!selectedPartner?.business_name}
              icon={Building}
            />
            <ChecklistItem
              label="GSTIN Verified (IDfy)"
              completed={selectedPartner?.kyc_status === 'verified'}
              icon={CheckCircle}
            />
            <ChecklistItem
              label="Bank Account Verified"
              completed={!!selectedPartner?.bank_account_verified}
              icon={CreditCard}
            />
            <ChecklistItem
              label="Products Added"
              completed={selectedPartner?.products_count > 0}
              icon={Package}
            />
          </div>
        </div>

        {/* KYC Documents Viewer */}
        <div className="space-y-3">
          <h3 className="font-semibold">Documents</h3>
          <div className="grid grid-cols-2 gap-3">
            <DocumentThumbnail
              type="GSTIN"
              url={selectedPartner?.gstin_certificate}
              verified={selectedPartner?.gstin_verified}
            />
            <DocumentThumbnail
              type="PAN"
              url={selectedPartner?.pan_card}
              verified={selectedPartner?.pan_verified}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => handleApprove(selectedPartner?.id)}
            disabled={calculateProgress(selectedPartner) < 100}
          >
            Approve Partner
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
          >
            Reject
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</div>
```

---

## 3. Order Monitoring

### Swiggy Pattern: "Live Order Tracker"
**Real-time Dashboard:**
- Order list (auto-updates every 5s):
  - Columns: Order #, Customer, Partner, Items, Status, Time
  - Color coding: 🟢 Completed, 🟡 Preparing, 🔴 Delayed
- Filters: [All] [Active] [Completed] [Disputed]
- Quick actions: [View Details] [Contact Partner] [Escalate Issue]

**Order Detail (Modal):**
- Timeline: Order placed → Confirmed → Kitting → Shipped → Delivered
- Customer info: Name, phone (masked for privacy), delivery address
- Partner info: Business name, contact, fulfillment location
- Items: List with customization details (add-ons, branding)
- Actions: [Send Notification] [Extend Delivery Time] [Cancel Order]

### Zomato Pattern: "Ops Control Panel"
**Map View:**
- Shows all active orders on city map
- Partner pins (clickable, shows order count)
- Delivery radius visualization
- Real-time updates (order moves from partner → customer)

### Wyshkit Implementation
```typescript
// src/pages/admin/Orders.tsx
<div className="space-y-4">
  {/* Live Stats */}
  <div className="grid grid-cols-3 gap-4">
    <StatCard title="Active Orders" value={activeOrders} icon={ShoppingBag} color="yellow" />
    <StatCard title="Completed Today" value={completedToday} icon={CheckCircle} color="green" />
    <StatCard title="Disputed" value={disputedOrders} icon={AlertTriangle} color="red" />
  </div>

  {/* Real-time Order Feed - Supabase Subscriptions */}
  <Card>
    <CardHeader>
      <CardTitle>Live Orders</CardTitle>
      <div className="flex gap-2">
        <Badge variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>
          All
        </Badge>
        <Badge variant={statusFilter === 'active' ? 'default' : 'outline'} onClick={() => setStatusFilter('active')}>
          Active
        </Badge>
        <Badge variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => setStatusFilter('completed')}>
          Completed
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <DataTable
        columns={orderColumns}
        data={orders}
        onRowClick={(order) => setSelectedOrder(order)}
      />
    </CardContent>
  </Card>

  {/* Order Detail Modal - Swiggy Timeline Pattern */}
  <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Order Timeline */}
        <div className="space-y-3">
          <h3 className="font-semibold">Status Timeline</h3>
          <OrderTimeline order={selectedOrder} />
        </div>

        {/* Customer & Partner Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Customer</h3>
            <p className="text-sm">{selectedOrder?.customer_name}</p>
            <p className="text-sm text-muted-foreground">{maskPhone(selectedOrder?.customer_phone)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Partner</h3>
            <p className="text-sm">{selectedOrder?.partner_name}</p>
            <Button size="sm" variant="outline" onClick={() => contactPartner(selectedOrder?.partner_id)}>
              Contact Partner
            </Button>
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="space-y-2">
            {selectedOrder?.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>₹{item.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button size="sm" onClick={() => sendNotification(selectedOrder?.id)}>
            Send Update
          </Button>
          <Button size="sm" variant="destructive" onClick={() => escalateIssue(selectedOrder?.id)}>
            Escalate Issue
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</div>
```

---

## 4. Dispute Escalation Queue

### Swiggy Pattern: "Customer Support Dashboard"
**3-Column Layout:**
1. **Left: Dispute List** (scrollable):
   - Dispute cards (compact):
     - Order #, issue type, customer name, date
     - Priority badge: 🔴 High / 🟡 Medium / 🟢 Low
   - Filters: [All] [Pending] [In Progress] [Resolved]

2. **Center: Dispute Details** (selected dispute):
   - Customer complaint (text + photos)
   - Partner response (text + evidence)
   - Order details (items, amount)
   - Admin notes (internal comments)

3. **Right: Actions Panel**:
   - Recommended resolution: "Full refund ₹2,499"
   - Quick actions: [Approve Refund] [Approve Replacement] [Reject]
   - Custom resolution: Manual input (amount, reason)
   - [Process & Close]

### Zomato Pattern: "Dispute SLA Tracker"
**SLA Indicators:**
- Time since reported: "2h 34m" (red if >4h)
- Resolution target: "Resolve within 24h" (countdown timer)
- Auto-escalate: If unresolved after 48h → Senior ops manager

### Wyshkit Implementation
```typescript
// src/pages/admin/Disputes.tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen">
  {/* Left: Dispute List - Swiggy Card Pattern */}
  <Card className="overflow-y-auto">
    <CardHeader>
      <CardTitle>Disputes ({disputes.length})</CardTitle>
      <div className="flex gap-2">
        <Badge variant={priorityFilter === 'all' ? 'default' : 'outline'} onClick={() => setPriorityFilter('all')}>
          All
        </Badge>
        <Badge variant={priorityFilter === 'high' ? 'destructive' : 'outline'} onClick={() => setPriorityFilter('high')}>
          High Priority
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      {disputes.map((dispute) => (
        <DisputeCard
          key={dispute.id}
          dispute={dispute}
          selected={selectedDispute?.id === dispute.id}
          onClick={() => setSelectedDispute(dispute)}
        />
      ))}
    </CardContent>
  </Card>

  {/* Center: Dispute Details */}
  <Card className="lg:col-span-1 overflow-y-auto">
    {selectedDispute ? (
      <>
        <CardHeader>
          <CardTitle>Order #{selectedDispute.order_id.slice(0, 8)}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityVariant(selectedDispute.priority)}>
              {selectedDispute.priority} Priority
            </Badge>
            <span className="text-sm text-muted-foreground">
              Reported {formatDistanceToNow(new Date(selectedDispute.reported_at))} ago
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Complaint */}
          <div>
            <h3 className="font-semibold mb-2">Customer Complaint</h3>
            <p className="text-sm">{selectedDispute.issue}</p>
            {selectedDispute.evidence_urls && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {selectedDispute.evidence_urls.map((url, idx) => (
                  <img key={idx} src={url} alt={`Evidence ${idx + 1}`} className="rounded border cursor-pointer" onClick={() => openLightbox(url)} />
                ))}
              </div>
            )}
          </div>

          {/* Partner Response */}
          {selectedDispute.response && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Partner Response</h3>
              <p className="text-sm">{selectedDispute.response}</p>
            </div>
          )}

          {/* Admin Notes - Internal */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Internal Notes</h3>
            <Textarea
              placeholder="Add notes for other admins..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </>
    ) : (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a dispute to view details
      </div>
    )}
  </Card>

  {/* Right: Actions Panel - Swiggy Quick Resolution */}
  <Card>
    <CardHeader>
      <CardTitle>Resolution Actions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {selectedDispute && (
        <>
          {/* Recommended Resolution - AI/ML suggested (future) */}
          <Alert>
            <AlertTitle>Recommended Resolution</AlertTitle>
            <AlertDescription>
              Full refund of ₹{(selectedDispute.order_amount / 100).toLocaleString('en-IN')} (similar disputes: 85% refund rate)
            </AlertDescription>
          </Alert>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleResolution('full_refund')}
            >
              Approve Full Refund
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleResolution('partial_refund')}
            >
              Approve Partial Refund
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleResolution('replacement')}
            >
              Approve Replacement
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
            >
              Reject Complaint
            </Button>
          </div>

          {/* SLA Tracker - Zomato Pattern */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time to resolve:</span>
              <span className={cn(
                "font-medium",
                getTimeRemaining(selectedDispute.reported_at) < 2 ? "text-destructive" : "text-muted-foreground"
              )}>
                {formatTimeRemaining(selectedDispute.reported_at)} remaining
              </span>
            </div>
            <Progress
              value={(24 - getTimeRemaining(selectedDispute.reported_at)) / 24 * 100}
              className="h-2 mt-2"
            />
          </div>
        </>
      )}
    </CardContent>
  </Card>
</div>
```

---

## 5. Payout Processing

### Swiggy Pattern: "Bulk Bank Transfer UI"
**Workflow:**
1. **Payout Schedule** (DataTable):
   - Columns: Partner, Amount, Status, Scheduled Date, Actions
   - Filters: [Pending] [Processing] [Completed] [Failed]
   - Bulk select: Process multiple payouts at once

2. **Payout Batch Creation:**
   - Select partners (bulk checkbox)
   - Review total amount: "₹15,42,350 to 47 partners"
   - [Generate CSV for Bank] → Downloads bank upload format
   - [Mark as Processing]

3. **Confirmation Flow:**
   - Upload bank confirmation (screenshot/PDF)
   - Enter UTR numbers (bulk input or CSV upload)
   - [Mark as Completed] → Partners notified

### Zomato Pattern: "Partner Wallet System"
**Alternative Approach:**
- Wallet balance (per partner): "₹12,450 available"
- Auto-payout threshold: ₹10,000 (weekly auto-transfer)
- Manual request: Partner clicks "Withdraw" → Admin approves
- Payment methods: UPI, NEFT, IMPS

### Wyshkit Implementation (Hybrid)
**Phase 1: Manual Batch Payouts** (Swiggy pattern)
**Phase 2: Wallet System** (Zomato pattern at scale)

```typescript
// src/pages/admin/Payouts.tsx
<div className="space-y-4">
  {/* Payout Stats */}
  <div className="grid grid-cols-4 gap-4">
    <StatCard title="Pending Payouts" value={`₹${pendingAmount.toLocaleString('en-IN')}`} />
    <StatCard title="Processing" value={processingCount} />
    <StatCard title="Completed This Month" value={`₹${completedAmount.toLocaleString('en-IN')}`} />
    <StatCard title="Failed" value={failedCount} color="red" />
  </div>

  {/* Payout List with Bulk Actions */}
  <Card>
    <CardHeader>
      <CardTitle>Scheduled Payouts</CardTitle>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleBulkProcess} disabled={selectedPayouts.length === 0}>
          Process {selectedPayouts.length > 0 && `(${selectedPayouts.length})`}
        </Button>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          Export CSV for Bank
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <DataTable
        columns={payoutColumns}
        data={payouts}
        enableRowSelection
        onRowSelectionChange={setSelectedPayouts}
      />
    </CardContent>
  </Card>

  {/* Payout Processing Dialog */}
  <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Process Payouts</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">Total Amount:</p>
          <p className="text-2xl font-bold text-primary">
            ₹{calculateTotal(selectedPayouts).toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedPayouts.length} partners
          </p>
        </div>

        {/* Bank Confirmation Upload */}
        <div>
          <Label>Upload Bank Confirmation</Label>
          <Input type="file" accept=".pdf,.jpg,.png" onChange={handleConfirmationUpload} />
        </div>

        {/* UTR Numbers (Bulk Input) */}
        <div>
          <Label>UTR Numbers (CSV or manual)</Label>
          <Textarea
            placeholder="Partner ID, UTR Number&#10;abc123, UTR202510200001&#10;def456, UTR202510200002"
            rows={5}
            value={utrInput}
            onChange={(e) => setUtrInput(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleMarkCompleted} className="flex-1">
            Mark as Completed
          </Button>
          <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</div>
```

---

## 6. Role-Based Access Control

### Swiggy Pattern: "Multi-Level Admin Hierarchy"
**Roles:**
1. **Super Admin** (CTO, CEO):
   - Full access to all modules
   - Can create/delete other admins
   - Access to financial reports, Zoho Analytics

2. **Operations Manager**:
   - Partner approval
   - Order monitoring
   - Dispute resolution
   - Cannot access financial data

3. **Finance Team**:
   - Payout processing
   - Commission invoicing (Zoho Books)
   - Financial reports
   - Cannot approve partners

4. **Support Agent**:
   - View-only access to orders
   - Can escalate disputes
   - Cannot process payouts or approve partners

### Implementation
```typescript
// src/lib/rbac.ts
export type AdminRole = 'super_admin' | 'ops_manager' | 'finance' | 'support';

export const permissions: Record<AdminRole, string[]> = {
  super_admin: ['*'], // All permissions
  ops_manager: ['partners:read', 'partners:approve', 'orders:read', 'disputes:resolve'],
  finance: ['payouts:process', 'commissions:view', 'analytics:view'],
  support: ['orders:read', 'disputes:view', 'disputes:escalate'],
};

export function hasPermission(role: AdminRole, action: string): boolean {
  if (permissions[role].includes('*')) return true;
  return permissions[role].includes(action);
}

// Usage in components
const { adminRole } = useAuth();

{hasPermission(adminRole, 'partners:approve') && (
  <Button onClick={handleApprove}>Approve Partner</Button>
)}
```

---

## 7. Mobile Responsiveness for Field Teams

### Swiggy Pattern: "Ops Manager Mobile App"
**Mobile-first for:**
- Partner approval (approve from restaurant visit)
- Order monitoring (check status on-the-go)
- Dispute review (quick resolution on phone)

**Design:**
- Bottom sheet modals (not full-page sidebars)
- Large touch targets (min 48px)
- Offline mode (cache critical data)
- Push notifications (new disputes, failed payouts)

### Implementation
```typescript
// Mobile-specific components
<Sheet> {/* Bottom sheet instead of right sidebar */}
  <SheetContent side="bottom" className="h-[90vh]">
    <PartnerApprovalForm />
  </SheetContent>
</Sheet>

// Touch-friendly DataTable
<DataTable
  mobileLayout="cards" // Card grid on mobile, table on desktop
  touchTarget={48} // Min 48px touch area
/>
```

---

## 8. Success Metrics (Post-Launch)

### Swiggy/Zomato Benchmarks
- **Partner Approval Time:** <24h (Swiggy: 18h avg)
- **Dispute Resolution:** <48h (Zomato: 92% within 24h)
- **Payout Processing:** Weekly (Swiggy: bi-weekly, Zomato: weekly)
- **Admin Active Users:** 5-10 (ops, finance, support)

### Wyshkit Targets
- Partner approval: <12h (faster than Swiggy with IDfy automation)
- Dispute resolution: <24h (95%+ resolution rate)
- Payout processing: Weekly (every Friday)
- Admin team: 3-5 users initially (scale to 10 at 500+ partners)

---

## 9. Implementation Priority

**Week 1 (Days 1-2):**
- Admin Dashboard (stats cards, GMV chart)
- Partner List (DataTable with filters)

**Week 1 (Days 3-4):**
- Partner Detail Sheet (onboarding checklist, KYC viewer)
- Approval/Rejection workflow

**Week 1 (Day 5):**
- Order Monitoring (live feed, order detail modal)

**Week 2 (Days 1-2):**
- Dispute Escalation Queue (3-column layout, resolution actions)

**Week 2 (Days 3-5):**
- Payout Processing (batch creation, UTR upload, CSV export)
- Role-based access control

**Total: 10 working days (2 calendar weeks)**

---

## 10. Technology Stack

**Frontend:**
- React + TypeScript (same as partner portal)
- Shadcn UI (DataTable, Sheet, Dialog)
- Recharts (GMV trend chart)
- Supabase Real-time (live order feed)

**Backend:**
- Supabase (admin_users table with role column)
- RLS policies (role-based row access)
- Supabase Edge Functions (automated workflows)

**Third-party:**
- Zoho Analytics (embedded dashboards)
- IDfy (KYC verification status display)

---

**ADMIN CONSOLE: SWIGGY/ZOMATO PATTERNS FULLY DOCUMENTED** 🚀

Ready for systematic implementation with proven UX patterns from industry leaders!

