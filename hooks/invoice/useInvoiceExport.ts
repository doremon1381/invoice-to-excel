import { useCallback, useState } from 'react';

import { exportAllInvoicesToExcel, exportSingleInvoiceToExcel } from '@/lib/export';
import { translate } from "@/lib/i18n";

export function useInvoiceExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportAll = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      await exportAllInvoicesToExcel();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : translate("database.alertExportFailedMessage"),
      );
      throw caughtError;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportSingle = useCallback(async (invoiceId: number) => {
    setIsExporting(true);
    setError(null);

    try {
      await exportSingleInvoiceToExcel(invoiceId);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : translate("invoice.alertExportFailedMessage"),
      );
      throw caughtError;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    error,
    exportAll,
    exportSingle,
    isExporting,
  };
}
