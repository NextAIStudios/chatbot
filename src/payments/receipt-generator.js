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

  static printCertificate(receipt) {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to print your Certificate of Insurance');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Certificate of Insurance - ${receipt.policyNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
          .cert-outer { border: 3px double #059669; padding: 32px; border-radius: 12px; position: relative; max-width: 760px; margin: 0 auto; }
          .cert-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
          .company-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
          .badge-active { background: #ecfdf5; border: 1.5px solid #10b981; color: #059669; font-weight: 800; padding: 6px 14px; border-radius: 20px; font-size: 12px; }
          .cert-title { text-align: center; margin: 24px 0 16px 0; }
          .cert-title h2 { font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #059669; margin: 0; text-transform: uppercase; }
          .cert-title p { font-size: 12px; color: #64748b; margin-top: 4px; }
          .policy-pill { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 8px; font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 6px; }
          .cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }
          .cert-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
          .cert-box .label { font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; }
          .cert-box .value { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
          .table-summary { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .table-summary th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 11px; text-transform: uppercase; }
          .table-summary td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .total-row td { font-size: 15px; font-weight: 800; color: #059669; border-bottom: 2px solid #059669; }
          .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          .official-seal { width: 90px; height: 90px; border: 2.5px solid #059669; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #059669; font-size: 9px; font-weight: 800; line-height: 1.2; text-transform: uppercase; }
          .signature-box { text-align: right; }
          .sig-line { width: 180px; border-bottom: 1.5px solid #0f172a; margin-bottom: 4px; margin-left: auto; }
          .sig-title { font-size: 11px; color: #64748b; }
          .watermark { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 54px; font-weight: 900; color: rgba(5, 150, 105, 0.06); pointer-events: none; text-transform: uppercase; white-space: nowrap; }
          .disclaimer { font-size: 10px; color: #94a3b8; margin-top: 24px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="cert-outer">
          <div class="watermark">OFFICIAL CERTIFIED POLICY</div>
          
          <div class="cert-header">
            <div>
              <h1 class="company-name">${receipt.company.name}</h1>
              <div class="company-sub">${receipt.company.tagline} • Lic: ${receipt.company.licenseNumber}</div>
            </div>
            <div class="badge-active">● ACTIVE COVERAGE</div>
          </div>

          <div class="cert-title">
            <h2>Certificate of Insurance</h2>
            <p>This document serves as statutory proof of insurance coverage issued by ${receipt.company.name}.</p>
            <div class="policy-pill">Policy Ref: ${receipt.policyNumber}</div>
          </div>

          <div class="cert-grid">
            <div class="cert-box">
              <span class="label">Policyholder (Insured)</span>
              <p class="value">${receipt.policyholder.name}</p>
            </div>
            <div class="cert-box">
              <span class="label">Contact / Phone</span>
              <p class="value">${receipt.policyholder.phone || receipt.policyholder.email}</p>
            </div>
            <div class="cert-box">
              <span class="label">Plan / Policy Tier</span>
              <p class="value">${receipt.plan.productName} (${receipt.plan.tierName})</p>
            </div>
            <div class="cert-box">
              <span class="label">Coverage Limit</span>
              <p class="value">${receipt.plan.coverageLimit}</p>
            </div>
            <div class="cert-box">
              <span class="label">Excess / Deductible</span>
              <p class="value">${receipt.plan.deductible}</p>
            </div>
            <div class="cert-box">
              <span class="label">Effective Period (1 Year)</span>
              <p class="value">${receipt.dates.effective} – ${receipt.dates.expires}</p>
            </div>
          </div>

          <table class="table-summary">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Underwriting Status</th>
                <th style="text-align: right;">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${receipt.plan.productName}</strong><br><small>Statutory Premium & Regulatory Levies</small></td>
                <td>Issued & Verified</td>
                <td style="text-align: right;">${receipt.payment.currencySymbol}${Number(receipt.payment.amount).toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">TOTAL PREMIUM RECEIVED (${receipt.payment.method.toUpperCase()} - ${receipt.transactionId})</td>
                <td style="text-align: right;">${receipt.payment.currencySymbol}${Number(receipt.payment.amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="cert-footer">
            <div class="official-seal">
              <span>★ OFFICIAL ★</span>
              <span>DIGITAL</span>
              <span>SEAL</span>
            </div>
            <div class="signature-box">
              <div class="sig-line"></div>
              <strong>Authorized Underwriting Registrar</strong>
              <div class="sig-title">Digital Signature Validated • ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="disclaimer">
            This Certificate of Insurance is issued in electronic format pursuant to insurance industry regulations and confirms that policy coverage is in full force and effect.
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  static renderReceiptHtml(receipt) {
    // Store receipt data globally so print button can call printCertificate
    if (typeof window !== 'undefined') {
      window.__lastIssuedReceipt = receipt;
    }

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
          <button type="button" class="btn-receipt-action btn-print" onclick="BotlyChatbot.printCertificate()">
            🖨️ Print Certificate
          </button>
          <button type="button" class="btn-receipt-action btn-download" onclick="BotlyChatbot.printCertificate()">
            📥 Save PDF Card
          </button>
        </div>
      </div>
    `;
  }
}

export default ReceiptGenerator;
