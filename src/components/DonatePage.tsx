import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Copy,
  CreditCard,
  Download,
  Expand,
  Globe,
  Heart,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import {
  DonationAllocation,
  DonationContent,
  DonationMethod,
  DonationRecord,
  DonationsService
} from '../services/DonationsService';
import { convertToCORSFreeLink } from '../services/DriveService';

interface DonatePageProps {
  onBack: () => void;
}

const MANILA_TIME_ZONE = 'Asia/Manila';

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency || 'PHP',
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${currency || 'PHP'} ${amount.toFixed(2)}`;
  }
};

const formatManilaDateTime = (dateString: string) => {
  if (!dateString) return 'Recently';

  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(timestamp));
};

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load.'));
    image.src = src;
  });

const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas export failed.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });

const CopyRow: React.FC<{
  label: string;
  value: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (value: string, fieldKey: string) => void;
  valueClassName?: string;
}> = ({ label, value, fieldKey, copiedField, onCopy, valueClassName }) => {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 border border-white/10">
      <div className="min-w-0">
        <div className="text-xs font-bold text-ocean-deep/50 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </div>
        <div className={`mt-1 break-words font-semibold text-ocean-deep dark:text-white ${valueClassName || ''}`}>
          {value || 'Not yet available'}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onCopy(value, fieldKey)}
        className="mt-0.5 shrink-0 rounded-lg bg-white/10 p-2 text-ocean-deep transition-colors hover:bg-primary-cyan/20 dark:text-white"
        title={`Copy ${label}`}
        disabled={!value}
      >
        {copiedField === fieldKey ? (
          <CheckCircle size={16} className="text-green-500" />
        ) : (
          <Copy size={16} />
        )}
      </button>
    </div>
  );
};

const AllocationList: React.FC<{ allocations: DonationAllocation[] }> = ({ allocations }) => {
  if (!allocations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-ocean-deep/60 dark:text-gray-400">
        Donation allocation details will appear here once published from the donations backend.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {allocations.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex justify-between text-sm font-bold text-ocean-deep dark:text-white">
            <span>{item.label}</span>
            <span>{item.percentage}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${item.color || 'bg-primary-blue'}`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentDonationsList: React.FC<{ recentDonations: DonationRecord[] }> = ({ recentDonations }) => {
  if (!recentDonations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-ocean-deep/60 dark:text-gray-400">
        No recent donations have been published yet.
      </div>
    );
  }

  return (
    <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
      {recentDonations.map((donation) => (
        <div
          key={donation.id}
          className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-cyan to-primary-blue text-xs font-bold text-white">
              {donation.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-ocean-deep dark:text-white">{donation.name}</div>
              <div className="text-xs text-ocean-deep/50 dark:text-gray-400">
                {donation.method} • {formatManilaDateTime(donation.donatedAt)} Manila
              </div>
            </div>
          </div>
          <div className="font-bold text-primary-blue dark:text-primary-cyan">
            {formatCurrency(donation.amount, donation.currency)}
          </div>
        </div>
      ))}
    </div>
  );
};

export const DonatePage: React.FC<DonatePageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'national' | 'international'>('national');
  const [selectedLocalMethodId, setSelectedLocalMethodId] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<DonationContent | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadDonationContent = async () => {
      setLoading(true);
      setError(null);

      const result = await DonationsService.getPublicDonationData();

      if (!result.success || !result.data) {
        setError(result.error || 'Unable to load donation details right now.');
      }

      setContent(result.data || null);
      setLoading(false);
    };

    void loadDonationContent();
  }, []);

  useEffect(() => {
    if (!content?.localMethods.length) {
      setSelectedLocalMethodId('');
      return;
    }

    setSelectedLocalMethodId((current) => {
      const hasCurrent = content.localMethods.some((method) => method.id === current);
      return hasCurrent ? current : content.localMethods[0].id;
    });
  }, [content]);

  const selectedLocalMethod = useMemo<DonationMethod | null>(() => {
    if (!content?.localMethods.length) return null;
    return content.localMethods.find((method) => method.id === selectedLocalMethodId) || content.localMethods[0];
  }, [content, selectedLocalMethodId]);

  const selectedQrImageUrl = selectedLocalMethod?.qrImageUrl
    ? convertToCORSFreeLink(selectedLocalMethod.qrImageUrl)
    : '';

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const handleDownloadQr = () => {
    if (!selectedLocalMethod?.qrImageFileId || !selectedLocalMethod) return;
    const qrImageFileId = selectedLocalMethod.qrImageFileId;

    void (async () => {
      let sourceObjectUrl = '';
      let downloadObjectUrl = '';
      try {
        const result = await DonationsService.downloadDonationQr(qrImageFileId);
        if (!result.success || !result.data?.fileData) {
          throw new Error(result.error || 'QR download payload is empty.');
        }

        const binary = window.atob(result.data.fileData);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }

        const sourceBlob = new Blob([bytes], { type: result.data.fileType || 'image/png' });
        sourceObjectUrl = URL.createObjectURL(sourceBlob);

        const image = await loadImageElement(sourceObjectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas context is unavailable.');
        }

        context.drawImage(image, 0, 0);

        const pngBlob = await canvasToPngBlob(canvas);
        downloadObjectUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement('a');
        link.href = downloadObjectUrl;
        link.download = (result.data.fileName || 'donation-qr.png').replace(/\.[^.]+$/, '') + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('[DonatePage] QR download failed', {
          selectedLocalMethod,
          selectedQrImageUrl,
          qrImageFileId: selectedLocalMethod.qrImageFileId,
          error: error instanceof Error ? error.message : String(error)
        });
        window.open(selectedQrImageUrl, '_blank', 'noopener,noreferrer');
      } finally {
        if (sourceObjectUrl) {
          URL.revokeObjectURL(sourceObjectUrl);
        }
        if (downloadObjectUrl) {
          URL.revokeObjectURL(downloadObjectUrl);
        }
      }
    })();
  };

  const bankDetails = content?.bankDetails;

  return (
    <div className="relative min-h-screen pb-12 pt-24">
      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-full bg-white/10 p-3 text-ocean-deep backdrop-blur-md transition-all hover:-translate-x-1 hover:bg-white/20 dark:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-ocean-deep dark:text-white md:text-5xl">
            Support Our Cause
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div className="glass-card relative flex overflow-hidden rounded-3xl p-1">
              <button
                onClick={() => setActiveTab('national')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-center text-lg font-bold transition-all duration-300 ${
                  activeTab === 'national'
                    ? 'bg-gradient-to-r from-primary-cyan to-primary-blue text-white shadow-lg'
                    : 'text-ocean-deep/60 hover:bg-white/5 dark:text-gray-400'
                }`}
              >
                <Smartphone size={20} />
                National (PH)
              </button>
              <button
                onClick={() => setActiveTab('international')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-center text-lg font-bold transition-all duration-300 ${
                  activeTab === 'international'
                    ? 'bg-gradient-to-r from-primary-blue to-purple-600 text-white shadow-lg'
                    : 'text-ocean-deep/60 hover:bg-white/5 dark:text-gray-400'
                }`}
              >
                <CreditCard size={20} />
                International
              </button>
            </div>

            <div className="glass-card min-h-[500px] rounded-3xl border border-white/20 p-6 md:p-10">
              {loading ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary-blue" />
                  <p className="font-medium text-ocean-deep dark:text-white">Loading donation details...</p>
                </div>
              ) : activeTab === 'national' ? (
                <div className="animate-fadeIn space-y-8">
                  <div className="text-center">
                    <h2 className="mb-2 text-2xl font-bold text-ocean-deep dark:text-white">Scan or Transfer</h2>
                    <p className="text-ocean-deep/60 dark:text-gray-300">
                      Donate through the payment methods published in the donations backend.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-ocean-deep dark:text-gray-200">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <div>{error}</div>
                    </div>
                  )}

                  {content?.localMethods.length ? (
                    <>
                      <div className="flex flex-wrap justify-center gap-4">
                        {content.localMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedLocalMethodId(method.id)}
                            className={`transform rounded-xl px-6 py-3 font-bold transition-all hover:scale-105 ${
                              selectedLocalMethod?.id === method.id
                                ? `${method.color || 'bg-primary-blue'} scale-105 text-white shadow-lg ring-2 ring-white/20`
                                : 'bg-white/10 text-ocean-deep hover:bg-white/20 dark:text-gray-300'
                            }`}
                          >
                            {method.name}
                          </button>
                        ))}
                      </div>

                      {selectedLocalMethod && (
                        <div className="flex flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/50 p-6 backdrop-blur-sm dark:bg-black/20 md:flex-row md:p-8">
                          <div className="rounded-xl bg-white p-4 shadow-xl transition-transform duration-300 hover:scale-105">
                            {selectedLocalMethod.qrImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setIsQrModalOpen(true)}
                                className="block transition-transform duration-300 hover:scale-[1.02]"
                              >
                                <img
                                  src={selectedQrImageUrl}
                                  alt={`${selectedLocalMethod.name} QR code`}
                                  referrerPolicy="no-referrer"
                                  onError={(event) => {
                                    console.error('[DonatePage] QR image failed to load', {
                                      selectedLocalMethod,
                                      attemptedSrc: event.currentTarget.currentSrc || event.currentTarget.src,
                                      rawQrImageUrl: selectedLocalMethod.qrImageUrl,
                                      normalizedQrImageUrl: selectedQrImageUrl
                                    });
                                  }}
                                  className="h-48 w-48 object-contain md:h-56 md:w-56"
                                />
                              </button>
                            ) : (
                              <div className="flex h-48 w-48 flex-col items-center justify-center gap-3 text-center text-gray-500 md:h-56 md:w-56">
                                <QrCode size={56} />
                                <span className="text-sm font-semibold">
                                  QR image not uploaded yet for {selectedLocalMethod.name}
                                </span>
                              </div>
                            )}
                            <div className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                              Scan to Pay
                            </div>
                            {selectedLocalMethod.qrImageUrl && (
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <button
                                  type="button"
                                  onClick={() => setIsQrModalOpen(true)}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-cyan"
                                >
                                  <Expand size={16} />
                                  View Full QR
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadQr}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-ocean-deep transition-colors hover:bg-white/20 dark:text-white"
                                >
                                  <Download size={16} />
                                  Download QR
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="w-full flex-1 space-y-4">
                            <CopyRow
                              label="Method"
                              value={selectedLocalMethod.name}
                              fieldKey={`${selectedLocalMethod.id}-name`}
                              copiedField={copiedField}
                              onCopy={handleCopy}
                            />
                            <CopyRow
                              label="Account Name"
                              value={selectedLocalMethod.accountName}
                              fieldKey={`${selectedLocalMethod.id}-account-name`}
                              copiedField={copiedField}
                              onCopy={handleCopy}
                            />
                            <CopyRow
                              label="Account Number"
                              value={selectedLocalMethod.accountNumber}
                              fieldKey={`${selectedLocalMethod.id}-account-number`}
                              copiedField={copiedField}
                              onCopy={handleCopy}
                              valueClassName="font-mono text-lg text-primary-blue dark:text-primary-cyan"
                            />

                            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-ocean-deep/60 dark:text-gray-400">
                              <ShieldCheck size={16} className="text-yellow-500" />
                              <span>Please save a screenshot of your transaction for reference.</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-ocean-deep/60 dark:text-gray-400">
                      No national donation methods have been published yet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col justify-center space-y-8 animate-fadeIn">
                  <div className="mb-4 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-ocean-deep dark:text-white">International Donation</h2>
                    <p className="text-ocean-deep/60 dark:text-gray-300">
                      Use the bank transfer details below for international donations.
                    </p>
                  </div>

                  <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#0c1c33] via-[#10274a] to-[#0b4a6f] p-6 text-white shadow-2xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.35em] text-blue-100/70">Bank Transfer</div>
                        <h3 className="mt-2 text-2xl font-black">{bankDetails?.bankName}</h3>
                      </div>
                      <Globe className="h-8 w-8 text-blue-100/80" />
                    </div>

                    <div className="space-y-3">
                      <CopyRow
                        label="Bank Name"
                        value={bankDetails?.bankName || ''}
                        fieldKey="bank-name"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                      />
                      <CopyRow
                        label="Account Name"
                        value={bankDetails?.accountName || ''}
                        fieldKey="bank-account-name"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                      />
                      <CopyRow
                        label="Account Number"
                        value={bankDetails?.accountNumber || ''}
                        fieldKey="bank-account-number"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                        valueClassName="font-mono text-primary-cyan"
                      />
                      <CopyRow
                        label="SWIFT Code"
                        value={bankDetails?.swiftCode || ''}
                        fieldKey="bank-swift-code"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                        valueClassName="font-mono text-primary-cyan"
                      />
                      <CopyRow
                        label="Bank Address"
                        value={bankDetails?.bankAddress || ''}
                        fieldKey="bank-address"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                      />
                      <CopyRow
                        label="Currency"
                        value={bankDetails?.currency || ''}
                        fieldKey="bank-currency"
                        copiedField={copiedField}
                        onCopy={handleCopy}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-blue-50/90">
                      {content?.referenceNote || 'Reference instructions are not configured yet.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="glass-card rounded-3xl border border-white/20 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-ocean-deep dark:text-white">
                <TrendingUp className="text-primary-cyan" />
                Where your donation goes
              </h3>
              <AllocationList allocations={content?.allocations || []} />
            </div>

            <div className="glass-card rounded-3xl border border-white/20 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-ocean-deep dark:text-white">
                <Heart className="animate-pulse text-red-500 fill-red-500" />
                Recent Donations
              </h3>
              <RecentDonationsList recentDonations={content?.recentDonations || []} />
              <div className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-ocean-deep/40 dark:text-gray-500">
                Thank you for supporting Dyesabel Philippines Inc.
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-emerald-400/20 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                <div>
                  <h3 className="text-lg font-bold text-ocean-deep dark:text-white">Transparency & Trust</h3>
                  <p className="mt-1 text-sm text-ocean-deep/60 dark:text-gray-400">
                    Dyesabel Philippines Inc. operates as a registered organization in the Philippines.
                  </p>
                  <div className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-ocean-deep dark:text-white">
                    {content?.secRegistrationNumber ? `SEC Reg. No. ${content.secRegistrationNumber}` : 'SEC registration number not published yet.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isQrModalOpen && selectedLocalMethod && selectedQrImageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#07141c] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary-cyan/80">QR Code</div>
                <h3 className="mt-1 text-2xl font-black text-white">{selectedLocalMethod.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-cyan"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex justify-center rounded-2xl bg-white p-4">
              <img
                src={selectedQrImageUrl}
                alt={`${selectedLocalMethod.name} QR code full size`}
                referrerPolicy="no-referrer"
                onError={(event) => {
                  console.error('[DonatePage] Full-size QR image failed to load', {
                    selectedLocalMethod,
                    attemptedSrc: event.currentTarget.currentSrc || event.currentTarget.src,
                    rawQrImageUrl: selectedLocalMethod.qrImageUrl,
                    normalizedQrImageUrl: selectedQrImageUrl
                  });
                }}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
