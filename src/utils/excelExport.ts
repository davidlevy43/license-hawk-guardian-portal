import * as XLSX from 'xlsx';
import { License, LicenseStatus, LicenseType, PaymentMethod, CostType } from '@/types';
import { format } from 'date-fns';

export const exportLicensesToExcel = (licenses: License[]) => {
  // Helper function to format credit card for export
  const formatCreditCardForExport = (license: License) => {
    console.log(`🔍 Excel export - Credit card info for ${license.name}:`, {
      paymentMethod: license.paymentMethod,
      creditCardDigits: license.creditCardDigits,
      hasDigits: !!license.creditCardDigits
    });
    
    if (license.paymentMethod !== PaymentMethod.CREDIT_CARD) {
      return '-';
    }
    
    if (!license.creditCardDigits || license.creditCardDigits.trim() === "") {
      return 'לא צוין';
    }
    
    return `****${license.creditCardDigits}`;
  };

  // Prepare data for Excel export
  const excelData = licenses.map(license => ({
    'שם הרישיון': license.name,
    'סוג': getLicenseTypeLabel(license.type),
    'מחלקה': license.department,
    'ספק': license.supplier,
    'בעל השירות': license.serviceOwner,
    'אימייל בעל השירות': license.serviceOwnerEmail,
    'תאריך התחלה': format(license.startDate, 'dd/MM/yyyy'),
    'תאריך חידוש': format(license.renewalDate, 'dd/MM/yyyy'),
    'עלות חודשית': `$${license.monthlyCost.toFixed(2)}`,
    'סוג עלות': getCostTypeLabel(license.costType),
    'אמצעי תשלום': getPaymentMethodLabel(license.paymentMethod),
    'כרטיס אשראי': formatCreditCardForExport(license),
    'סטטוס': getStatusLabel(license.status),
    'הערות': license.notes || '',
    'תאריך יצירה': format(license.createdAt, 'dd/MM/yyyy HH:mm'),
    'תאריך עדכון': format(license.updatedAt, 'dd/MM/yyyy HH:mm')
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 20 }, // שם הרישיון
    { wch: 15 }, // סוג
    { wch: 15 }, // מחלקה
    { wch: 20 }, // ספק
    { wch: 20 }, // בעל השירות
    { wch: 25 }, // אימייל בעל השירות
    { wch: 15 }, // תאריך התחלה
    { wch: 15 }, // תאריך חידוש
    { wch: 15 }, // עלות חודשית
    { wch: 12 }, // סוג עלות
    { wch: 18 }, // אמצעי תשלום
    { wch: 15 }, // כרטיס אשראי
    { wch: 12 }, // סטטוס
    { wch: 30 }, // הערות
    { wch: 18 }, // תאריך יצירה
    { wch: 18 }  // תאריך עדכון
  ];
  
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'רישיונות');

  // Generate filename with current date
  const currentDate = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filename = `licenses-export-${currentDate}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
  
  return filename;
};

// Helper functions to convert enum values to Hebrew labels
const getLicenseTypeLabel = (type: LicenseType): string => {
  switch (type) {
    case LicenseType.SOFTWARE:
      return 'תוכנה';
    case LicenseType.HARDWARE:
      return 'חומרה';
    case LicenseType.SERVICE:
      return 'שירות';
    case LicenseType.SUBSCRIPTION:
      return 'מנוי';
    case LicenseType.AGREEMENT:
      return 'הסכם';
    case LicenseType.CERTIFICATE:
      return 'תעודה';
    default:
      return type;
  }
};

const getCostTypeLabel = (costType: CostType): string => {
  switch (costType) {
    case CostType.MONTHLY:
      return 'חודשי';
    case CostType.YEARLY:
      return 'שנתי';
    case CostType.ONE_TIME:
      return 'חד פעמי';
    default:
      return costType;
  }
};

const getPaymentMethodLabel = (paymentMethod: PaymentMethod): string => {
  switch (paymentMethod) {
    case PaymentMethod.CREDIT_CARD:
      return 'כרטיס אשראי';
    case PaymentMethod.BANK_TRANSFER:
      return 'העברה בנקאית';
    case PaymentMethod.PURCHASE_ORDER:
      return 'הזמנת רכש';
    case PaymentMethod.PAYPAL:
      return 'PayPal';
    default:
      return paymentMethod;
  }
};

const getStatusLabel = (status: LicenseStatus): string => {
  switch (status) {
    case LicenseStatus.ACTIVE:
      return 'פעיל';
    case LicenseStatus.PENDING:
      return 'חידוש בקרוב';
    case LicenseStatus.EXPIRED:
      return 'פג תוקף';
    default:
      return status;
  }
};
