import React, { useState, useEffect } from 'react';
import { sopAPI } from '../utils/api';

interface SOP {
  _id: string;
  title: string;
  version: string;
  department: string;
  fileUrl: string;
  uploadedBy: string;
  status: string;
}

const SOPPage: React.FC = () => {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSOPs = async () => {
      setLoading(true);
      try {
        const response = await sopAPI.getAllSOPs();
        setSOPs(response.data);
      } catch (error) {
        console.error('Error fetching SOPs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSOPs();
  }, []);

  return (
    <div>
      <h1>SOPs</h1>
      {loading ? (
        <p>Loading SOPs...</p>
      ) : (
        <ul>
          {sops.map(sop => (
            <li key={sop._id}>{sop.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SOPPage;
