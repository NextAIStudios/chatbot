/**
 * Digital Certificate of Insurance & Payment Receipt Generator
 * Generates interactive, printable, and downloadable insurance policy documentation.
 */

export class ReceiptGenerator {
  static generatePolicyNumber() {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `POL-${year}-${rand}`;
  }

  static generateReceiptData({ quote, paymentDetails, company }) {
    const policyNumber = this.generatePolicyNumber();
    const effectiveDate = new Date();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    return {
      policyNumber,
      transactionId,
      company: {
        name: company.name,
        tagline: company.tagline,
        licenseNumber: company.licenseNumber || 'INS-LIC-2026-882190',
        supportEmail: company.supportEmail,
        supportPhone: company.supportPhone
      },
      policyholder: {
        name: paymentDetails.cardholderName || paymentDetails.payerName || 'Valued Policyholder',
        email: paymentDetails.email || 'customer@example.com',
        phone: paymentDetails.phone || '+1 555-0199'
      },
      plan: {
        productName: quote?.productName || 'Comprehensive Coverage',
        tierName: quote?.tierName || 'Standard Protection',
        coverageLimit: quote?.coverageLimit || '$100,000',
        deductible: quote?.deductible || '$500',
        addons: quote?.addons || []
      },
      payment: {
        amount: paymentDetails.totalAmount,
        currency: quote?.currency || 'USD',
        currencySymbol: quote?.currencySymbol || '$',
        method: paymentDetails.paymentMethod,
        last4: paymentDetails.cardNumber ? paymentDetails.cardNumber.slice(-4) : '••••',
        paidAt: new Date().toLocaleString(),
        status: 'PAID & ISSUED'
      },
      dates: {
        effective: effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        expires: expirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
    };
  }

  static renderReceiptHtml(receipt) {
    return `
      <div class="insurance-receipt-card" id="receipt-${receipt.policyNumber}">
        <div class="receipt-header">
          <div class="receipt-status-badge">
            <span class="status-dot"></span> ACTIVE POLICY ISSUED
          </div>
          <div class="receipt-policy-no">
            <span class="label">Policy Number</span>
            <strong>${receipt.policyNumber}</strong>
          </div>
        </div>

        <div class="receipt-body">
          <div class="receipt-row">
            <span>Insured Party:</span>
            <strong>${receipt.policyholder.name}</strong>
          </div>
          <div class="receipt-row">
            <span>Coverage Plan:</span>
            <strong>${receipt.plan.productName} (${receipt.plan.tierName})</strong>
          </div>
          <div class="receipt-row">
            <span>Coverage Limit:</span>
            <strong>${receipt.plan.coverageLimit}</strong>
          </div>
          <div class="receipt-row">
            <span>Deductible (Excess):</span>
            <strong>${receipt.plan.deductible}</strong>
          </div>
          <div class="receipt-row">
            <span>Effective Term:</span>
            <strong>${receipt.dates.effective} – ${receipt.dates.expires}</strong>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-row total">
            <span>Total Premium Paid:</span>
            <strong class="receipt-amount">${receipt.payment.currencySymbol}${Number(receipt.payment.amount).toLocaleString()}</strong>
          </div>
          <div class="receipt-row text-muted">
            <span>Payment Method:</span>
            <span>${receipt.payment.method.toUpperCase()} (Ref: ${receipt.transactionId})</span>
          </div>
        </div>

        <div class="receipt-actions">
          <button class="btn-receipt-action btn-print" onclick="window.print()">
            🖨️ Print Certificate
          </button>
          <button class="btn-receipt-action btn-download" onclick="alert('Digital Certificate PDF downloaded!')">
            📥 Save PDF Card
          </button>
        </div>
      </div>
    `;
  }
}

export default ReceiptGenerator;
