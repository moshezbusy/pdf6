import React from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, BarChart2 } from 'lucide-react';

export default function Dashboard({ onCreate }: { onCreate?: (id: string) => void }) {
  // Mock stats
  const stats = [
    { label: 'PDFs Created', value: 128, icon: <FilePlus className="h-6 w-6 text-blue-600" /> },
    { label: 'API Calls', value: 452, icon: <BarChart2 className="h-6 w-6 text-green-600" /> },
  ];

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/templates/create', { method: 'POST' });
      const data = await res.json();
      if (data?.success && data.template?.id) {
        onCreate?.(data.template.id);
      } else {
        onCreate?.('new');
      }
    } catch {
      onCreate?.('new');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6 flex items-center gap-4 min-w-[220px]">
            {stat.icon}
            <div>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
      <Button size="lg" className="text-lg px-8 py-4" onClick={handleCreate}>
        <FilePlus className="h-5 w-5 mr-2" />
        Create New PDF
      </Button>
    </div>
  );
} 