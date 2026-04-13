
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ReportListItem, ReportStatus as ReportStatusType, IncidentType } from '@/types';
import { DriverProfileReportItem, DriverProfileViewData } from '@/components/reports/reportTypes';
import { useToast } from '@/hooks/use-toast';
import { getAllReports, getDriverByCdl } from '@/api/driverRegistry';
import {
  extractReportsFromResponse,
  mapDriverLookupResponseToProfile,
  mapDriverLookupResponseToReports,
  mapReportToListItem
} from '@/lib/reportMappers';

const reportStatuses: ReportStatusType[] = ["Pending", "Reviewed", "Approved", "Resolved", "Rejected", "info_requested"];

const fetchReports = async (): Promise<ReportListItem[]> => {
  const response = await getAllReports();
  return extractReportsFromResponse(response.data)
    .map(mapReportToListItem)
    .map((report) => ({
      ...report,
      incident_type: report.incident_type as IncidentType,
      status: report.status as ReportStatusType,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const useReportData = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const { data: allReports = [], isLoading: isLoadingReports, error: reportsError } = useQuery<ReportListItem[], Error>({
    queryKey: ['reports'],
    queryFn: fetchReports,
  });

  const initialStatusFromUrl = searchParams.get('status');
  const validStatuses: (ReportStatusType | "All")[] = [...reportStatuses, "All"];
  const initialStatus = initialStatusFromUrl && validStatuses.includes(initialStatusFromUrl as any) ? initialStatusFromUrl as ReportStatusType | "All" : "All";

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatusType | "All">(initialStatus);
  const [displayedReports, setDisplayedReports] = useState<ReportListItem[]>([]);
  const [driverProfiles, setDriverProfiles] = useState<DriverProfileViewData[]>([]);

  const processAndSetReportData = useCallback((reportsToFilter: ReportListItem[]) => {
    setDisplayedReports(reportsToFilter);

    const groupedByDriver: { [key: string]: ReportListItem[] } = {};
    reportsToFilter.forEach(report => {
      const driverKey = `${report.driver_name}-${report.cdl_number}`;
      if (!groupedByDriver[driverKey]) {
        groupedByDriver[driverKey] = [];
      }
      groupedByDriver[driverKey].push(report);
    });

    const profiles: DriverProfileViewData[] = Object.values(groupedByDriver).map(reports => {
      const representativeReport = reports[0];
      const email = reports.find(r => r.driver_email)?.driver_email || "Not Available";
      const phone = reports.find(r => r.driver_phone)?.driver_phone || "Not Available";
      return {
        driver_name: representativeReport.driver_name,
        cdl_number: representativeReport.cdl_number,
        phone,
        email,
        report_count: reports.length,
        reports: reports.map((r): DriverProfileReportItem => ({
          id: r.id,
          incident_type: r.incident_type,
          description: r.description,
          location: r.location,
          date_occurred: r.date_occurred,
        })).sort((a, b) => new Date(b.date_occurred).getTime() - new Date(a.date_occurred).getTime()).slice(0, 5),
      };
    }).sort((a,b) => a.driver_name.localeCompare(b.driver_name));
    setDriverProfiles(profiles);
  }, []);

  const applyFilters = useCallback(() => {
    let reportsToFilter = allReports;
    if (appliedSearchTerm) {
      const lowerSearchTerm = appliedSearchTerm.toLowerCase();
      reportsToFilter = reportsToFilter.filter(report =>
        report.driver_name.toLowerCase().includes(lowerSearchTerm) ||
        report.company_name_making_report.toLowerCase().includes(lowerSearchTerm) ||
        report.cdl_number.toLowerCase() === lowerSearchTerm
      );
    }
    if (selectedStatus !== "All") {
      reportsToFilter = reportsToFilter.filter(report => report.status === selectedStatus);
    }
    processAndSetReportData(reportsToFilter);
  }, [allReports, appliedSearchTerm, selectedStatus, processAndSetReportData]);

  useEffect(() => {
    if (reportsError) {
      toast({
        title: "Error Fetching Reports",
        description: reportsError.message,
        variant: "destructive",
      });
    }
  }, [reportsError, toast]);

  useEffect(() => {
    applyFilters();
  }, [allReports, appliedSearchTerm, selectedStatus, applyFilters]);
  
  const handleSearchButtonClick = () => {
    const trimmedSearchTerm = searchTerm.trim();
    setAppliedSearchTerm(trimmedSearchTerm);

    if (!trimmedSearchTerm) {
      processAndSetReportData(
        selectedStatus === "All"
          ? allReports
          : allReports.filter((report) => report.status === selectedStatus)
      );
      return;
    }

    getDriverByCdl(trimmedSearchTerm)
      .then((response) => {
        const remoteReports = mapDriverLookupResponseToReports(response.data).filter((report) =>
          selectedStatus === "All" ? true : report.status === selectedStatus
        );
        const remoteProfile = mapDriverLookupResponseToProfile(response.data);

        if (remoteReports.length > 0) {
          setDisplayedReports(remoteReports);
          setDriverProfiles(remoteProfile ? [remoteProfile] : []);
        }
      })
      .catch(() => {
        // Keep existing local search behavior when CDL lookup doesn't match.
      });
  };

  const handleStatusChange = (value: ReportStatusType | "All") => {
    setSelectedStatus(value);
  };

  return {
    isLoadingReports,
    reportsError,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    handleStatusChange,
    handleSearchButtonClick,
    reportStatuses,
    displayedReports,
    driverProfiles,
  };
};
