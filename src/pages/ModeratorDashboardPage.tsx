import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Clock, CheckCircle, ShieldAlert, LogOut } from 'lucide-react';
import { ReportListItem } from '@/types';
import DashboardStatCard from '@/components/moderator/DashboardStatCard';
import PendingReportsTable from '@/components/moderator/PendingReportsTable';
import { useAuthActions } from '@/hooks/useAuthActions';
import { getAllComplaints, getAllReports, getComplaintsCount } from '@/api/driverRegistry';
import { extractComplaintsFromResponse, extractReportsFromResponse, mapReportToListItem } from '@/lib/reportMappers';

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.complaints)) {
    return value.complaints;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
};

const fetchDashboardData = async () => {
  const [reportsResponse, complaintsResponse, complaintsCountResponse] = await Promise.all([
    getAllReports(),
    getAllComplaints(),
    getComplaintsCount(),
  ]);

  const reports = extractReportsFromResponse(reportsResponse.data).map(mapReportToListItem);
  const complaints = extractComplaintsFromResponse(complaintsResponse.data);

  const totalReports = reports.length;
  const pendingReviews = complaints.filter(r => r.status === 'Pending').length;
  const resolvedReports = Number(complaintsCountResponse.data ?? 0);
  const driverReports = reports.length; // All reports are driver-related in this system

  const pendingReportsList: ReportListItem[] = complaints
    .filter(r => r.status === 'Pending')
    .map(r => ({ ...r, status: 'Pending' }));

  return { totalReports, pendingReviews, resolvedReports, driverReports, pendingReportsList };
};

const ModeratorDashboardPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['moderatorDashboard'],
    queryFn: fetchDashboardData,
  });

  const { handleLogout, isLoading: isLoggingOut } = useAuthActions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <div className="container mx-auto py-8 text-center text-red-500">Failed to load dashboard data.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
              Moderator Dashboard
            </h1>
            <p className="text-muted-foreground">Review and manage trucking safety reports.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardStatCard title="Total Reports" value={data?.totalReports ?? 0} icon={FileText} />
        <DashboardStatCard title="Driver Reports" value={data?.driverReports ?? 0} icon={FileText} />
        <DashboardStatCard title="Pending Reviews" value={data?.pendingReviews ?? 0} icon={Clock} />
        <DashboardStatCard title="Resolved Reports" value={data?.resolvedReports ?? 0} icon={CheckCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaints Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingReportsTable reports={data?.pendingReportsList ?? []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorDashboardPage;
