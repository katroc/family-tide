import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, Clock, BarChart3, X } from 'lucide-react';
import { performanceCache } from '../services/performanceCache';

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PerformanceMetrics {
  cacheStats: any;
  cacheEntries: any[];
  queryTimes: { operation: string; time: number; timestamp: number }[];
  memoryUsage?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isOpen,
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Collect performance metrics
  const collectMetrics = () => {
    const cacheStats = performanceCache.getStats();
    const cacheEntries = performanceCache.debug();
    
    // Get query times from performance API if available
    const queryTimes: { operation: string; time: number; timestamp: number }[] = [];
    
    // Memory usage (rough estimate)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    setMetrics({
      cacheStats,
      cacheEntries,
      queryTimes,
      memoryUsage
    });
  };

  // Auto-refresh metrics
  useEffect(() => {
    if (isOpen) {
      collectMetrics();
      const interval = setInterval(collectMetrics, 2000); // Refresh every 2 seconds
      setRefreshInterval(interval as any);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isOpen]);

  // Clear cache
  const handleClearCache = () => {
    performanceCache.clear();
    collectMetrics();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Performance Monitor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {metrics ? (
            <div className="space-y-6">
              {/* Cache Statistics */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold text-blue-800">Cache Performance</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{metrics.cacheStats.hits}</div>
                    <div className="text-sm text-blue-700">Cache Hits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{metrics.cacheStats.misses}</div>
                    <div className="text-sm text-orange-700">Cache Misses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.cacheStats.hitRate}</div>
                    <div className="text-sm text-green-700">Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{metrics.cacheStats.size}</div>
                    <div className="text-sm text-purple-700">Cached Items</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Clear Cache
                  </button>
                  <button
                    onClick={collectMetrics}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Cache Entries */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="text-gray-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Cache Entries</h3>
                </div>
                
                {metrics.cacheEntries.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {metrics.cacheEntries.map((entry, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between text-sm">
                        <div className="flex-1 truncate">
                          <span className="font-medium text-gray-800">{entry.key}</span>
                        </div>
                        <div className="flex gap-4 text-gray-600">
                          <span>Age: {entry.age}s</span>
                          <span>TTL: {entry.ttl}s</span>
                          <span>Size: {entry.size}B</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No cache entries found
                  </div>
                )}
              </div>

              {/* Memory Usage */}
              {metrics.memoryUsage && (
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="text-green-600" size={20} />
                    <h3 className="text-lg font-semibold text-green-800">Memory Usage</h3>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <div className="text-sm text-green-700">JavaScript Heap Size</div>
                  </div>
                </div>
              )}

              {/* Performance Tips */}
              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="text-yellow-600" size={20} />
                  <h3 className="text-lg font-semibold text-yellow-800">Performance Tips</h3>
                </div>
                
                <div className="space-y-2 text-sm text-yellow-700">
                  <div className="flex items-start gap-2">
                    <span>•</span>
                    <span>Cache hit rate above 70% indicates good caching performance</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>•</span>
                    <span>High cache misses may indicate data is changing too frequently</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>•</span>
                    <span>Real-time updates automatically invalidate relevant cache entries</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>•</span>
                    <span>Memory usage under 50MB is optimal for mobile devices</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading performance metrics...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;