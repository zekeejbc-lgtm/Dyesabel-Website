import { convertToCORSFreeLink } from './DriveService';
import { sendApiRequest } from './apiClient';

export interface DonationMethod {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  qrImageUrl: string;
  color?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export interface DonationAllocation {
  label: string;
  percentage: number;
  color?: string;
}

export interface DonationBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  bankAddress: string;
  currency: string;
}

export interface DonationRecord {
  id: string;
  name: string;
  amount: number;
  currency: string;
  method: string;
  donatedAt: string;
}

export interface DonationContent {
  localMethods: DonationMethod[];
  bankDetails: DonationBankDetails;
  referenceNote: string;
  secRegistrationNumber: string;
  allocations: DonationAllocation[];
  recentDonations: DonationRecord[];
}

interface DonationsApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

const emptyContent: DonationContent = {
  localMethods: [],
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    bankAddress: '',
    currency: ''
  },
  referenceNote: '',
  secRegistrationNumber: '',
  allocations: [],
  recentDonations: []
};

const normalizeMethod = (method: Partial<DonationMethod>, index: number): DonationMethod => ({
  id: String(method.id || `method-${index + 1}`),
  name: String(method.name || `Method ${index + 1}`),
  accountName: String(method.accountName || ''),
  accountNumber: String(method.accountNumber || ''),
  qrImageUrl: convertToCORSFreeLink(method.qrImageUrl || ''),
  color: method.color || 'bg-primary-blue',
  isEnabled: method.isEnabled !== false,
  sortOrder: Number.isFinite(method.sortOrder) ? Number(method.sortOrder) : index
});

const normalizeAllocation = (allocation: Partial<DonationAllocation>): DonationAllocation => ({
  label: String(allocation.label || 'Donation Allocation'),
  percentage: Number(allocation.percentage || 0),
  color: allocation.color || 'bg-primary-blue'
});

const normalizeDonation = (donation: Partial<DonationRecord>, index: number): DonationRecord => ({
  id: String(donation.id || `donation-${index + 1}`),
  name: String(donation.name || 'Anonymous'),
  amount: Number(donation.amount || 0),
  currency: String(donation.currency || 'PHP'),
  method: String(donation.method || 'Donation'),
  donatedAt: String(donation.donatedAt || '')
});

const normalizeContent = (content: Partial<DonationContent> | undefined): DonationContent => {
  if (!content) return emptyContent;

  const localMethods = Array.isArray(content.localMethods)
    ? content.localMethods
        .map(normalizeMethod)
        .filter((method) => method.isEnabled)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  return {
    localMethods,
    bankDetails: {
      bankName: String(content.bankDetails?.bankName || ''),
      accountName: String(content.bankDetails?.accountName || ''),
      accountNumber: String(content.bankDetails?.accountNumber || ''),
      swiftCode: String(content.bankDetails?.swiftCode || ''),
      bankAddress: String(content.bankDetails?.bankAddress || ''),
      currency: String(content.bankDetails?.currency || '')
    },
    referenceNote: String(content.referenceNote || ''),
    secRegistrationNumber: String(content.secRegistrationNumber || ''),
    allocations: Array.isArray(content.allocations)
      ? content.allocations.map(normalizeAllocation)
      : [],
    recentDonations: Array.isArray(content.recentDonations)
      ? content.recentDonations.map(normalizeDonation)
      : []
  };
};

export const DonationsService = {
  async getPublicDonationData(): Promise<DonationsApiResponse<DonationContent>> {
    const result = await sendApiRequest<DonationContent>('donations', { action: 'getPublicDonationData' });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unable to load donation data.'
      };
    }

    return {
      success: true,
      data: normalizeContent(result.data)
    };
  },

  async subscribeNewsletter(email: string, source = 'Website Footer'): Promise<DonationsApiResponse> {
    return sendApiRequest('main', {
      action: 'subscribeNewsletter',
      email,
      source
    });
  }
};
