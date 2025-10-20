# IDfy KYC Integration Plan

## Overview
Integrate IDfy for automated KYC verification during partner onboarding - matching IDFC First Bank's verification UX.

---

## Integration Points

### 1. PAN Verification
**When:** Onboarding Step 2 (after entering PAN number)  
**IDfy API:** POST `/verifications/pan`

**Flow:**
```
Partner enters PAN → Frontend validates format → IDfy API verifies → Store result
```

**Implementation:**
```typescript
// src/lib/integrations/idfy-kyc.ts
export const verifyPAN = async (panNumber: string, name: string) => {
  // Mock implementation
  const mockResponse = {
    success: true,
    verified: true,
    name_match: true,
    pan_holder_name: name,
    status: 'VALID',
    verification_time: '2.3s',
  };
  
  // TODO: Replace with actual IDfy API call
  // const response = await fetch('https://eve.idfy.com/v3/tasks/sync/verifications/pan', {
  //   method: 'POST',
  //   headers: {
  //     'api-key': process.env.IDFY_API_KEY!,
  //     'account-id': process.env.IDFY_ACCOUNT_ID!,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     task_id: `pan_${Date.now()}`,
  //     group_id: partnerId,
  //     data: {
  //       id_number: panNumber,
  //       name: name
  //     }
  //   })
  // });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Mock IDfy PAN Verification:', mockResponse);
  return mockResponse;
};
```

**UI Integration:**
```typescript
// In Step2KYC.tsx
const handlePANVerify = async () => {
  setVerifying(true);
  try {
    const result = await verifyPAN(formValues.pan_number, partnerName);
    
    if (result.verified) {
      toast({ title: "PAN verified successfully", description: "✓ Name matched" });
      setPANVerified(true);
    } else {
      toast({ title: "PAN verification failed", description: result.error, variant: "destructive" });
    }
  } catch (error) {
    toast({ title: "Verification error", description: "Please try again", variant: "destructive" });
  } finally {
    setVerifying(false);
  }
};
```

---

### 2. GST Verification
**When:** Onboarding Step 2 (after entering GSTIN)  
**IDfy API:** POST `/verifications/ind_gst`

**Verified Data:**
- GSTIN validity
- Business name
- Business address
- GST registration date
- Business type

**Implementation:**
```typescript
export const verifyGST = async (gstNumber: string) => {
  const mockResponse = {
    success: true,
    verified: true,
    legal_name: 'GiftCraft Private Limited',
    trade_name: 'GiftCraft',
    registration_date: '2020-04-15',
    business_type: 'Private Limited Company',
    principal_place: 'Mumbai, Maharashtra',
    status: 'Active',
  };
  
  // TODO: Replace with actual IDfy API call
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  console.log('Mock IDfy GST Verification:', mockResponse);
  return mockResponse;
};
```

---

### 3. Bank Account Verification
**When:** Onboarding Step 3 (Banking Details)  
**IDfy API:** POST `/verifications/ind_bank_account`

**Verified Data:**
- Account number validity
- IFSC code validity
- Account holder name match
- Account status (active/inactive)

**Implementation:**
```typescript
export const verifyBankAccount = async (
  accountNumber: string,
  ifsc: string,
  holderName: string
) => {
  const mockResponse = {
    success: true,
    verified: true,
    account_exists: true,
    name_match: true,
    account_holder_name: holderName,
    bank_name: 'HDFC Bank',
    branch: 'Mumbai Main Branch',
    account_status: 'Active',
  };
  
  // TODO: Replace with actual IDfy API call
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('Mock IDfy Bank Verification:', mockResponse);
  return mockResponse;
};
```

---

### 4. FSSAI Verification (Conditional)
**When:** Onboarding Step 2 (only if category = Food & Beverages)  
**IDfy API:** POST `/verifications/ind_fssai`

**Verified Data:**
- FSSAI license validity
- License type (manufacturing/storage/distribution)
- Expiry date
- Business name match

**Implementation:**
```typescript
export const verifyFSSAI = async (
  fssaiNumber: string,
  businessName: string
) => {
  const mockResponse = {
    success: true,
    verified: true,
    license_number: fssaiNumber,
    license_type: 'Manufacturing',
    business_name: businessName,
    name_match: true,
    valid_from: '2023-01-01',
    valid_to: '2028-12-31',
    status: 'Active',
  };
  
  // TODO: Replace with actual IDfy API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Mock IDfy FSSAI Verification:', mockResponse);
  return mockResponse;
};
```

---

## IDfy Setup Requirements

### API Credentials
1. **API Key:** From IDfy dashboard
2. **Account ID:** Your IDfy account ID
3. **Secret Key:** For webhook verification

### Environment Variables
```env
IDFY_API_KEY=your_api_key
IDFY_ACCOUNT_ID=your_account_id
IDFY_SECRET_KEY=your_secret_key
IDFY_ENVIRONMENT=sandbox # or production
```

### Pricing (Approximate)
- PAN Verification: ₹2 per request
- GST Verification: ₹5 per request
- Bank Account: ₹3 per request
- FSSAI: ₹5 per request

**Total per partner:** ₹10-15 (if all verifications used)

---

## UI/UX Pattern (IDFC First Bank Style)

### Verification States
1. **Not Started:** Gray icon, "Verify" button
2. **Verifying:** Spinner, "Verifying..." text
3. **Verified:** Green checkmark, verified name shown
4. **Failed:** Red X, "Retry" button

### Loading States
```typescript
const [verificationStates, setVerificationStates] = useState({
  pan: 'not_started', // not_started, verifying, verified, failed
  gst: 'not_started',
  bank: 'not_started',
  fssai: 'not_started',
});
```

### Example UI (Step 2 KYC):
```
┌─────────────────────────────────────────┐
│ PAN Card                                │
│ ABCDE1234F                              │
│ [Verifying...] 🔄                       │
│ → Checking with Income Tax Department  │
└─────────────────────────────────────────┘

After verification:
┌─────────────────────────────────────────┐
│ PAN Card                                │
│ ABCDE1234F                              │
│ [Verified] ✅                           │
│ → Name: PRATEEK KUMAR MISHRA            │
└─────────────────────────────────────────┘
```

---

## Error Handling

### Common Errors
1. **Invalid Document:** Clear message, allow re-entry
2. **Name Mismatch:** Show expected vs. entered, allow correction
3. **API Timeout:** Retry with exponential backoff
4. **Rate Limit:** Queue request, show "High traffic, please wait"

### Fallback for API Failure
- Save entered data without verification
- Mark as "Pending Manual Review"
- Admin approves manually with uploaded docs

---

## Webhook for Async Verification

**For large uploads (documents):** Use async verification
**IDfy Webhook:** POST to `/api/idfy-webhook`

**Implementation:**
```typescript
// Supabase Edge Function: idfy-webhook
export default async function handler(req: Request) {
  const { task_id, status, result } = await req.json();
  
  // Update partner verification status
  await supabase
    .from('partner_profiles')
    .update({
      [`${result.type}_verified`]: status === 'completed',
      [`${result.type}_data`]: result.data,
    })
    .eq('id', task_id);
  
  return new Response('OK', { status: 200 });
}
```

---

## Mock vs. Real Implementation

**Use Mock When:**
- Development/testing without API costs
- API credentials not available
- Demonstrating workflows to stakeholders

**Use Real When:**
- Production deployment
- Testing actual verification accuracy
- Compliance requirements

**Toggle:**
```typescript
const USE_MOCK_KYC = process.env.VITE_MOCK_KYC === 'true';

export const verifyDocument = USE_MOCK_KYC
  ? mockVerifyDocument
  : realVerifyDocument;
```

---

## Next Steps

1. ✅ Create mock implementation (done in this document)
2. ⏳ Get IDfy sandbox credentials (request from IDfy)
3. ⏳ Test sandbox API (verify 10 test documents)
4. ⏳ Integrate real API calls (replace mocks)
5. ⏳ Production deployment (use real API key)

**Recommendation:** Start with mocks, get IDfy credentials in parallel, swap in production when ready.

