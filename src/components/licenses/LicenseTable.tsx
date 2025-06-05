import React, { useState } from "react";
import { useLicenses } from "@/context/LicenseContext";
import { License, LicenseStatus, LicenseType, PaymentMethod } from "@/types";
import { format } from "date-fns";
import { Edit, Trash2, Search, SortAsc, SortDesc, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { exportLicensesToExcel } from "@/utils/excelExport";
import { toast } from "sonner";

interface LicenseTableProps {
  onEdit: (license: License) => void;
  onDelete: (license: License) => void;
}

const LicenseTable: React.FC<LicenseTableProps> = ({ onEdit, onDelete }) => {
  const { licenses, isLoading } = useLicenses();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof License>("renewalDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Debug: Log all licenses to see their structure
  console.log("🔍 All licenses data:", licenses);
  licenses.forEach((license, index) => {
    console.log(`🔍 License ${index + 1} (${license.name}):`, {
      id: license.id,
      name: license.name,
      paymentMethod: license.paymentMethod,
      creditCardDigits: license.creditCardDigits,
      hasDigits: !!license.creditCardDigits,
      typeOfDigits: typeof license.creditCardDigits,
      fullLicense: license
    });
  });

  // Filter licenses by search query
  const filteredLicenses = licenses.filter((license) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      license.name.toLowerCase().includes(searchTerm) ||
      license.supplier.toLowerCase().includes(searchTerm) ||
      license.department.toLowerCase().includes(searchTerm) ||
      license.serviceOwner.toLowerCase().includes(searchTerm)
    );
  });

  // Sort licenses
  const sortedLicenses = [...filteredLicenses].sort((a, b) => {
    if (sortField === "monthlyCost") {
      return sortDirection === "asc"
        ? a.monthlyCost - b.monthlyCost
        : b.monthlyCost - a.monthlyCost;
    }

    if (sortField === "startDate" || sortField === "renewalDate") {
      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }

    // String comparison
    const valueA = String(a[sortField]).toLowerCase();
    const valueB = String(b[sortField]).toLowerCase();
    return sortDirection === "asc"
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const toggleSort = (field: keyof License) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExportToExcel = () => {
    try {
      const filename = exportLicensesToExcel(sortedLicenses);
      toast.success(`File ${filename} exported successfully`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error exporting file");
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case LicenseStatus.ACTIVE:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        );
      case LicenseStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Renewal Soon
          </Badge>
        );
      case LicenseStatus.EXPIRED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Expired
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Enhanced credit card formatting function with more debugging
  const formatCreditCard = (license: License) => {
    console.log(`🔍 Formatting credit card for ${license.name}:`, {
      paymentMethod: license.paymentMethod,
      paymentMethodType: typeof license.paymentMethod,
      paymentMethodValue: JSON.stringify(license.paymentMethod),
      creditCardDigits: license.creditCardDigits,
      creditCardDigitsType: typeof license.creditCardDigits,
      creditCardDigitsValue: JSON.stringify(license.creditCardDigits),
      hasDigits: !!license.creditCardDigits,
      isCreditCard: license.paymentMethod === PaymentMethod.CREDIT_CARD,
      PaymentMethodEnum: PaymentMethod.CREDIT_CARD,
      comparison: license.paymentMethod === PaymentMethod.CREDIT_CARD ? 'MATCH' : 'NO MATCH'
    });
    
    // Check if payment method is credit card (with more flexible comparison)
    const isCreditCard = license.paymentMethod === PaymentMethod.CREDIT_CARD || 
                        license.paymentMethod === "credit_card" ||
                        String(license.paymentMethod).toLowerCase() === "credit_card";
    
    console.log(`🔍 Is credit card check result: ${isCreditCard}`);
    
    if (!isCreditCard) {
      return "-";
    }
    
    // If credit card is selected but no digits provided
    if (!license.creditCardDigits || String(license.creditCardDigits).trim() === "") {
      return "Not specified";
    }
    
    // Show the formatted credit card number
    const digits = String(license.creditCardDigits);
    console.log(`🔍 Returning formatted card: ****${digits}`);
    return `****${digits}`;
  };

  // Column definition for sortable headers
  const SortableHeader = ({
    field,
    children,
  }: {
    field: keyof License;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/30"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <span>{sortDirection === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />}</span>
        )}
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search licenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
          <div className="text-sm text-muted-foreground">
            Showing {sortedLicenses.length} of {licenses.length} licenses
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="name">Name</SortableHeader>
                <SortableHeader field="type">Type</SortableHeader>
                <SortableHeader field="department">Department</SortableHeader>
                <SortableHeader field="supplier">Supplier</SortableHeader>
                <SortableHeader field="serviceOwner">Service Owner</SortableHeader>
                <TableHead>Credit Card</TableHead>
                <SortableHeader field="renewalDate">Renewal Date</SortableHeader>
                <SortableHeader field="monthlyCost">Monthly Cost</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLicenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No licenses found
                  </TableCell>
                </TableRow>
              ) : (
                sortedLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.name}</TableCell>
                    <TableCell>
                      {license.type.charAt(0).toUpperCase() + license.type.slice(1)}
                    </TableCell>
                    <TableCell>{license.department}</TableCell>
                    <TableCell>{license.supplier}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{license.serviceOwner}</div>
                        <div className="text-sm text-muted-foreground">{license.serviceOwnerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatCreditCard(license)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(license.renewalDate)}</TableCell>
                    <TableCell>${license.monthlyCost.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(license.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(license)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(license)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LicenseTable;
