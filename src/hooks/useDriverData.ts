
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReportListItem, IncidentType, ReportStatus } from '@/types';
import { DriverProfileViewData, DriverProfileReportItem } from '@/components/reports/reportTypes';
import { getAllReports } from '@/api/driverRegistry';
import { extractReportsFromResponse, mapReportToListItem } from '@/lib/reportMappers';

const fetchReports = async (): Promise<ReportListItem[]> => {
  const response = await getAllReports();
  return extractReportsFromResponse(response.data)
    .map(mapReportToListItem)
    .map((report) => ({
      ...report,
      incident_type: report.incident_type as IncidentType,
      status: report.status as ReportStatus,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const useDriverData = (searchTerm: string) => {
    const { data: allReports = [], isLoading: isLoadingReports, error: reportsError } = useQuery<ReportListItem[], Error>({
        queryKey: ['allReportsForProfiles'],
        queryFn: fetchReports,
    });
    
    const [driverProfiles, setDriverProfiles] = useState<DriverProfileViewData[]>([]);
    const [filteredReportItems, setFilteredReportItems] = useState<ReportListItem[]>([]);
    const [totalReportCount, setTotalReportCount] = useState<number>(0);

    const processAndFilterData = useCallback(() => {
        let reportsToProcess = allReports;
        const lowerSearchTerm = searchTerm.toLowerCase();

        if (lowerSearchTerm) {
            reportsToProcess = allReports.filter(report =>
                report.driver_name.toLowerCase().includes(lowerSearchTerm) ||
                report.cdl_number.toLowerCase().includes(lowerSearchTerm) ||
                report.company_name_making_report.toLowerCase().includes(lowerSearchTerm)
            );
        }
        setFilteredReportItems(reportsToProcess);

        const groupedByDriver: { [key: string]: ReportListItem[] } = {};
        reportsToProcess.forEach(report => {
            const driverKey = `${report.driver_name}-${report.cdl_number}`; // Normalize key
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
        setTotalReportCount(reportsToProcess.length);
    }, [allReports, searchTerm]);

    useEffect(() => {
        processAndFilterData();
    }, [allReports, searchTerm, processAndFilterData]);

    return { driverProfiles, filteredReportItems, totalReportCount, isLoading: isLoadingReports, error: reportsError };
};
