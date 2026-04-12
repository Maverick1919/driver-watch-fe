import API from "@/lib/api";

export const login = (data: {
  identifier: string;
  password: string;
}) => API.post("/DriverRegistry/login", data);

export const logout = () =>
  API.post("/DriverRegistry/logout");

export const resetPassword = (data: {
  email: string;
}) => API.post("/DriverRegistry/reset-password", data);

export const createComplaint = (data: FormData) =>
  API.post("/DriverRegistry/Create-Complaint", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getAllComplaints = () =>
  API.get("/DriverRegistry/GetAllComplaints");

export const getComplaintsCount = () =>
  API.get("/DriverRegistry/GetComplaintsCount");

export const getAllReports = () =>
  API.get("/DriverRegistry/GetAllReports");

export const updateStatus = (data: {
  complaintId: number;
  status: string;
  reviewedBy: string;
  moderatorNotes: string;
}) => API.put("/DriverRegistry/update-status", data);
