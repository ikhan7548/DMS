import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';

interface PrintableInvoiceProps {
  invoice: any;
  settings: Record<string, string>;
}

/**
 * Renders a single invoice page for print.
 * Used for both standard invoices and split billing invoice pages.
 */
function InvoicePage({
  invoice,
  settings,
  billToName,
  billToEmail,
  billToPhone,
  billToAddress,
  portionLabel,
  portionPct,
  portionTotal,
  showSplitNote,
  splitCounterparty,
  splitCounterpartyPct,
  isSecondPage,
}: {
  invoice: any;
  settings: Record<string, string>;
  billToName: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  portionLabel?: string;
  portionPct?: number;
  portionTotal?: number;
  showSplitNote?: boolean;
  splitCounterparty?: string;
  splitCounterpartyPct?: number;
  isSecondPage?: boolean;
}) {
  const facilityName = settings.facility_name || 'Daycare Center';
  const facilityAddress = settings.facility_address || '';
  const facilityPhone = settings.facility_phone || '';
  const facilityEmail = settings.facility_email || '';

  const isSplit = portionPct != null && portionPct < 100;
  const displayTotal = isSplit ? (portionTotal || 0) : (invoice.total || 0);

  return (
    <Box sx={{
      ...(isSecondPage ? { pageBreakBefore: 'always' } : {}),
      p: 4,
      fontSize: '12px',
      position: 'relative',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      {/* Letterhead */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#1565C0' }}>{facilityName}</Typography>
        {facilityAddress && <Typography variant="body2">{facilityAddress}</Typography>}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
          {facilityPhone && <Typography variant="body2">{facilityPhone}</Typography>}
          {facilityEmail && <Typography variant="body2">{facilityEmail}</Typography>}
        </Box>
      </Box>

      <Divider sx={{ borderWidth: 2, borderColor: '#1565C0', mb: 3 }} />

      {/* Invoice Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>INVOICE</Typography>
          <Typography variant="body2"><strong>Invoice #:</strong> {invoice.invoice_number}</Typography>
          <Typography variant="body2"><strong>Date:</strong> {invoice.issued_date}</Typography>
          <Typography variant="body2"><strong>Due Date:</strong> {invoice.due_date}</Typography>
          <Typography variant="body2"><strong>Period:</strong> {invoice.period_start} to {invoice.period_end}</Typography>
          {isSplit && portionLabel && (
            <Box sx={{ mt: 1, p: 0.5, px: 1, backgroundColor: '#e3f2fd', display: 'inline-block', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565C0' }}>
                {portionLabel} ({portionPct}%)
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Bill To:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{billToName}</Typography>
          {billToAddress && <Typography variant="body2">{billToAddress}</Typography>}
          {billToEmail && <Typography variant="body2">{billToEmail}</Typography>}
          {billToPhone && <Typography variant="body2">{billToPhone}</Typography>}
        </Box>
      </Box>

      {/* Line Items */}
      <Table size="small" sx={{ mb: 3, '& td, & th': { borderColor: '#ccc', py: 1 } }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(invoice.lineItems || []).map((item: any) => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.item_type?.replace('_', ' ')}</TableCell>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell align="right">${(item.unit_price || 0).toFixed(2)}</TableCell>
              <TableCell align="right">${(item.total || 0).toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {(!invoice.lineItems || invoice.lineItems.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 2, color: '#999' }}>No line items</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Box sx={{ width: 300 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2">Subtotal:</Typography>
            <Typography variant="body2">${(invoice.subtotal || 0).toFixed(2)}</Typography>
          </Box>
          {(invoice.tax_amount || 0) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2">Tax:</Typography>
              <Typography variant="body2">${(invoice.tax_amount || 0).toFixed(2)}</Typography>
            </Box>
          )}
          {(invoice.discount_amount || 0) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2">Discount:</Typography>
              <Typography variant="body2" color="success.main">-${(invoice.discount_amount || 0).toFixed(2)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>Invoice Total:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>${(invoice.total || 0).toFixed(2)}</Typography>
          </Box>

          {/* Split portion line */}
          {isSplit && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, backgroundColor: '#e3f2fd', px: 1, borderRadius: 1, mt: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565C0' }}>
                  {portionLabel} ({portionPct}%):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1565C0' }}>
                  ${displayTotal.toFixed(2)}
                </Typography>
              </Box>
              {splitCounterparty && splitCounterpartyPct != null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, px: 1, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {splitCounterparty} ({splitCounterpartyPct}%):
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${((invoice.total || 0) * (splitCounterpartyPct / 100)).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 0.5 }} />
            </>
          )}

          {/* Only show paid/balance for parent portion (not third party) */}
          {!isSplit && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">Amount Paid:</Typography>
                <Typography variant="body2" color="success.main">${(invoice.amount_paid || 0).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Balance Due:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: (invoice.balance_due || 0) > 0 ? '#d32f2f' : '#2e7d32' }}>
                  ${(invoice.balance_due || 0).toFixed(2)}
                </Typography>
              </Box>
            </>
          )}

          {isSplit && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>Amount Due:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: displayTotal > 0 ? '#d32f2f' : '#2e7d32' }}>
                ${displayTotal.toFixed(2)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Split note */}
      {showSplitNote && splitCounterparty && (
        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            Note: This invoice is split-billed. {splitCounterparty} is responsible for {splitCounterpartyPct}%
            (${((invoice.total || 0) * ((splitCounterpartyPct || 0) / 100)).toFixed(2)}) of this invoice.
          </Typography>
        </Box>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Notes:</Typography>
          <Typography variant="body2">{invoice.notes}</Typography>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', borderTop: '1px solid #ccc', pt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Thank you for your business! Payment is due by {invoice.due_date}.
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          {facilityName} | {facilityAddress}
        </Typography>
      </Box>
    </Box>
  );
}

export default function PrintableInvoice({ invoice, settings }: PrintableInvoiceProps) {
  if (!invoice) return null;

  const hasSplit = invoice.split_billing_pct != null && invoice.split_billing_pct < 100;
  const parentPct = hasSplit ? invoice.split_billing_pct : 100;
  const thirdPartyPct = hasSplit ? (100 - parentPct) : 0;
  const parentTotal = (invoice.total || 0) * (parentPct / 100);
  const thirdPartyTotal = (invoice.total || 0) * (thirdPartyPct / 100);
  const thirdPartyName = invoice.split_billing_payer || 'Third-Party Payer';
  const thirdPartyAddress = invoice.split_billing_payer_address || '';

  if (!hasSplit) {
    // Standard single invoice
    return (
      <Box className="printable-invoice" sx={{
        display: 'none',
        '@media print': {
          display: 'block',
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'white',
          zIndex: 9999,
        },
      }}>
        <InvoicePage
          invoice={invoice}
          settings={settings}
          billToName={`${invoice.parent_first_name || invoice.family_first_name || ''} ${invoice.parent_last_name || invoice.family_last_name || ''}`.trim()}
          billToEmail={invoice.parent_email || invoice.family_email}
          billToPhone={invoice.parent_phone || invoice.family_phone}
          billToAddress={invoice.family_address}
        />
      </Box>
    );
  }

  // Split billing: Two invoice pages
  return (
    <Box className="printable-invoice" sx={{
      display: 'none',
      '@media print': {
        display: 'block',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'white',
        zIndex: 9999,
        overflow: 'auto',
      },
    }}>
      {/* Page 1: Parent Invoice */}
      <InvoicePage
        invoice={invoice}
        settings={settings}
        billToName={`${invoice.parent_first_name || invoice.family_first_name || ''} ${invoice.parent_last_name || invoice.family_last_name || ''}`.trim()}
        billToEmail={invoice.parent_email || invoice.family_email}
        billToPhone={invoice.parent_phone || invoice.family_phone}
        billToAddress={invoice.family_address}
        portionLabel="Parent Portion"
        portionPct={parentPct}
        portionTotal={parentTotal}
        showSplitNote={true}
        splitCounterparty={thirdPartyName}
        splitCounterpartyPct={thirdPartyPct}
        isSecondPage={false}
      />

      {/* Page 2: Third-Party Payer Invoice */}
      <InvoicePage
        invoice={invoice}
        settings={settings}
        billToName={thirdPartyName}
        billToAddress={thirdPartyAddress}
        portionLabel={`${thirdPartyName} Portion`}
        portionPct={thirdPartyPct}
        portionTotal={thirdPartyTotal}
        showSplitNote={true}
        splitCounterparty={`${invoice.parent_first_name || invoice.family_first_name || ''} ${invoice.parent_last_name || invoice.family_last_name || ''}`.trim()}
        splitCounterpartyPct={parentPct}
        isSecondPage={true}
      />
    </Box>
  );
}
