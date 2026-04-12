import React, { useEffect, useState } from 'react';
import { getAllReports } from "@/api/driverRegistry";

const DriversList = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports()
      .then((res) => setDrivers(res.data)) 
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
  <ul>
    {drivers.map((driver) => (
      <li key={driver.reportId}>
        {driver.driverFirstName} {driver.driverLastName} - {driver.driverEmail}
      </li>
    ))}
  </ul>
);
};

export default DriversList;