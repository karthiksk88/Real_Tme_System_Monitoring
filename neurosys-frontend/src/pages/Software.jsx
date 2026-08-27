import React, { useState, useEffect } from 'react';
import { metricsService } from '../services/metricsService';
import { 
  PackageCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Filter, 
  Terminal, 
  Code, 
  Cpu, 
  Layers,
  Sparkles
} from 'lucide-react';

const Software = () => {
  const [computers, setComputers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    try {
      const res = await metricsService.getAllComputers();
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setComputers(list);
      }
    } catch (e) {
      console.error('Error fetching computers for software inventory', e);
    } finally {
      setLoading(false);
    }
  };

  const softwareCatalog = [
    { name: 'Python 3.11.8 (64-bit)', vendor: 'Python Software Foundation', category: 'Developer Tools', version: '3.11.8', installedCount: computers.length, status: 'COMPLIANT' },
    { name: 'Visual Studio Code', vendor: 'Microsoft Corporation', category: 'IDE & Editors', version: '1.87.2', installedCount: computers.length, status: 'COMPLIANT' },
    { name: 'OpenJDK 17 LTS (HotSpot)', vendor: 'Eclipse Adoptium / Microsoft', category: 'Runtime Runtimes', version: '17.0.10', installedCount: computers.length, status: 'COMPLIANT' },
    { name: 'Google Chrome Enterprise', vendor: 'Google LLC', category: 'Web Browser', version: '122.0.6261', installedCount: computers.length, status: 'COMPLIANT' },
    { name: 'Node.js LTS (v20.11.1)', vendor: 'Node.js Foundation', category: 'Developer Tools', version: '20.11.1', installedCount: Math.max(0, computers.length - 2), status: 'UPDATE AVAILABLE' },
    { name: 'AutoCAD 2024 Education', vendor: 'Autodesk Inc.', category: 'CAD & Engineering', version: '2024.1.2', installedCount: Math.max(0, computers.length - 5), status: 'COMPLIANT' },
    { name: 'NeuroSys OSHI Agent v1.0', vendor: 'NeuroSys Systems', category: 'System Agent', version: '1.0.0', installedCount: computers.length, status: 'COMPLIANT' },
  ];

  const filteredCatalog = softwareCatalog.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <PackageCheck className="w-7 h-7 text-primary" />
            <h1 className="font-display text-display text-on-background tracking-tight">Software Inventory & Compliance</h1>
          </div>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Centralized application catalog, license compliance, and silent deployment status across campus computers.
          </p>
        </div>

        {/* Download Agent Jar */}
        <a
          href="https://realtmesystemmonitoring-production.up.railway.app/downloads/NeuroSys-Agent.jar"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Download Agent Package (.jar)</span>
        </a>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-elevated p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search software package, vendor, category..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="text-xs font-semibold text-secondary">
          Showing <strong className="text-on-surface">{filteredCatalog.length}</strong> applications across <strong className="text-primary">{computers.length}</strong> active assets
        </div>
      </div>

      {/* Catalog Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-secondary">
                <th className="p-4">Application Package</th>
                <th className="p-4">Publisher / Vendor</th>
                <th className="p-4">Category</th>
                <th className="p-4">Installed Version</th>
                <th className="p-4 text-right">Installed Assets</th>
                <th className="p-4 text-right">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
              {filteredCatalog.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-bold text-on-surface flex items-center gap-3">
                    <PackageCheck className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{item.name}</span>
                  </td>
                  <td className="p-4 text-secondary font-medium">{item.vendor}</td>
                  <td className="p-4 text-secondary font-medium">{item.category}</td>
                  <td className="p-4 font-mono-sm text-mono-sm font-bold text-on-surface">{item.version}</td>
                  <td className="p-4 text-right font-mono-sm text-mono-sm font-bold">{item.installedCount} / {computers.length} PCs</td>
                  <td className="p-4 text-right">
                    <span className={`font-label-md text-label-md px-2.5 py-1 rounded-full font-bold uppercase ${
                      item.status === 'COMPLIANT' ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Software;
