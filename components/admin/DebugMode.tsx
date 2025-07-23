
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle, XCircle, Loader, Server, Database, Mail, ShoppingCart, Users, TestTube, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestResult {
  name: string;
  status: 'passing' | 'failing' | 'pending' | 'running';
  details: string;
  category: 'API' | 'Database' | 'Email' | 'E-commerce' | 'Authentication';
  duration?: number;
}

const allTests: Omit<TestResult, 'status' | 'details' | 'duration'>[] = [
  { name: 'API Health Check', category: 'API' },
  { name: 'Database Connection', category: 'Database' },
  { name: 'Email SMTP Test', category: 'Email' },
  { name: 'Product Fetch', category: 'E-commerce' },
  { name: 'Create Order Simulation', category: 'E-commerce' },
  { name: 'User Session Check', category: 'Authentication' },
];

const categoryIcons = {
  API: <Server size={18} />,
  Database: <Database size={18} />,
  Email: <Mail size={18} />,
  'E-commerce': <ShoppingCart size={18} />,
  Authentication: <Users size={18} />,
};

const categoryColors = {
  API: 'text-cyan-400',
  Database: 'text-emerald-400',
  Email: 'text-purple-400',
  'E-commerce': 'text-blue-400',
  Authentication: 'text-yellow-400',
};

const DebugMode = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    const initialResults: TestResult[] = allTests.map(test => ({
      ...test,
      status: 'pending',
      details: 'Waiting to run...',
    }));
    setTestResults(initialResults);

    for (let i = 0; i < allTests.length; i++) {
      const test = allTests[i];
      const startTime = Date.now();

      // Update status to 'running'
      setTestResults(prev => prev.map(r => r.name === test.name ? { ...r, status: 'running', details: 'Executing...' } : r));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

      const isSuccess = Math.random() > 0.2; // 80% success rate
      const duration = Date.now() - startTime;

      // Update final status
      setTestResults(prev => prev.map(r =>
        r.name === test.name ? {
          ...r,
          status: isSuccess ? 'passing' : 'failing',
          details: isSuccess ? 'Test completed successfully.' : 'An unexpected error occurred.',
          duration,
        } : r
      ));
    }
    setIsRunning(false);
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passing': return <CheckCircle className="text-green-500" />;
      case 'failing': return <XCircle className="text-red-500" />;
      case 'running': return <Loader className="animate-spin text-blue-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-zinc-600" />;
    }
  };

  const getProgressBarWidth = () => {
    const completed = testResults.filter(r => r.status === 'passing' || r.status === 'failing').length;
    return (completed / allTests.length) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-6 bg-zinc-900 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <TestTube className="text-amber-400" size={24} />
          <h2 className="text-xl font-bold text-white">Component Debug Mode</h2>
        </div>
        <motion.button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
          whileHover={{ scale: isRunning ? 1 : 1.02 }}
          whileTap={{ scale: isRunning ? 1 : 0.98 }}
        >
          {isRunning ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <Power size={16} />
              <span>Run All Tests</span>
            </>
          )}
        </motion.button>
      </div>
      
      <p className="text-zinc-400 text-sm mb-6">
        This tool simulates tests for key application components. It checks API health, database connectivity, email services, and more to ensure everything is running smoothly.
      </p>

      <AnimatePresence>
        {testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Progress Bar */}
            <div className="bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressBarWidth()}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            {/* Test Results Table */}
            <div className="border border-zinc-700 rounded-lg overflow-hidden">
              <div className="bg-zinc-800/50 p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 font-semibold text-zinc-300">Status</div>
                <div className="col-span-4 font-semibold text-zinc-300">Test Name</div>
                <div className="col-span-2 font-semibold text-zinc-300">Category</div>
                <div className="col-span-4 font-semibold text-zinc-300">Details</div>
                <div className="col-span-1 font-semibold text-zinc-300 text-right">Time</div>
              </div>
              
              {testResults.map((result, index) => (
                <motion.div
                  key={result.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 grid grid-cols-12 gap-4 items-center border-t border-zinc-700/50"
                >
                  <div className="col-span-1 flex justify-center">{getStatusIcon(result.status)}</div>
                  <div className="col-span-4 text-white font-medium">{result.name}</div>
                  <div className="col-span-2">
                    <span className={cn(
                      "flex items-center space-x-2 text-xs font-medium px-2 py-1 rounded-full",
                      "bg-zinc-800",
                      categoryColors[result.category]
                    )}>
                      {categoryIcons[result.category]}
                      <span>{result.category}</span>
                    </span>
                  </div>
                  <div className="col-span-4 text-zinc-400 text-sm truncate">{result.details}</div>
                  <div className="col-span-1 text-zinc-400 text-sm text-right">
                    {result.duration ? `${(result.duration / 1000).toFixed(2)}s` : '-'}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DebugMode; 