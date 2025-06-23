import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, TrendingUp,
  Calendar, AlertCircle, CheckCircle, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { certificateAPI } from '../utils/api';
import Modal from '../components/common/Modal';
import Slider from 'react-slick';
import clsx from 'clsx';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isGMPCompliant, setIsGMPCompliant] = useState<boolean | null>(null);
  const [renewalAlerts, setRenewalAlerts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [currentCerts, setCurrentCerts] = useState<any[]>([]);
  const [expiredCerts, setExpiredCerts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<'current' | 'expired' | null>(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gmp, renewal, all] = await Promise.all([
          certificateAPI.checkGMP(),
          certificateAPI.getRenewalAlerts(),
          certificateAPI.getAll()
        ]);

        setIsGMPCompliant(gmp.data.isCompliant);
        setRenewalAlerts(renewal.data.renewalAlerts || []);
        setCertificates(all.data.certificates || []);

        const now = new Date();
        const current = all.data.certificates.filter((cert: any) =>
          new Date(cert.expiryDate) >= now
        );
        const expired = all.data.certificates.filter((cert: any) =>
          new Date(cert.expiryDate) < now
        );
        setCurrentCerts(current);
        setExpiredCerts(expired);
      } catch (error) {
        console.error('❌ Error loading dashboard data', error);
      }
    };

    fetchData();
  }, []);

  const upcomingAudits = [
    { title: 'Annual GMP Audit', date: '2024-04-15', type: 'External', auditor: 'FDA India' },
    { title: 'Quality Management System Review', date: '2024-04-20', type: 'Internal', auditor: 'QA Team' },
    { title: 'Environmental Monitoring', date: '2024-04-25', type: 'Internal', auditor: 'EHS Team' }
  ];

  const capaStatus = [
    { title: 'HVAC System Validation', progress: 75 },
    { title: 'Raw Material Storage Compliance', progress: 60 },
    { title: 'Personnel Training Documentation', progress: 90 }
  ];

  const recentDocs = [
    { title: 'SOP-QA-001: Quality Manual', type: 'SOP', date: '2024-03-10' },
    { title: 'ISO 9001:2015 Certificate', type: 'Certificate', date: '2024-03-08' },
    { title: 'Batch Production Record Template', type: 'Template', date: '2024-03-05' }
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-[#d19000] to-[#ffd700] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{greeting()}, {user?.designation} {user?.name}</h1>
        <p className="opacity-90">Here's your compliance overview for Naxcuure</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* GMP */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">GMP Status</p>
              <p className={clsx("text-2xl font-bold", {
                'text-green-500': isGMPCompliant,
                'text-red-500': isGMPCompliant === false
              })}>
                {isGMPCompliant === null ? 'Loading...' : isGMPCompliant ? 'Compliant' : 'Non-Compliant'}
              </p>
            </div>
            {isGMPCompliant === null ? (
              <div className="animate-pulse w-8 h-8 rounded-full bg-gray-300" />
            ) : isGMPCompliant ? (
              <CheckCircle2 className="text-green-500" size={32} />
            ) : (
              <XCircle className="text-red-500" size={32} />
            )}
          </div>
        </div>

        {/* Current Certificates */}
        <div className="bg-white rounded-xl p-6 shadow-sm cursor-pointer" onClick={() => setShowModal('current')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Current Certificates</p>
              <p className="text-2xl font-bold text-[#228b22]">{currentCerts.length}</p>
            </div>
            <Clock className="text-[#228b22]" size={32} />
          </div>
        </div>

        {/* Expired Certificates */}
        <div className="bg-white rounded-xl p-6 shadow-sm cursor-pointer" onClick={() => setShowModal('expired')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Expired Certificates</p>
              <p className="text-2xl font-bold text-red-500">{expiredCerts.length}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>

        {/* Compliance Score (Dummy) */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Compliance Score</p>
              <p className="text-2xl font-bold text-[#d19000]">92%</p>
            </div>
            <TrendingUp className="text-[#d19000]" size={32} />
          </div>
        </div>
      </div>

      {/* Audit, Renewal Alerts, CAPA, Docs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Audits */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 text-[#d19000]" size={20} /> Upcoming Audits
          </h2>
          <div className="space-y-4">
            {upcomingAudits.map((audit, i) => (
              <div key={i} className="border-b pb-3 last:border-0">
                <h3 className="font-medium">{audit.title}</h3>
                <p className="text-sm text-gray-500">{audit.date} • {audit.type} • {audit.auditor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Renewal Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="mr-2 text-[#d19000]" size={20} /> Renewal Alerts
          </h2>
          {renewalAlerts.length <= 3 ? (
            <div className="space-y-4">
              {renewalAlerts.map((alert, i) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <h3 className="font-medium">{alert.title}</h3>
                  <div className="flex items-center mt-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className={clsx("h-2 rounded-full", {
                          'bg-red-500': alert.daysLeft < 60,
                          'bg-yellow-500': alert.daysLeft < 120,
                          'bg-green-500': alert.daysLeft >= 120
                        })}
                        style={{ width: `${(alert.daysLeft / 180) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm text-gray-500">{alert.daysLeft} days</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1} arrows>
              {renewalAlerts.map((alert, i) => (
                <div key={i} className="px-2">
                  <h3 className="font-medium">{alert.title}</h3>
                  <div className="flex items-center mt-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className={clsx("h-2 rounded-full", {
                          'bg-red-500': alert.daysLeft < 60,
                          'bg-yellow-500': alert.daysLeft < 120,
                          'bg-green-500': alert.daysLeft >= 120
                        })}
                        style={{ width: `${(alert.daysLeft / 180) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm text-gray-500">{alert.daysLeft} days</span>
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>

        {/* CAPA */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="mr-2 text-[#d19000]" size={20} /> CAPA Status
          </h2>
          <div className="space-y-4">
            {capaStatus.map((capa, index) => (
              <div key={index} className="border-b pb-3 last:border-0">
                <div className="flex justify-between mb-1">
                  <h3 className="font-medium">{capa.title}</h3>
                  <span className="text-sm text-gray-500">{capa.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-[#d19000] rounded-full"
                    style={{ width: `${capa.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl p-6 shadow-sm md:col-span-2 lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="mr-2 text-[#d19000]" size={20} /> Recently Viewed Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentDocs.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium">{doc.title}</h3>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>{doc.type}</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Certificate Lists */}
      {showModal && (
        <Modal onClose={() => setShowModal(null)}>
          <h2 className="text-xl font-semibold mb-4">
            {showModal === 'current' ? 'Current Certificates' : 'Expired Certificates'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Certificate</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Issued By</th>
                  <th className="p-2 border">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {(showModal === 'current' ? currentCerts : expiredCerts).map((cert, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2 border">{cert.certificateName}</td>
                    <td className="p-2 border">{cert.department}</td>
                    <td className="p-2 border">{cert.issuingAuthority}</td>
                    <td className="p-2 border">{new Date(cert.expiryDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DirectorDashboard;
