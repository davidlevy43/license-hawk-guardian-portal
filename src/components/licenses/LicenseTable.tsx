
import React, { useState } from "react";
import { useLicenses } from "@/context/LicenseContext";
import { License, LicenseStatus, LicenseType, PaymentMethod, CostType } from "@/types";
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

  // Fixed credit card formatting function
  const formatCreditCard = (license: License) => {
    // Check both camelCase and snake_case versions of payment method
    const paymentMethod = license.paymentMethod || (license as any).payment_method;
    const creditCardDigits = license.creditCardDigits || (license as any).credit_card_digits;
    
    // Check if payment method is credit card (handle both string and enum values)
    const isCreditCard = paymentMethod === PaymentMethod.CREDIT_CARD || 
                        paymentMethod === "credit_card";
    
    if (!isCreditCard) {
      return "-";
    }
    
    // Check if digits exist and are not empty
    if (!creditCardDigits || String(creditCardDigits).trim() === "") {
      return "Not specified";
    }
    
    return `****${String(creditCardDigits)}`;
  };

  // Helper function to normalize cost type values
  const normalizeCostType = (costType: any): string => {
    if (!costType) return 'monthly';
    
    // Convert enum values to string equivalents
    if (costType === CostType.MONTHLY || costType === 'monthly') return 'monthly';
    if (costType === CostType.YEARLY || costType === 'yearly') return 'yearly';
    if (costType === CostType.ONE_TIME || costType === 'one_time') return 'one_time';
    
    return String(costType).toLowerCase();
  };

  // Updated function to format cost based on cost type
  const formatCost = (license: License) => {
    const costType = normalizeCostType(license.costType || (license as any).cost_type);
    const monthlyCost = license.monthlyCost;
    
    console.log(`🔍 formatCost for ${license.name}:`, {
      costType,
      monthlyCost,
      normalizedCostType: costType
    });
    
    switch (costType) {
      case 'monthly':
        return `$${monthlyCost.toFixed(2)}/month`;
      case 'yearly':
        return `$${monthlyCost.toFixed(2)}/year`;
      case 'one_time':
        return `$${monthlyCost.toFixed(2)} (one-time)`;
      default:
        console.log(`🔍 Unknown cost type: ${costType}, defaulting to monthly`);
        return `$${monthlyCost.toFixed(2)}`;
    }
  };

  // Calculate monthly equivalent for yearly costs - FIXED VERSION
  const getMonthlyEquivalent = (license: License) => {
    const costType = normalizeCostType(license.costType || (license as any).cost_type);
    const cost = license.monthlyCost;
    
    console.log(`🔍 FIXED Monthly equivalent calc for ${license.name}:`, {
      costType,
      cost,
      normalizedCostType: costType
    });
    
    // Check for yearly cost type
    if (costType === 'yearly') {
      const monthlyEquivalent = (cost / 12).toFixed(2);
      console.log(`🔍 ✅ Yearly cost detected, monthly equivalent: ${monthlyEquivalent}`);
      return monthlyEquivalent;
    }
    
    if (costType === 'one_time') {
      console.log(`🔍 One-time cost detected, returning "-"`);
      return "-";
    }
    
    console.log(`🔍 Monthly cost detected, returning: ${cost.toFixed(2)}`);
    return cost.toFixed(2);
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
                <SortableHeader field="monthlyCost">Cost</SortableHeader>
                <TableHead>Monthly Equivalent</TableHead>
                <SortableHeader field="status">Status</SortableHeader>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLicenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
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
                    <TableCell>
                      <div className="text-sm">
                        {formatCost(license)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        ${getMonthlyEquivalent(license)}/month
                      </div>
                    </TableCell>
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
