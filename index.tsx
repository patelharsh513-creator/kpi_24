import React from 'react';
import { CreditCard, Users, Zap, CheckCircle } from 'lucide-react';

// Mock Data for the Dashboard
const kpiData = [
  { icon: CreditCard, title: 'Total Revenue', value: '$12,456', change: '+12%', color: 'text-green-500' },
  { icon: Users, title: 'New Users', value: '1,234', change: '+5%', color: 'text-yellow-500' },
  { icon: Zap, title: 'Avg. Session Time', value: '3m 45s', change: '-2%', color: 'text-red-500' },
  { icon: CheckCircle, title: 'Conversion Rate', value: '2.4%', change: '+0.5%', color: 'text-blue-500' },
];

const KPICard = ({ icon: Icon, title, value, change, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-0.5">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
      <Icon className="w-6 h-6 text-indigo-400" />
    </div>
    <p className="mt-4 text-4xl font-extrabold text-gray-900">{value}</p>
    <div className="mt-2 text-sm font-semibold">
      <span className={`${color} inline-flex items-center`}>{change}</span>
      <span className="text-gray-500 ml-1">vs last month</span>
    </div>
  </div>
);

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">BellaBona KPI Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time metrics for Q3 performance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      <div className="mt-10 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Deployment Status Note</h2>
        <p className="text-gray-600">
          This content is now running successfully in the preview environment. The next steps are crucial for resolving your **GitHub Pages deployment issue** (the MIME type error). This requires correctly configuring the **Vite build process** and ensuring you deploy only the **`dist` folder**.
        </p>
      </div>
    </div>
  );
};

export default App;
