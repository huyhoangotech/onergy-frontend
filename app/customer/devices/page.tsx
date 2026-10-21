'use client';

import { Building2, ChevronDown, ChevronRight, Cpu, Gauge, LayoutGrid, LayoutList, MapPin, Network, Plug, Plus, RefreshCw, Search, Wifi, WifiOff, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
interface Device {
  id: string;
  name: string;
  type: string;
  path: string | null;
  status: 'Connected' | 'Disconnected';
}

interface TreeNode {
  id: string;
  name: string;
  nodeType: 'site' | 'station' | 'cluster' | 'device';
  children?: TreeNode[];
  device?: Device;
  level: number;
}

// Get root site name from path
const getRootSiteName = (path: string | null): string | null => {
  if (!path) return null;
  const parts = path.split(' > ');
  return parts[0];
};

// Get device icon
const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'Recloser':
    case 'Relay':
      return <Zap className="w-4 h-4" />;
    case 'Meter':
      return <Gauge className="w-4 h-4" />;
    case 'Transformer':
      return <Plug className="w-4 h-4" />;
    default:
      return <Cpu className="w-4 h-4" />;
  }
};

// Get node icon
const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case 'site':
      return <MapPin className="w-4 h-4" />;
    case 'station':
      return <Building2 className="w-4 h-4" />;
    case 'cluster':
      return <Network className="w-4 h-4" />;
    case 'device':
      return <Cpu className="w-4 h-4" />;
    default:
      return <Cpu className="w-4 h-4" />;
  }
};

// Tree Node Component
const TreeNodeComponent = ({
  node,
  isExpanded,
  onToggle,
  onSelectDevice,
  level = 0,
}: {
  node: TreeNode;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectDevice: (device: Device) => void;
  level?: number;
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isConnected = node.device?.status === 'Connected';

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            onToggle();
          } else if (node.device) {
            onSelectDevice(node.device);
          }
        }}
        className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
          node.nodeType === 'device'
            ? 'bg-gradient-to-r from-emerald-50 to-transparent'
            : 'bg-white'
        } ${
          node.nodeType === 'device' && !isConnected
            ? 'border-l-4 border-l-red-500'
            : node.nodeType === 'device'
            ? 'border-l-4 border-l-emerald-500'
            : ''
        }`}
        style={{ paddingLeft: `${16 + level * 24}px` }}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-5 flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-5 h-5 text-emerald-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-emerald-600" />
            )
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Node Type Icon */}
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
          {getNodeIcon(node.nodeType)}
        </div>

        {/* Node Name */}
        <span
          className={`flex-1 ${
            node.nodeType === 'site'
              ? 'font-bold text-base'
              : node.nodeType === 'station'
              ? 'font-semibold text-sm'
              : 'font-medium text-sm'
          } ${
            !isConnected && node.nodeType === 'device'
              ? 'text-red-500'
              : 'text-gray-900'
          }`}
        >
          {node.name}
        </span>

        {/* Status Badge for Devices */}
        {node.nodeType === 'device' && node.device && (
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            {node.device.status}
          </div>
        )}

        {/* Count Badge */}
        {hasChildren && (
          <div className="bg-emerald-100 px-2 py-1 rounded-full text-xs font-bold text-emerald-600">
            {node.children?.length}
          </div>
        )}
      </button>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              isExpanded={expandedNodes[child.id] !== false}
              onToggle={() => toggleNode(child.id)}
              onSelectDevice={onSelectDevice}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Device Row Component (List View)
const DeviceRow = ({ device }: { device: Device }) => {
  const isConnected = device.status === 'Connected';

  return (
    <div
      className={`flex items-center gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${
        isConnected ? 'bg-white' : 'bg-red-50'
      }`}
    >
      {/* Device Icon */}
      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
        {getDeviceIcon(device.type)}
      </div>

      {/* Device Name */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{device.name}</h3>
        <p className="text-sm text-gray-500 truncate">{device.path}</p>
      </div>

      {/* Type Badge */}
      <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 flex-shrink-0">
        {device.type}
      </div>

      {/* Status */}
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
          isConnected
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {isConnected ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {device.status}
      </div>
    </div>
  );
};

// Main Component
let expandedNodes: Record<string, boolean> = {};

const toggleNode = (nodeId: string) => {
  expandedNodes = {
    ...expandedNodes,
    [nodeId]: !expandedNodes[nodeId],
  };
};

export default function DeviceManagerPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodesState, setExpandedNodesState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Connected' | 'Disconnected' | null>(null);
  const [siteFilter, setSiteFilter] = useState<string | null>(null);
  const [sites, setSites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build tree structure
  const buildTreeStructure = (deviceList: Device[]): TreeNode[] => {
    const siteMap = new Map<string, TreeNode>();
    const stationMap = new Map<string, TreeNode>();
    const clusterMap = new Map<string, TreeNode>();

    deviceList.forEach((device) => {
      const pathParts = device.path ? device.path.split(' > ') : [];
      if (pathParts.length === 0) return;

      const rootSiteName = pathParts[0];
      const stationName = pathParts[1] || null;
      const clusterName = pathParts[2] || null;

      if (!siteMap.has(rootSiteName)) {
        siteMap.set(rootSiteName, {
          id: `site-${rootSiteName}`,
          name: rootSiteName,
          nodeType: 'site',
          children: [],
          level: 0,
        });
      }

      const siteNode = siteMap.get(rootSiteName)!;

      if (stationName) {
        const stationKey = `${rootSiteName}>${stationName}`;
        if (!stationMap.has(stationKey)) {
          const stationNode: TreeNode = {
            id: `station-${stationKey}`,
            name: stationName,
            nodeType: 'station',
            children: [],
            level: 1,
          };
          stationMap.set(stationKey, stationNode);
          siteNode.children?.push(stationNode);
        }

        const stationNode = stationMap.get(stationKey)!;

        if (clusterName) {
          const clusterKey = `${stationKey}>${clusterName}`;
          if (!clusterMap.has(clusterKey)) {
            const clusterNode: TreeNode = {
              id: `cluster-${clusterKey}`,
              name: clusterName,
              nodeType: 'cluster',
              children: [],
              level: 2,
            };
            clusterMap.set(clusterKey, clusterNode);
            stationNode.children?.push(clusterNode);
          }

          const clusterNode = clusterMap.get(clusterKey)!;
          clusterNode.children?.push({
            id: device.id,
            name: device.name,
            nodeType: 'device',
            device,
            level: 3,
          });
        } else {
          stationNode.children?.push({
            id: device.id,
            name: device.name,
            nodeType: 'device',
            device,
            level: 2,
          });
        }
      } else {
        siteNode.children?.push({
          id: device.id,
          name: device.name,
          nodeType: 'device',
          device,
          level: 1,
        });
      }
    });

    return Array.from(siteMap.values());
  };

  // Fetch devices
  const fetchDevices = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      // Get token from localStorage (or replace with your auth method)
      const token = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;

      const response = await fetch('http://localhost:5000/api/customer/all-devices-tree', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch devices');

      const data = await response.json();

      const mapped: Device[] = (data.devices || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type ?? 'Unknown',
        path: d.path || null,
        status: d.status === 1 ? 'Connected' : 'Disconnected',
      }));

      setDevices(mapped);

      const tree = buildTreeStructure(mapped);
      setTreeData(tree);

      const initialExpanded: Record<string, boolean> = {};
      tree.forEach((site) => {
        initialExpanded[site.id] = true;
      });
      setExpandedNodesState(initialExpanded);
      expandedNodes = initialExpanded;

      const uniqueRootSites = [
        ...new Set(
          mapped
            .map((d) => getRootSiteName(d.path))
            .filter((s): s is string => s !== null)
        ),
      ];
      setSites(uniqueRootSites);
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const keyword = debouncedSearch.toLowerCase();

    const matchesSearch =
      device.name.toLowerCase().includes(keyword) ||
      device.path?.toLowerCase().includes(keyword) ||
      device.type?.toLowerCase().includes(keyword);

    const matchesStatus = !statusFilter || device.status === statusFilter;

    const deviceRootSite = getRootSiteName(device.path);
    const matchesSite = !siteFilter || deviceRootSite === siteFilter;

    return matchesSearch && matchesStatus && matchesSite;
  });

  const connectedCount = filteredDevices.filter((d) => d.status === 'Connected').length;
  const disconnectedCount = filteredDevices.filter((d) => d.status === 'Disconnected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Device Manager</h1>
          <p className="text-emerald-100">Manage and monitor all your connected devices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-l-emerald-500">
          <p className="text-gray-600 text-sm font-medium">Total Devices</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{devices.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-l-emerald-500">
          <p className="text-gray-600 text-sm font-medium">Connected</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{connectedCount}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-l-red-500">
          <p className="text-gray-600 text-sm font-medium">Disconnected</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{disconnectedCount}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* View Mode Toggle & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                List View
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Tree View
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search devices, type, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchDevices(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === null
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('Connected')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'Connected'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Wifi className="w-3 h-3" />
                Connected
              </button>
              <button
                onClick={() => setStatusFilter('Disconnected')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'Disconnected'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <WifiOff className="w-3 h-3" />
                Disconnected
              </button>
            </div>

            {/* Site Filter */}
            {sites.length > 0 && (
              <select
                value={siteFilter || ''}
                onChange={(e) => setSiteFilter(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {viewMode === 'list' ? (
            // List View
            <div>
              {filteredDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Cpu className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">No devices found</p>
                  <p className="text-sm">Try adjusting your filters or search</p>
                </div>
              ) : (
                <div>
                  {filteredDevices.map((device) => (
                    <DeviceRow key={device.id} device={device} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Tree View
            <div>
              {siteFilter
                ? treeData
                    .filter((site) => site.name === siteFilter)
                    .map((site) => (
                      <TreeNodeComponent
                        key={site.id}
                        node={site}
                        isExpanded={expandedNodesState[site.id] !== false}
                        onToggle={() => {
                          toggleNode(site.id);
                          setExpandedNodesState((prev) => ({
                            ...prev,
                            [site.id]: !prev[site.id],
                          }));
                        }}
                        onSelectDevice={() => {}}
                      />
                    ))
                : treeData.map((site) => (
                    <TreeNodeComponent
                      key={site.id}
                      node={site}
                      isExpanded={expandedNodesState[site.id] !== false}
                      onToggle={() => {
                        toggleNode(site.id);
                        setExpandedNodesState((prev) => ({
                          ...prev,
                          [site.id]: !prev[site.id],
                        }));
                      }}
                      onSelectDevice={() => {}}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
