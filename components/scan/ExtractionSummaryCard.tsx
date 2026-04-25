import { Text, View } from 'react-native';

import type { ScanPreviewData } from '@/hooks/scan/useInvoiceScan';
import type { Colors } from '@/constants/theme';

type ExtractionSummaryCardProps = {
  colors: (typeof Colors)['dark'];
  error: string | null;
  isLoading: boolean;
  previewData: ScanPreviewData | null;
  previewUri: string | null;
};

export function ExtractionSummaryCard({
  colors,
  error,
  isLoading,
  previewData,
  previewUri,
}: ExtractionSummaryCardProps) {
  const summaryVendor = previewData?.extracted.vendor_name ?? null;
  const summaryDate = previewData?.extracted.invoice_date ?? null;
  const summaryTotal = previewData?.extracted.total_amount;
  const summaryStatus = error ? 'error' : isLoading ? 'reading' : previewData?.status ?? (previewUri ? 'ready' : 'idle');
  const summarySnippet = previewData?.rawText?.slice(0, 42)?.replace(/\s+/g, ' ');

  return (
    <View
      className="absolute bottom-3 right-2 w-[220px] rounded-[24px] border px-4 py-4"
      style={{
        backgroundColor: `${colors.surface}F2`,
        borderColor: colors.border,
      }}>
      <Text
        allowFontScaling={false}
        className="text-xs font-bold"
        maxFontSizeMultiplier={1}
        style={{ color: colors.foreground, fontFamily: 'monospace', includeFontPadding: false }}
      >
        EXTRACTION SUMMARY
      </Text>
      <View className="mt-3 gap-1">
        <Text
          allowFontScaling={false}
          className="text-tiny"
          maxFontSizeMultiplier={1}
          style={{ color: colors.muted, fontFamily: 'monospace', includeFontPadding: false }}
        >
          {`"vendor": ${summaryVendor ? `"${summaryVendor}"` : 'null'}`}
        </Text>
        <Text
          allowFontScaling={false}
          className="text-tiny"
          maxFontSizeMultiplier={1}
          style={{ color: colors.muted, fontFamily: 'monospace', includeFontPadding: false }}
        >
          {`"date": ${summaryDate ? `"${summaryDate}"` : 'null'}`}
        </Text>
        <Text
          allowFontScaling={false}
          className="text-tiny"
          maxFontSizeMultiplier={1}
          style={{ color: colors.muted, fontFamily: 'monospace', includeFontPadding: false }}
        >
          {`"total": ${
            summaryTotal !== null && summaryTotal !== undefined
              ? `"${summaryTotal.toFixed(2)} ${previewData?.extracted.currency ?? 'VND'}"`
              : 'null'
          }`}
        </Text>
        <Text
          allowFontScaling={false}
          className="text-tiny"
          maxFontSizeMultiplier={1}
          style={{ color: colors.muted, fontFamily: 'monospace', includeFontPadding: false }}
        >
          {`"status": "${summaryStatus}"`}
        </Text>
        {!summaryVendor && summarySnippet ? (
          <Text
            allowFontScaling={false}
            className="text-2xs"
            maxFontSizeMultiplier={1}
            style={{ color: colors.muted, fontFamily: 'monospace', includeFontPadding: false }}
          >
            {`"text": "${summarySnippet}${previewData?.rawText && previewData.rawText.length > 42 ? '…' : ''}"`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
