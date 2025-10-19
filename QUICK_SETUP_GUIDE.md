# 🚀 QUICK SETUP GUIDE - 5 Minutes to Testing!

## ✅ **Step 1: Environment Setup** (DONE ✅)
- `.env` file created with your Supabase credentials
- Dev server restarted and running on `http://localhost:8080`

---

## 📋 **Step 2: Run Database Setup** (DO THIS NOW)

### **What to do:**
1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **usiwuxudinfxttvrcczb**
3. Navigate to: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Open file: `SETUP_DATABASE_AND_ACCOUNTS.sql` (in this project)
6. **Copy ALL contents** of that file
7. **Paste** into Supabase SQL Editor
8. Click: **RUN** (bottom right)
9. Wait ~10 seconds for completion

### **Expected Output:**
You should see green checkmarks ✅ and messages like:
```
✅ DATABASE MIGRATION COMPLETE
✅ Partner account created: partner@wyshkit.com / Partner@123 (APPROVED)
✅ Admin account created: admin@wyshkit.com / Admin@123
✅ Pending partner created: pending@wyshkit.com / Pending@123 (FOOD CATEGORY)
🚀 READY FOR TESTING!
```

---

## 🎯 **Step 3: Test Login** (AFTER SQL RUNS)

### **Test 1: Partner Login (Approved)**
1. Open browser: http://localhost:8080/partner/login
2. Login with:
   - **Email**: `partner@wyshkit.com`
   - **Password**: `Partner@123`
3. **Expected**: Dashboard loads with stats cards, sidebar navigation
4. **Test**: Click through Products, Orders, Earnings, Profile pages

### **Test 2: Admin Login**
1. Open: http://localhost:8080/admin/partner-approvals
2. Login with:
   - **Email**: `admin@wyshkit.com`
   - **Password**: `Admin@123`
3. **Expected**: See pending partner in DataTable (Pending Food Partner)
4. **Test**: Click "Review" → Verify FSSAI number shows (12345678901234)

### **Test 3: Pending Partner Login**
1. Open: http://localhost:8080/partner/login
2. Login with:
   - **Email**: `pending@wyshkit.com`
   - **Password**: `Pending@123`
3. **Expected**: Limited access message (pending approval)
4. **Test**: Login as admin → Approve this partner → Login again → Full access

---

## 🎉 **CREDENTIALS SUMMARY**

| Account | Email | Password | Status | Access |
|---------|-------|----------|--------|--------|
| **Partner** | partner@wyshkit.com | Partner@123 | ✅ Approved | Full Dashboard |
| **Admin** | admin@wyshkit.com | Admin@123 | ✅ Active | Approval Console |
| **Pending** | pending@wyshkit.com | Pending@123 | ⏳ Pending | Limited (test approval) |

---

## ✅ **VERIFICATION CHECKLIST**

After running SQL:

- [ ] SQL ran without errors
- [ ] Saw "READY FOR TESTING!" message
- [ ] Partner login works (partner@wyshkit.com)
- [ ] Dashboard loads with stats cards
- [ ] Can navigate to Products page
- [ ] Can navigate to Orders page (4 tabs visible)
- [ ] Can navigate to Earnings page (commission 15%/85%)
- [ ] Can navigate to Profile page (business fields)
- [ ] Admin login works (admin@wyshkit.com)
- [ ] Admin sees pending partner in table
- [ ] Admin can click "Review" on pending partner
- [ ] FSSAI number shows for food category partner

---

## 🐛 **TROUBLESHOOTING**

### **"Relation does not exist" error**
→ SQL migration didn't run. Re-run the SQL script.

### **"Invalid login credentials" error**
→ Accounts not created. Check Supabase Dashboard → Authentication → Users

### **"Failed to fetch" error**
→ Dev server not running. Run: `npm run preview`

### **Dashboard shows skeleton/loading forever**
→ Check browser console for errors. Verify `.env` file has correct credentials.

### **Admin page shows "No results"**
→ Pending partner not created. Re-run SQL or create manually via signup.

---

## 📞 **NEXT STEPS**

Once all checkboxes above are ✅:

1. **Test complete partner flow:**
   - Go to /partner/signup
   - Create new account
   - Complete 4-step onboarding
   - Verify appears in admin queue
   - Approve as admin
   - Login as new partner
   - Verify full dashboard access

2. **Test conditional FSSAI:**
   - During onboarding, select "Food" category
   - Verify Step 2 shows FSSAI field
   - Select "Tech Gifts" category
   - Verify Step 2 hides FSSAI field

3. **Test branding features:**
   - Add product in partner dashboard
   - Add add-ons with MOQ
   - Verify proof upload checkbox
   - Test in customer UI (Phase 2)

---

## 🚀 **READY?**

1. Run the SQL (Step 2 above)
2. Come back and tell me when it's done
3. I'll test the login for you via browser
4. We'll verify everything works!

**LET'S GO!** 💪

