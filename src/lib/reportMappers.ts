import { Report, ReportListItem } from '@/types';
import { DriverProfileViewData } from '@/components/reports/reportTypes';

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.reports)) {
    return value.reports;
  }

  if (Array.isArray(value?.complaints)) {
    return value.complaints;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
};

const getCandidateSources = (item: any) =>
  [
    item,
    item?.complaint,
    item?.report,
    item?.sourceComplaint,
    item?.originalComplaint,
    item?.reports?.[0],
    item?.complaints?.[0],
  ].filter(Boolean);

const read = (item: any, ...keys: string[]) => {
  for (const source of getCandidateSources(item)) {
    const match = keys.find((key) => {
      const value = source?.[key];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });

    if (match) {
      return source[match];
    }
  }

  return undefined;
};

const normalizeStatus = (item: any): Report['status'] => {
  const rawStatus = String(read(item, 'status', 'reportStatus') || '').toLowerCase();

  if (rawStatus === 'approved' || item?.approvedAt) {
    return 'Approved';
  }

  if (rawStatus === 'rejected') {
    return 'Rejected';
  }

  if (rawStatus === 'resolved') {
    return 'Resolved';
  }

  if (rawStatus === 'reviewed') {
    return 'Reviewed';
  }

  if (rawStatus === 'info_requested') {
    return 'info_requested';
  }

  return 'Pending';
};

export const mapApiReportToReport = (item: any): Report => {
  const driverFirstName = read(item, 'driver_first_name', 'driverFirstName', 'DriverFirstName', 'firstName') || '';
  const driverLastName = read(item, 'driver_last_name', 'driverLastName', 'DriverLastName', 'lastName') || '';
  const incidentProofs = read(item, 'incident_proofs_urls', 'incidentProofsUrls', 'IncidentProofsUrls', 'proofFiles', 'incidentProofs');

  return {
    id: String(read(item, 'id', 'reportId', 'ReportId', 'complaintId') || ''),
    created_at: String(read(item, 'created_at', 'createdAt', 'CreatedAt', 'submissionDate') || ''),
    updated_at: String(read(item, 'updated_at', 'updatedAt', 'UpdatedAt', 'created_at', 'createdAt', 'CreatedAt', 'submissionDate') || ''),
    reporter_profile_id: String(read(item, 'reporter_profile_id', 'reporterProfileId', 'ReporterProfileId', 'userId') || ''),
    driver_first_name: driverFirstName || null,
    driver_last_name: driverLastName || null,
    cdl_number: String(read(item, 'cdl_number', 'cdlNumber', 'CdlNumber', 'driverCdl', 'DriverCdl', 'licenseNumber') || 'N/A'),
    driver_email: read(
      item,
      'driver_email',
      'driverEmail',
      'DriverEmail',
      'email',
      'Email',
      'driverMail',
      'DriverMail',
      'driverEmailAddress',
      'DriverEmailAddress'
    ) || null,
    driver_phone: read(
      item,
      'driver_phone',
      'driverPhone',
      'DriverPhone',
      'phone',
      'Phone',
      'phoneNumber',
      'PhoneNumber',
      'driverMobile',
      'DriverMobile',
      'contactNumber',
      'ContactNumber'
    ) || null,
    incident_type: read(item, 'incident_type', 'incidentType', 'IncidentType', 'type') || 'other',
    date_occurred: String(read(item, 'date_occurred', 'dateOccurred', 'DateOccurred', 'incidentDate') || ''),
    location: String(read(item, 'location', 'Location', 'incidentLocation') || 'N/A'),
    description: String(read(item, 'description', 'Description', 'incidentDescription', 'details') || 'No description provided.'),
    company_name_making_report: String(read(item, 'company_name_making_report', 'companyNameMakingReport', 'CompanyNameMakingReport', 'companyName', 'CompanyName') || 'N/A'),
    company_phone_making_report: read(item, 'company_phone_making_report', 'companyPhoneMakingReport', 'CompanyPhoneMakingReport', 'companyPhone', 'CompanyPhone') || null,
    company_email_making_report: read(item, 'company_email_making_report', 'companyEmailMakingReport', 'CompanyEmailMakingReport', 'companyEmail', 'CompanyEmail') || null,
    status: normalizeStatus(item),
    driver_id_license_url: read(item, 'driver_id_license_url', 'driverIdLicenseUrl', 'DriverIdLicenseUrl', 'driverIdFileUrl', 'licenseUrl') || null,
    incident_proofs_urls: Array.isArray(incidentProofs) ? incidentProofs : null,
    moderator_notes: read(item, 'moderator_notes', 'moderatorNotes', 'ModeratorNotes', 'notes') || null,
  } as Report;
};

export const extractReportsFromResponse = (payload: any): Report[] =>
  asArray(payload).map(mapApiReportToReport);

export const mapReportToListItem = (report: Report): ReportListItem => ({
  id: report.id,
  created_at: report.created_at,
  driver_name: `${report.driver_first_name || ''} ${report.driver_last_name || ''}`.trim() || 'N/A',
  driver_first_name: report.driver_first_name,
  driver_last_name: report.driver_last_name,
  cdl_number: report.cdl_number || 'N/A',
  driver_email: report.driver_email,
  driver_phone: report.driver_phone,
  incident_type: report.incident_type,
  date_occurred: report.date_occurred,
  location: report.location || 'N/A',
  description: report.description || 'No description provided.',
  status: report.status,
  company_name_making_report: report.company_name_making_report || 'N/A',
  driver_id_license_url: report.driver_id_license_url,
  incident_proofs_urls: report.incident_proofs_urls,
  moderator_notes: report.moderator_notes,
});

export const mapApiComplaintToListItem = (item: any): ReportListItem => ({
  id: String(item?.complaintId ?? ''),
  created_at: String(item?.createdAt ?? ''),
  driver_name:
    `${item?.driverFirstName || ''} ${item?.driverLastName || ''}`.trim() || 'N/A',
  driver_first_name: item?.driverFirstName || null,
  driver_last_name: item?.driverLastName || null,
  cdl_number: item?.driverCdl || 'N/A',
  driver_email: item?.driverEmail || null,
  driver_phone: item?.driverPhone || null,
  incident_type: (item?.incidentType || 'other').replace(/-/g, '_'),
  date_occurred: item?.dateOccurred || '',
  location: item?.location || 'N/A',
  description: item?.description || 'No description provided.',
  status:
    item?.status === 'approved' || item?.approvedAt
      ? 'Approved'
      : item?.status === 'pending'
      ? 'Pending'
      : item?.status === 'resolved'
        ? 'Resolved'
        : item?.status === 'rejected'
          ? 'Rejected'
          : item?.status === 'reviewed'
            ? 'Reviewed'
            : item?.status === 'info_requested'
              ? 'info_requested'
              : 'Pending',
  company_name_making_report: item?.companyName || 'N/A',
  driver_id_license_url: item?.driverIdFileUrl || null,
  incident_proofs_urls: item?.incidentProofUrl ? [item.incidentProofUrl] : null,
  moderator_notes: item?.moderatorNotes || null,
});

export const extractComplaintsFromResponse = (payload: any): ReportListItem[] =>
  asArray(payload).map(mapApiComplaintToListItem);

export const mapDriverLookupResponseToReports = (payload: any): ReportListItem[] => {
  const driver = payload?.driver ?? {};
  const reports = Array.isArray(payload?.reports) ? payload.reports : [];

  return reports.map((report: any) => ({
    id: String(report?.reportId ?? ''),
    created_at: '',
    driver_name:
      `${driver?.driverFirstName || ''} ${driver?.driverLastName || ''}`.trim() || 'N/A',
    driver_first_name: driver?.driverFirstName || null,
    driver_last_name: driver?.driverLastName || null,
    cdl_number: driver?.driverCdl || 'N/A',
    driver_email: driver?.driverEmail || null,
    driver_phone: driver?.driverPhone || null,
    incident_type: (report?.incidentType || 'other').replace(/-/g, '_'),
    date_occurred: report?.dateOccurred || '',
    location: report?.location || 'N/A',
    description: report?.description || 'No description provided.',
    status:
      report?.status === 'Approved'
        ? 'Approved'
        : report?.status === 'Rejected'
          ? 'Rejected'
          : report?.status === 'Resolved'
            ? 'Resolved'
            : report?.status === 'Reviewed'
              ? 'Reviewed'
              : report?.status === 'info_requested'
                ? 'info_requested'
                : 'Pending',
    company_name_making_report: report?.companyName || 'N/A',
    driver_id_license_url: driver?.driverIdFileUrl || null,
    incident_proofs_urls: report?.incidentProofUrl ? [report.incidentProofUrl] : null,
    moderator_notes: null,
  }));
};

export const mapDriverLookupResponseToProfile = (payload: any): DriverProfileViewData | null => {
  const driver = payload?.driver;
  if (!driver) {
    return null;
  }

  const reports = mapDriverLookupResponseToReports(payload);

  return {
    driver_name:
      `${driver?.driverFirstName || ''} ${driver?.driverLastName || ''}`.trim() || 'N/A',
    cdl_number: driver?.driverCdl || 'N/A',
    phone: driver?.driverPhone || 'Not Available',
    email: driver?.driverEmail || 'Not Available',
    report_count: Number(payload?.totalReports ?? reports.length),
    reports: reports.map((report) => ({
      id: report.id,
      incident_type: report.incident_type,
      description: report.description,
      location: report.location,
      date_occurred: report.date_occurred,
    })),
  };
};
