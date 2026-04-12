
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllComplaints, updateStatus } from '@/api/driverRegistry';
import { extractComplaintsFromResponse } from '@/lib/reportMappers';
import { useUserRole } from '@/hooks/useUserRole';

const fetchReportDetails = async (reportId: string) => {
  const response = await getAllComplaints();
  return extractComplaintsFromResponse(response.data).find((report) => report.id === reportId) || null;
};

const ReportReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUserRole();

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn: () => fetchReportDetails(id!),
    enabled: !!id,
  });

  const updateReportMutation = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      await updateStatus({
        complaintId: Number(id),
        status,
        reviewedBy: user?.email || 'moderator@truckerwatch.com',
        moderatorNotes: '',
      });
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['moderatorDashboard'] });
      toast({
        title: "Complaint Updated",
        description: `Complaint has been ${status}.`,
      });
      navigate('/moderator-dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update report: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        Failed to load report details.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/moderator-dashboard')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Review Report</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Report ID</label>
              <p className="font-mono text-xs">{report.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={report.status === 'Pending' ? 'secondary' : 'default'}>
                  {report.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Incident Type</label>
              <p>{report.incident_type.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <p>{report.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date Occurred</label>
              <p>{new Date(report.date_occurred).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
              <p>{report.company_name_making_report}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Driver Name</label>
              <p>{`${report.driver_first_name || ''} ${report.driver_last_name || ''}`.trim() || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CDL Number</label>
              <p>{report.cdl_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Driver Email</label>
              <p>{report.driver_email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Driver Phone</label>
              <p>{report.driver_phone || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Incident Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{report.description}</p>
          </CardContent>
        </Card>

        {report.status === 'Pending' && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => updateReportMutation.mutate('approved')}
                  disabled={updateReportMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Publish
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateReportMutation.mutate('rejected')}
                  disabled={updateReportMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Complaint
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportReviewPage;
