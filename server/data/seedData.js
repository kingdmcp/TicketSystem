const store = require('./store');

function seedDatabase() {
  const usersColl = store.collection('users');
  if (usersColl.count() > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial ITSM & ITAM CMDB dataset...');

  // 1. Users
  const users = [
    {
      _id: 'usr_vishan',
      name: 'Vishan Fernando',
      email: 'vishan@enterprise.local',
      role: 'itsm_lead',
      roleLabel: 'Project Manager & ITSM Lead',
      department: 'IT Service Management',
      networkId: 'NET_VISHAN_01',
      systemId: 'SYS-ITSM-001',
      groups: ['IT-Admins', 'ServiceDesk-L3', 'Change-Advisory-Board', 'Global-Staff'],
      managerName: 'CIO Office',
      status: 'Active'
    },
    {
      _id: 'usr_harindy',
      name: 'Harindy Jayasuriya',
      email: 'harindy@enterprise.local',
      role: 'itam_lead',
      roleLabel: 'ITAM & CMDB Lead',
      department: 'Asset & Configuration Management',
      networkId: 'NET_HARINDY_02',
      systemId: 'SYS-ITAM-002',
      groups: ['IT-Admins', 'Asset-Managers', 'Procurement-Auditors', 'Global-Staff'],
      managerName: 'Vishan Fernando',
      status: 'Active'
    },
    {
      _id: 'usr_pabodha',
      name: 'Pabodha Senaratne',
      email: 'pabodha@enterprise.local',
      role: 'discovery_lead',
      roleLabel: 'Discovery & Integration Lead',
      department: 'Network Operations & Spatial Discovery',
      networkId: 'NET_PABODHA_03',
      systemId: 'SYS-NET-003',
      groups: ['Network-Engineers', 'Zabbix-Ops', 'NetBox-Admins', 'Global-Staff'],
      managerName: 'Vishan Fernando',
      status: 'Active'
    },
    {
      _id: 'usr_malmika',
      name: 'Malmika Wickramasinghe',
      email: 'malmika@enterprise.local',
      role: 'security_lead',
      roleLabel: 'Analytics & Security Lead',
      department: 'Information Security & Compliance',
      networkId: 'NET_MALMIKA_04',
      systemId: 'SYS-SEC-004',
      groups: ['SecOps-Core', 'Compliance-Auditors', 'SOC-L3', 'Global-Staff'],
      managerName: 'Vishan Fernando',
      status: 'Active'
    },
    {
      _id: 'usr_sarah',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@enterprise.local',
      role: 'hr',
      roleLabel: 'HR Talent & Onboarding Specialist',
      department: 'Human Resources',
      networkId: 'NET_SARAH_05',
      systemId: 'SYS-HR-005',
      groups: ['HR-Core', 'PeopleOps', 'Global-Staff'],
      managerName: 'HR Director',
      status: 'Active'
    },
    {
      _id: 'usr_david',
      name: 'David Miller',
      email: 'david.miller@enterprise.local',
      role: 'manager',
      roleLabel: 'Engineering Department Manager',
      department: 'Software Engineering',
      networkId: 'NET_DAVID_06',
      systemId: 'SYS-MGR-006',
      groups: ['Engineering-Leads', 'Procurement-Approvers', 'Global-Staff'],
      managerName: 'VP Engineering',
      status: 'Active'
    },
    {
      _id: 'usr_alex',
      name: 'Alex Wong',
      email: 'alex.wong@enterprise.local',
      role: 'employee',
      roleLabel: 'Senior Backend Engineer',
      department: 'Software Engineering',
      networkId: 'NET_ALEX_07',
      systemId: 'SYS-DEV-007',
      groups: ['Engineering-Dev', 'GitHub-Committers', 'Global-Staff'],
      managerName: 'David Miller',
      status: 'Active'
    },
    {
      _id: 'usr_priya',
      name: 'Priya Sharma',
      email: 'priya.sharma@enterprise.local',
      role: 'finance',
      roleLabel: 'Finance & Accounts Controller',
      department: 'Finance & Accounting',
      networkId: 'NET_PRIYA_08',
      systemId: 'SYS-FIN-008',
      groups: ['Finance-Approvers', 'SAP-Treasury', 'Global-Staff'],
      managerName: 'CFO Office',
      status: 'Active'
    },
    {
      _id: 'usr_marcus',
      name: 'Marcus Thorne',
      email: 'marcus.thorne@enterprise.local',
      role: 'employee',
      roleLabel: 'DevOps Systems Engineer',
      department: 'Infrastructure',
      networkId: 'NET_MARCUS_09',
      systemId: 'SYS-OPS-009',
      groups: ['Cloud-Ops', 'Kubernetes-Admins', 'Global-Staff'],
      managerName: 'David Miller',
      status: 'Pending Offboarding'
    }
  ];
  users.forEach(u => usersColl.insert(u));

  // 2. Hardware Assets (CMDB)
  const assetsColl = store.collection('assets');
  const assets = [
    {
      _id: 'ast_001',
      assetTag: 'ASSET-SRV-CORE-01',
      name: 'Core Production DB Server R750',
      category: 'Server',
      model: 'Dell PowerEdge R750 (2x Xeon Gold, 256GB RAM, 8TB NVMe)',
      serialNumber: 'DL-750-SN-8841',
      ipAddress: '10.0.1.10',
      macAddress: '00:1A:2B:3C:4D:10',
      switchPort: 'Gi1/0/10',
      vlan: 10,
      room: 'Data Center / Server Room A',
      rack: 'Rack A1 (U14-U16)',
      status: 'In Use',
      health: 'Online',
      pingLatency: 1.2,
      assignedTo: 'usr_pabodha',
      purchaseDate: '2024-03-15',
      warrantyExpiry: '2027-03-15',
      cost: 14500,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_002',
      assetTag: 'ASSET-SW-CORE-01',
      name: 'Core Distribution Switch 48P',
      category: 'Switch',
      model: 'Cisco Catalyst 9300-48UXM PoE+',
      serialNumber: 'CS-9300-8820',
      ipAddress: '10.0.1.1',
      macAddress: '00:1A:2B:3C:4D:01',
      switchPort: 'Uplink Te1/1/1',
      vlan: 1,
      room: 'Data Center / Server Room A',
      rack: 'Rack A1 (U20)',
      status: 'In Use',
      health: 'Online',
      pingLatency: 0.8,
      assignedTo: 'usr_pabodha',
      purchaseDate: '2023-11-01',
      warrantyExpiry: '2028-11-01',
      cost: 8200,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_003',
      assetTag: 'ASSET-SW-EDGE-02',
      name: 'Engineering Edge Switch 24P',
      category: 'Switch',
      model: 'Aruba 2930F 24G PoE+',
      serialNumber: 'AR-2930-4491',
      ipAddress: '10.0.1.2',
      macAddress: '00:1A:2B:3C:4D:02',
      switchPort: 'Trunk Gi1/1',
      vlan: 20,
      room: 'Switch Closet B (East Wing)',
      rack: 'Rack B2 (U10)',
      status: 'In Use',
      health: 'Online',
      pingLatency: 1.4,
      assignedTo: 'usr_pabodha',
      purchaseDate: '2024-01-20',
      warrantyExpiry: '2027-01-20',
      cost: 3400,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_004',
      assetTag: 'ASSET-AP-BAY-01',
      name: 'Wi-Fi 6 AP - Engineering Bay A',
      category: 'Access Point',
      model: 'Ubiquiti UniFi U6-Pro',
      serialNumber: 'UB-U6P-9912',
      ipAddress: '10.0.2.20',
      macAddress: '00:1A:2B:3C:4D:20',
      switchPort: 'Gi1/0/20',
      vlan: 30,
      room: 'Engineering Bay A',
      rack: 'Ceiling Mount Zone A',
      status: 'In Use',
      health: 'Online',
      pingLatency: 2.1,
      assignedTo: 'usr_pabodha',
      purchaseDate: '2024-05-10',
      warrantyExpiry: '2026-05-10',
      cost: 299,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_005',
      assetTag: 'ASSET-AP-BAY-02',
      name: 'Wi-Fi 6 AP - Engineering Bay B',
      category: 'Access Point',
      model: 'Ubiquiti UniFi U6-Pro',
      serialNumber: 'UB-U6P-9913',
      ipAddress: '10.0.2.21',
      macAddress: '00:1A:2B:3C:4D:21',
      switchPort: 'Gi1/0/21',
      vlan: 30,
      room: 'Engineering Bay B',
      rack: 'Ceiling Mount Zone B',
      status: 'In Use',
      health: 'Degraded',
      pingLatency: 124.5,
      assignedTo: 'usr_pabodha',
      purchaseDate: '2024-05-10',
      warrantyExpiry: '2026-05-10',
      cost: 299,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_006',
      assetTag: 'ASSET-WS-ENG-01',
      name: 'Dev Workstation WS-ENG-01',
      category: 'Workstation',
      model: 'Dell Precision 5820 Tower (i9, 64GB, RTX 4070)',
      serialNumber: 'DL-PREC-3301',
      ipAddress: '10.0.2.101',
      macAddress: '00:1A:2B:3C:4D:77',
      switchPort: 'Gi1/0/3',
      vlan: 20,
      room: 'Engineering Bay A - Desk 12',
      rack: 'Desk Mount',
      status: 'In Use',
      health: 'Online',
      pingLatency: 3.2,
      assignedTo: 'usr_alex',
      purchaseDate: '2024-02-15',
      warrantyExpiry: '2027-02-15',
      cost: 2850,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_007',
      assetTag: 'ASSET-LP-DEV-09',
      name: 'MacBook Pro 16" M3 Max (Marcus)',
      category: 'Laptop',
      model: 'Apple MacBook Pro 16" (M3 Max, 36GB, 1TB)',
      serialNumber: 'C02G9988MD6',
      ipAddress: '10.0.2.190',
      macAddress: '00:1A:2B:3C:4D:99',
      switchPort: 'Wi-Fi AP-01',
      vlan: 30,
      room: 'Engineering Bay B - Desk 04',
      rack: 'Mobile',
      status: 'In Use',
      health: 'Online',
      pingLatency: 4.8,
      assignedTo: 'usr_marcus',
      purchaseDate: '2024-01-10',
      warrantyExpiry: '2027-01-10',
      cost: 3499,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_008',
      assetTag: 'ASSET-LP-HR-05',
      name: 'Lenovo ThinkPad P16s (Sarah)',
      category: 'Laptop',
      model: 'Lenovo ThinkPad P16s Gen 2 (Ryzen 7 PRO, 32GB)',
      serialNumber: 'PF-3991-LNV',
      ipAddress: '10.0.2.144',
      macAddress: '00:1A:2B:3C:4D:44',
      switchPort: 'Gi1/0/8',
      vlan: 40,
      room: 'HR & PeopleOps Suite - Desk 02',
      rack: 'Docking Station',
      status: 'In Use',
      health: 'Online',
      pingLatency: 2.8,
      assignedTo: 'usr_sarah',
      purchaseDate: '2023-09-12',
      warrantyExpiry: '2026-09-12',
      cost: 1650,
      lastDiscovered: new Date().toISOString()
    },
    {
      _id: 'ast_009',
      assetTag: 'ASSET-LP-SPARE-02',
      name: 'Inventory Reserve Dell Latitude 5540',
      category: 'Laptop',
      model: 'Dell Latitude 5540 (i7-1365U, 16GB, 512GB SSD)',
      serialNumber: 'DL-LAT-5540-02',
      ipAddress: 'Unassigned',
      macAddress: '00:1A:2B:3C:4D:EE',
      switchPort: 'None',
      vlan: 1,
      room: 'IT Secure Storage Cage 1',
      rack: 'Shelf C',
      status: 'Planned',
      health: 'Offline',
      pingLatency: 0,
      assignedTo: null,
      purchaseDate: '2025-01-10',
      warrantyExpiry: '2028-01-10',
      cost: 1200,
      lastDiscovered: new Date().toISOString()
    }
  ];
  assets.forEach(a => assetsColl.insert(a));

  // 3. Software Licenses (ITAM)
  const licensesColl = store.collection('licenses');
  const licenses = [
    {
      _id: 'lic_001',
      name: 'Microsoft 365 E5 Enterprise',
      vendor: 'Microsoft Corp.',
      licenseKey: 'MS-E5-ENTERPRISE-8829-XXXX-YYYY',
      totalSeats: 50,
      allocatedSeats: 42,
      costPerYear: 22800,
      renewalDate: '2027-01-15',
      status: 'Active',
      assignedUsers: [
        { userId: 'usr_vishan', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_harindy', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_pabodha', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_malmika', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_sarah', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_david', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_alex', assignedDate: '2024-01-01', pendingRevocation: false },
        { userId: 'usr_marcus', assignedDate: '2024-01-01', pendingRevocation: true, revokeDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() }
      ]
    },
    {
      _id: 'lic_002',
      name: 'JetBrains All Products Pack',
      vendor: 'JetBrains s.r.o.',
      licenseKey: 'JB-ALL-PROD-2026-TOKEN-994',
      totalSeats: 25,
      allocatedSeats: 21,
      costPerYear: 12250,
      renewalDate: '2026-11-20',
      status: 'Expiring Soon',
      assignedUsers: [
        { userId: 'usr_alex', assignedDate: '2024-02-15', pendingRevocation: false },
        { userId: 'usr_marcus', assignedDate: '2024-02-15', pendingRevocation: true, revokeDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() }
      ]
    },
    {
      _id: 'lic_003',
      name: 'Datadog Cloud APM & Infra Pro',
      vendor: 'Datadog Inc.',
      licenseKey: 'DD-API-KEY-INFRA-8302194',
      totalSeats: 30,
      allocatedSeats: 24,
      costPerYear: 28800,
      renewalDate: '2026-12-31',
      status: 'Active',
      assignedUsers: [
        { userId: 'usr_pabodha', assignedDate: '2024-01-10', pendingRevocation: false },
        { userId: 'usr_marcus', assignedDate: '2024-01-10', pendingRevocation: true, revokeDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() }
      ]
    },
    {
      _id: 'lic_004',
      name: 'Adobe Creative Cloud All Apps',
      vendor: 'Adobe Systems',
      licenseKey: 'ADOBE-CC-ENTERPRISE-552',
      totalSeats: 10,
      allocatedSeats: 8,
      costPerYear: 8990,
      renewalDate: '2026-12-05',
      status: 'Active',
      assignedUsers: [
        { userId: 'usr_sarah', assignedDate: '2024-03-01', pendingRevocation: false }
      ]
    }
  ];
  licenses.forEach(l => licensesColl.insert(l));

  // 4. Tickets (ITSM Lead Vishan)
  const ticketsColl = store.collection('tickets');
  const tickets = [
    {
      _id: 'tkt_001',
      ticketNumber: 'INC-2026-001',
      title: 'Core Production DB High Latency & Slow Query Lockup',
      description: 'The production PostgreSQL database cluster is responding with 800ms query latency during batch processing. Connection pool is nearing 95% saturation.',
      category: 'Database / Infrastructure',
      impact: 'High',
      urgency: 'High',
      priority: 'P1-Critical',
      status: 'In Progress',
      createdBy: 'usr_alex',
      createdByName: 'Alex Wong',
      assignedTo: 'usr_vishan',
      assignedToName: 'Vishan Fernando',
      linkedAsset: 'ast_001',
      linkedAssetName: 'Core Production DB Server R750',
      responseDue: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      resolutionDue: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      slaResponseBreached: false,
      slaResolutionBreached: false,
      resolutionNotes: 'Identified unindexed aggregate queries from the analytics sync job. Applying partial index patch and tuning autovacuum worker limits.',
      closurePrompt: {
        sent: false,
        status: 'Pending',
        autoCloseDue: null
      },
      kbArticleCreated: false,
      comments: [
        {
          author: 'Vishan Fernando',
          role: 'itsm_lead',
          text: 'P1 incident acknowledged within 8 minutes. Assigned to DB engineering triage team.',
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      _id: 'tkt_002',
      ticketNumber: 'INC-2026-002',
      title: 'Intermittent Wi-Fi Disconnections in Engineering Bay B',
      description: 'Laptops in Bay B drop off the 5GHz SSID every 15-20 minutes. Signal RSSI jumps between -65dBm and -88dBm.',
      category: 'Network & Wireless',
      impact: 'Medium',
      urgency: 'High',
      priority: 'P2-High',
      status: 'Assigned',
      createdBy: 'usr_marcus',
      createdByName: 'Marcus Thorne',
      assignedTo: 'usr_pabodha',
      assignedToName: 'Pabodha Senaratne',
      linkedAsset: 'ast_005',
      linkedAssetName: 'Wi-Fi 6 AP - Engineering Bay B',
      responseDue: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      resolutionDue: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      slaResponseBreached: false,
      slaResolutionBreached: false,
      resolutionNotes: '',
      closurePrompt: { sent: false, status: 'Pending', autoCloseDue: null },
      kbArticleCreated: false,
      comments: [
        {
          author: 'Pabodha Senaratne',
          role: 'discovery_lead',
          text: 'Investigating channel congestion on 5GHz Ch 44. AP telemetry indicates high packet retries.',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      _id: 'tkt_003',
      ticketNumber: 'INC-2026-003',
      title: 'Docker daemon permission denied on workstation WS-ENG-01',
      description: 'Running docker ps returns "Got permission denied while trying to connect to the Docker daemon socket". User added to docker group but session not refreshed.',
      category: 'Workstation / Software',
      impact: 'Low',
      urgency: 'Medium',
      priority: 'P3-Medium',
      status: 'Resolved',
      createdBy: 'usr_alex',
      createdByName: 'Alex Wong',
      assignedTo: 'usr_vishan',
      assignedToName: 'Vishan Fernando',
      linkedAsset: 'ast_006',
      linkedAssetName: 'Dev Workstation WS-ENG-01',
      responseDue: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      resolutionDue: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      slaResponseBreached: false,
      slaResolutionBreached: false,
      resolutionNotes: 'Ran newgrp docker and restarted systemd-logind service. Docker CLI execution verified successfully.',
      closurePrompt: {
        sent: true,
        status: 'Pending',
        autoCloseDue: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString() // 4 hours auto-close window
      },
      kbArticleCreated: true,
      comments: [
        {
          author: 'Vishan Fernando',
          role: 'itsm_lead',
          text: 'Fix verified with developer. Requested user confirmation to close ticket.',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      _id: 'tkt_004',
      ticketNumber: 'INC-2026-004',
      title: 'Request dual external 4K monitors configuration for Finance audit',
      description: 'DisplayPort daisy chaining is not detecting the second display on ThinkPad dock in Finance Room 3.',
      category: 'Hardware / Peripherals',
      impact: 'Low',
      urgency: 'Low',
      priority: 'P4-Low',
      status: 'Open',
      createdBy: 'usr_priya',
      createdByName: 'Priya Sharma',
      assignedTo: null,
      assignedToName: 'Unassigned',
      linkedAsset: 'ast_008',
      linkedAssetName: 'Lenovo ThinkPad P16s (Sarah)',
      responseDue: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      resolutionDue: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
      slaResponseBreached: false,
      slaResolutionBreached: false,
      resolutionNotes: '',
      closurePrompt: { sent: false, status: 'Pending', autoCloseDue: null },
      kbArticleCreated: false,
      comments: []
    }
  ];
  tickets.forEach(t => ticketsColl.insert(t));

  // 5. Knowledge Base
  const kbColl = store.collection('knowledgeBases');
  const articles = [
    {
      _id: 'kb_001',
      title: 'How to Resolve "Docker daemon permission denied" on Dev Workstations',
      category: 'Workstation / Software',
      tags: ['docker', 'linux', 'permissions', 'engineering'],
      problemDescription: 'Developers encounter "permission denied while trying to connect to the Docker daemon socket" after fresh OS or user provisioning.',
      solutionSteps: [
        'Verify if user is present in docker group: `groups $USER`',
        'Add user if missing: `sudo usermod -aG docker $USER`',
        'Apply changes immediately without reboot: `newgrp docker`',
        'Ensure /var/run/docker.sock socket permissions are srw-rw---- root:docker'
      ],
      viewCount: 142,
      helpfulVotes: 38,
      author: 'Vishan Fernando'
    },
    {
      _id: 'kb_002',
      title: 'Cisco AnyConnect Corporate VPN Client Setup & 2FA Token Guide',
      category: 'Network & Wireless',
      tags: ['vpn', 'remote', 'cisco', 'security'],
      problemDescription: 'Connecting to the corporate internal network securely from home or while traveling.',
      solutionSteps: [
        'Download Cisco AnyConnect Secure Mobility Client v4.10 from internal portal',
        'Enter gateway host: vpn.enterprise.local',
        'Authenticate using your Network ID credentials (NET_xxxx)',
        'Approve Microsoft Authenticator number matching prompt within 60 seconds'
      ],
      viewCount: 489,
      helpfulVotes: 120,
      author: 'Pabodha Senaratne'
    },
    {
      _id: 'kb_003',
      title: 'Optimizing Wi-Fi 6 Roaming & Frequency Band Steering',
      category: 'Network & Wireless',
      tags: ['wifi', 'unifi', 'network', 'roaming'],
      problemDescription: 'Laptops sticking to weak 2.4GHz signals when moving between office bays.',
      solutionSteps: [
        'Ensure 802.11r (Fast BSS Transition) is enabled on SSIDs',
        'Set 5GHz channel width to VHT80 and Minimum RSSI threshold to -72dBm',
        'Verify AP power balance: 2.4GHz at Medium (14dBm), 5GHz at High (20dBm)'
      ],
      viewCount: 76,
      helpfulVotes: 19,
      author: 'Pabodha Senaratne'
    }
  ];
  articles.forEach(a => kbColl.insert(a));

  // 6. Onboardings (Workflow 3.1)
  const onbColl = store.collection('onboardings');
  const onboardings = [
    {
      _id: 'onb_001',
      onboardingId: 'ONB-2026-001',
      employeeName: 'Emily Vance',
      personalEmail: 'emily.vance@gmail.com',
      department: 'Software Engineering',
      designation: 'Frontend Engineer',
      managerName: 'David Miller',
      startDate: '2026-11-01',
      step: 'EMPLOYEE_INPUT', // HR_DRAFT -> EMPLOYEE_INPUT -> HR_VERIFIED -> IT_PROVISIONED
      employeeDetails: {
        phone: '+1 (555) 234-5678',
        address: '142 Market St, Suite 400',
        emergencyContact: 'Mark Vance (+1 555-987-6543)',
        preferredLaptop: 'MacBook Pro 16" M3 Max'
      },
      securityGroups: ['Engineering-Dev', 'GitHub-Committers', 'Global-Staff'],
      itCredentials: {
        networkId: '',
        systemId: '',
        corporateEmail: '',
        tempPassword: '',
        badgeId: ''
      },
      status: 'In Progress',
      history: [
        { step: 'HR_DRAFT', by: 'Sarah Jenkins (HR)', at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
        { step: 'EMPLOYEE_INPUT', by: 'Emily Vance', at: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
      ]
    },
    {
      _id: 'onb_002',
      onboardingId: 'ONB-2026-002',
      employeeName: 'Lucas Gray',
      personalEmail: 'lucas.gray@email.com',
      department: 'Finance & Accounting',
      designation: 'Senior Financial Analyst',
      managerName: 'Priya Sharma',
      startDate: '2026-10-30',
      step: 'HR_VERIFIED',
      employeeDetails: {
        phone: '+1 (555) 345-6789',
        address: '88 Bay Road, Apt 12B',
        emergencyContact: 'Elena Gray (+1 555-876-5432)',
        preferredLaptop: 'Dell Latitude 5540'
      },
      securityGroups: ['Finance-Approvers', 'SAP-Treasury', 'Global-Staff'],
      itCredentials: {
        networkId: '',
        systemId: '',
        corporateEmail: '',
        tempPassword: '',
        badgeId: ''
      },
      status: 'In Progress',
      history: [
        { step: 'HR_DRAFT', by: 'Sarah Jenkins (HR)', at: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
        { step: 'EMPLOYEE_INPUT', by: 'Lucas Gray', at: new Date(Date.now() - 36 * 3600 * 1000).toISOString() },
        { step: 'HR_VERIFIED', by: 'Sarah Jenkins (HR)', at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() }
      ]
    }
  ];
  onboardings.forEach(o => onbColl.insert(o));

  // 7. Offboardings (Workflow 3.2)
  const offColl = store.collection('offboardings');
  const offboardings = [
    {
      _id: 'off_001',
      offboardingId: 'OFF-2026-001',
      employeeId: 'usr_marcus',
      employeeName: 'Marcus Thorne',
      department: 'Infrastructure',
      managerName: 'David Miller',
      exitDate: '2026-10-31',
      reason: 'Voluntary Resignation - Career Growth',
      status: 'Assets_Checked', // Initiated -> Assets_Checked -> Automated_Cutoff_Complete -> Completed
      allocatedAssets: [
        {
          assetId: 'ast_007',
          assetTag: 'ASSET-LP-DEV-09',
          name: 'MacBook Pro 16" M3 Max (Marcus)',
          category: 'Laptop',
          condition: 'Pending', // Pending, Good, Broken
          checkedAt: null,
          notes: ''
        }
      ],
      allocatedLicenses: [
        { licenseId: 'lic_001', name: 'Microsoft 365 E5 Enterprise' },
        { licenseId: 'lic_002', name: 'JetBrains All Products Pack' },
        { licenseId: 'lic_003', name: 'Datadog Cloud APM & Infra Pro' }
      ],
      automatedCutoff: {
        executed: false,
        executedAt: null,
        groupsRemoved: false,
        adDisabled: false,
        autoReplySet: false,
        emailForwardedToManager: false
      },
      delayedLicenseRevocation: {
        scheduledDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Scheduled (3-Month Archive Period)',
        revokedAt: null
      }
    },
    {
      _id: 'off_002',
      offboardingId: 'OFF-2026-002',
      employeeId: 'usr_brenda_old',
      employeeName: 'Brenda Clark',
      department: 'Marketing',
      managerName: 'Sarah Jenkins',
      exitDate: '2026-07-20',
      reason: 'Contract Ended',
      status: 'Automated_Cutoff_Complete',
      allocatedAssets: [
        {
          assetId: 'ast_old_01',
          assetTag: 'ASSET-LP-MKT-08',
          name: 'MacBook Air M2',
          category: 'Laptop',
          condition: 'Good',
          checkedAt: '2026-07-21T10:00:00.000Z',
          notes: 'Returned in pristine condition, reset to factory image'
        }
      ],
      allocatedLicenses: [
        { licenseId: 'lic_004', name: 'Adobe Creative Cloud All Apps' }
      ],
      automatedCutoff: {
        executed: true,
        executedAt: '2026-07-20T17:00:00.000Z',
        groupsRemoved: true,
        adDisabled: true,
        autoReplySet: true,
        emailForwardedToManager: true
      },
      delayedLicenseRevocation: {
        scheduledDate: '2026-10-20T17:00:00.000Z',
        status: 'DUE_NOW', // 3 months have passed! Ready for IT revocation
        revokedAt: null
      }
    }
  ];
  offboardings.forEach(o => offColl.insert(o));

  // 8. Procurements (Workflow 3.4)
  const procColl = store.collection('procurements');
  const procurements = [
    {
      _id: 'proc_001',
      reqNumber: 'PR-2026-081',
      item: 'Dell UltraSharp 32" 4K USB-C Hub Monitors (U3223QE) x2',
      category: 'Hardware / Displays',
      quantity: 2,
      estimatedCost: 1780,
      justification: 'Required for UI layout fidelity and multi-window backend microservice debugging for senior engineer.',
      requestedBy: 'Alex Wong',
      department: 'Software Engineering',
      status: 'IT_Review', // Requested -> IT_Review -> Manager_Approved -> Finance_Paid -> Order_Placed -> Delivered_CheckedIn -> Rejected
      itReview: {
        reviewedBy: 'Harindy Jayasuriya (ITAM)',
        recommendedOption: 'Dell U3223QE with built-in KVM and 90W PD matches corporate IT standard.',
        approved: true,
        reviewedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      managerApproval: {
        approvedBy: 'David Miller',
        status: 'Pending',
        approvedAt: null,
        comments: ''
      },
      financePayment: {
        poNumber: '',
        paidAt: null,
        status: 'Pending'
      },
      deliveryCheckIn: {
        deliveredAt: null,
        assetTagsCreated: []
      }
    },
    {
      _id: 'proc_002',
      reqNumber: 'PR-2026-080',
      item: 'Ubiquiti UniFi Enterprise 48 PoE Network Switch',
      category: 'Network Infrastructure',
      quantity: 1,
      estimatedCost: 1999,
      justification: 'Port capacity in East Wing Switch Closet is at 98% utilization. Needed to onboard upcoming Q4 engineering hires.',
      requestedBy: 'Pabodha Senaratne',
      department: 'Network Operations',
      status: 'Manager_Approved',
      itReview: {
        reviewedBy: 'Vishan Fernando (ITSM)',
        recommendedOption: 'UniFi Enterprise 48 with 2.5G ports supports Wi-Fi 6E uplink speeds.',
        approved: true,
        reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      managerApproval: {
        approvedBy: 'David Miller',
        status: 'Approved',
        approvedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        comments: 'Approved within Q4 infrastructure cap-ex budget.'
      },
      financePayment: {
        poNumber: 'PO-2026-NET-991',
        paidAt: null,
        status: 'Authorized'
      },
      deliveryCheckIn: {
        deliveredAt: null,
        assetTagsCreated: []
      }
    }
  ];
  procurements.forEach(p => procColl.insert(p));

  // 9. Floorplans (Spatial Discovery Pabodha)
  const fpColl = store.collection('floorplans');
  const floorplan = {
    _id: 'fp_floor_1',
    floorNumber: 1,
    floorName: 'Headquarters Building - Level 1 Campus',
    width: 1000,
    height: 700,
    rooms: [
      { id: 'room_datacenter', name: 'Server Room / Data Center A', code: 'DC-101', type: 'datacenter', x: 50, y: 50, width: 220, height: 260, color: '#312e81' },
      { id: 'room_helpdesk', name: 'IT Helpdesk & Operations Center', code: 'IT-102', type: 'helpdesk', x: 290, y: 50, width: 280, height: 260, color: '#1e3a8a' },
      { id: 'room_eng_a', name: 'Engineering Bay A (Software)', code: 'ENG-A', type: 'open_office', x: 590, y: 50, width: 360, height: 260, color: '#064e3b' },
      { id: 'room_eng_b', name: 'Engineering Bay B (Systems & Cloud)', code: 'ENG-B', type: 'open_office', x: 590, y: 340, width: 360, height: 310, color: '#065f46' },
      { id: 'room_switch_b', name: 'Network Switch Closet B', code: 'IDF-B', type: 'closet', x: 50, y: 340, width: 220, height: 140, color: '#4c1d95' },
      { id: 'room_exec', name: 'Executive & Board Conference Room', code: 'CONF-EX', type: 'conference', x: 50, y: 500, width: 220, height: 150, color: '#701a75' },
      { id: 'room_hr_fin', name: 'HR & Finance Department', code: 'HR-FIN', type: 'department', x: 290, y: 340, width: 280, height: 310, color: '#134e4a' }
    ],
    devices: [
      {
        id: 'dev_01',
        assetId: 'ast_001',
        assetTag: 'ASSET-SRV-CORE-01',
        name: 'Core DB Server R750',
        type: 'server',
        x: 160,
        y: 180,
        room: 'Server Room / Data Center A',
        rack: 'Rack A1',
        ip: '10.0.1.10',
        mac: '00:1A:2B:3C:4D:10',
        switchPort: 'Gi1/0/10',
        status: 'Online',
        pingLatency: 1.2
      },
      {
        id: 'dev_02',
        assetId: 'ast_002',
        assetTag: 'ASSET-SW-CORE-01',
        name: 'Core Distribution Switch 48P',
        type: 'switch',
        x: 160,
        y: 110,
        room: 'Server Room / Data Center A',
        rack: 'Rack A1',
        ip: '10.0.1.1',
        mac: '00:1A:2B:3C:4D:01',
        switchPort: 'Uplink Te1/1/1',
        status: 'Online',
        pingLatency: 0.8
      },
      {
        id: 'dev_03',
        assetId: 'ast_003',
        assetTag: 'ASSET-SW-EDGE-02',
        name: 'East Wing Edge Switch 24P',
        type: 'switch',
        x: 160,
        y: 410,
        room: 'Network Switch Closet B',
        rack: 'Rack B2',
        ip: '10.0.1.2',
        mac: '00:1A:2B:3C:4D:02',
        switchPort: 'Trunk Gi1/1',
        status: 'Online',
        pingLatency: 1.4
      },
      {
        id: 'dev_04',
        assetId: 'ast_004',
        assetTag: 'ASSET-AP-BAY-01',
        name: 'Wi-Fi AP Bay A',
        type: 'access_point',
        x: 770,
        y: 180,
        room: 'Engineering Bay A',
        rack: 'Ceiling Mount Zone A',
        ip: '10.0.2.20',
        mac: '00:1A:2B:3C:4D:20',
        switchPort: 'Gi1/0/20',
        status: 'Online',
        pingLatency: 2.1
      },
      {
        id: 'dev_05',
        assetId: 'ast_005',
        assetTag: 'ASSET-AP-BAY-02',
        name: 'Wi-Fi AP Bay B',
        type: 'access_point',
        x: 770,
        y: 500,
        room: 'Engineering Bay B',
        rack: 'Ceiling Mount Zone B',
        ip: '10.0.2.21',
        mac: '00:1A:2B:3C:4D:21',
        switchPort: 'Gi1/0/21',
        status: 'Degraded',
        pingLatency: 124.5
      },
      {
        id: 'dev_06',
        assetId: 'ast_006',
        assetTag: 'ASSET-WS-ENG-01',
        name: 'Workstation WS-ENG-01 (Alex)',
        type: 'workstation',
        x: 670,
        y: 130,
        room: 'Engineering Bay A',
        rack: 'Desk 12',
        ip: '10.0.2.101',
        mac: '00:1A:2B:3C:4D:77',
        switchPort: 'Gi1/0/3',
        status: 'Online',
        pingLatency: 3.2
      },
      {
        id: 'dev_07',
        assetId: 'ast_008',
        assetTag: 'ASSET-LP-HR-05',
        name: 'ThinkPad P16 (Sarah)',
        type: 'workstation',
        x: 430,
        y: 490,
        room: 'HR & Finance Department',
        rack: 'Desk 02',
        ip: '10.0.2.144',
        mac: '00:1A:2B:3C:4D:44',
        switchPort: 'Gi1/0/8',
        status: 'Online',
        pingLatency: 2.8
      }
    ]
  };
  fpColl.insert(floorplan);

  // 10. Audit Logs (Malmika Security Lead)
  const auditColl = store.collection('auditLogs');
  const auditLogs = [
    {
      actorName: 'Vishan Fernando',
      actorRole: 'itsm_lead',
      action: 'TICKET_ACKNOWLEDGED',
      entityType: 'Ticket',
      entityId: 'tkt_001',
      details: 'P1-Critical Incident INC-2026-001 responded to within SLA response window (8m elapsed, target 15m).',
      ipAddress: '10.0.1.5',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      actorName: 'Pabodha Senaratne',
      actorRole: 'discovery_lead',
      action: 'NETWORK_SCAN_COMPLETED',
      entityType: 'Floorplan / CMDB',
      entityId: 'fp_floor_1',
      details: 'Automated Zabbix/SNMP discovery scan synchronized 7 physical devices. Flagged AP-BAY-02 with degraded latency (124ms).',
      ipAddress: '10.0.1.15',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      actorName: 'Harindy Jayasuriya',
      actorRole: 'itam_lead',
      action: 'PROCUREMENT_REVIEWED',
      entityType: 'Procurement',
      entityId: 'proc_001',
      details: 'Approved hardware specification review for Dell 4K Displays. Forwarded to Engineering Manager David Miller.',
      ipAddress: '10.0.1.8',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    },
    {
      actorName: 'Sarah Jenkins',
      actorRole: 'hr',
      action: 'ONBOARDING_HR_VERIFIED',
      entityType: 'Onboarding',
      entityId: 'onb_002',
      details: 'Verified candidate details for Lucas Gray. Assigned security groups [Finance-Approvers, SAP-Treasury]. Passed to IT provisioning.',
      ipAddress: '10.0.2.144',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    },
    {
      actorName: 'System SLA Cron Daemon',
      actorRole: 'system',
      action: 'SLA_PRE_BREACH_ALERT',
      entityType: 'Ticket',
      entityId: 'tkt_002',
      details: 'Automated 1-hour pre-breach warning triggered for INC-2026-002 (P2-High Response SLA). Escalated alert notified to Vishan Fernando.',
      ipAddress: '127.0.0.1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    }
  ];
  auditLogs.forEach(al => auditColl.insert(al));

  console.log('Seed database initialized successfully!');
}

module.exports = { seedDatabase };
