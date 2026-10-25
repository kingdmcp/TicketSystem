#!/usr/bin/env python3
"""
Enterprise Network Discovery & Spatial Telemetry Agent
Lead: Pabodha Senaratne (Discovery & Integration Lead)
Simulates SNMP MIB polling, ARP table inspection, and port status discovery,
then synchronizes discovered topology directly to the MERN backend API.
"""

import sys
import time
import random
import argparse
from datetime import datetime
try:
    import requests
except ImportError:
    print("Error: 'requests' library not found. Install via 'pip install requests'")
    sys.exit(1)

BACKEND_API_URL = "http://localhost:5000/api/discovery/sync"

# Corporate Subnet Device Inventory for Simulated Active Discovery
KNOWN_TOPOLOGY = [
    {
        "ip": "10.0.1.10",
        "mac": "00:1A:2B:3C:4D:10",
        "hostname": "srv-prod-db01.enterprise.local",
        "device_type": "Server",
        "switchPort": "Gi1/0/10",
        "vlan": 10,
        "snmp_sysDescr": "Linux 6.1.0-21-amd64 Dell PowerEdge R750",
        "base_latency": 1.2
    },
    {
        "ip": "10.0.1.1",
        "mac": "00:1A:2B:3C:4D:01",
        "hostname": "core-sw01.enterprise.local",
        "device_type": "Switch",
        "switchPort": "Uplink Te1/1/1",
        "vlan": 1,
        "snmp_sysDescr": "Cisco IOS-XE Software, Catalyst L3 Switch 9300",
        "base_latency": 0.8
    },
    {
        "ip": "10.0.1.2",
        "mac": "00:1A:2B:3C:4D:02",
        "hostname": "edge-sw02.enterprise.local",
        "device_type": "Switch",
        "switchPort": "Trunk Gi1/1",
        "vlan": 20,
        "snmp_sysDescr": "ArubaOS-Switch 2930F-24G-PoE+",
        "base_latency": 1.4
    },
    {
        "ip": "10.0.2.20",
        "mac": "00:1A:2B:3C:4D:20",
        "hostname": "ap-bay-a.enterprise.local",
        "device_type": "Access Point",
        "switchPort": "Gi1/0/20",
        "vlan": 30,
        "snmp_sysDescr": "Ubiquiti UniFi U6-Pro v6.5.62",
        "base_latency": 2.1
    },
    {
        "ip": "10.0.2.21",
        "mac": "00:1A:2B:3C:4D:21",
        "hostname": "ap-bay-b.enterprise.local",
        "device_type": "Access Point",
        "switchPort": "Gi1/0/21",
        "vlan": 30,
        "snmp_sysDescr": "Ubiquiti UniFi U6-Pro v6.5.62",
        "base_latency": 115.0  # Degraded link simulation
    },
    {
        "ip": "10.0.2.101",
        "mac": "00:1A:2B:3C:4D:77",
        "hostname": "ws-eng-alex.enterprise.local",
        "device_type": "Workstation",
        "switchPort": "Gi1/0/3",
        "vlan": 20,
        "snmp_sysDescr": "Ubuntu 24.04 LTS Dell Precision 5820 Tower",
        "base_latency": 3.2
    },
    {
        "ip": "10.0.2.144",
        "mac": "00:1A:2B:3C:4D:44",
        "hostname": "ws-hr-sarah.enterprise.local",
        "device_type": "Laptop",
        "switchPort": "Gi1/0/8",
        "vlan": 40,
        "snmp_sysDescr": "Microsoft Windows 11 Enterprise Lenovo ThinkPad",
        "base_latency": 2.8
    }
]

def perform_snmp_ping_sweep():
    """Simulates active SNMP MIB query and round-trip ICMP probe"""
    start_time = time.time()
    discovered_payload = []

    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Initiating subnet discovery sweep across VLANs 1, 10, 20, 30, 40...")

    for dev in KNOWN_TOPOLOGY:
        # Simulate slight jitter in response time
        jitter = random.uniform(-0.5, 0.8)
        current_latency = max(0.4, round(dev["base_latency"] + jitter, 1))

        # AP Bay B has higher jitter / degraded behavior
        if "ap-bay-b" in dev["hostname"]:
            health = "Degraded" if random.random() > 0.3 else "Online"
        else:
            health = "Online"

        device_record = {
            "ip": dev["ip"],
            "mac": dev["mac"],
            "hostname": dev["hostname"],
            "deviceType": dev["device_type"],
            "switchPort": dev["switchPort"],
            "vlan": dev["vlan"],
            "health": health,
            "pingLatency": current_latency,
            "snmpSysDescr": dev["snmp_sysDescr"]
        }
        discovered_payload.append(device_record)
        print(f"  -> Discovered: {dev['ip']:<15} | MAC: {dev['mac']} | Port: {dev['switchPort']:<12} | Ping: {current_latency:>5.1f}ms | Status: {health}")

    duration_ms = int((time.time() - start_time) * 1000)

    # Post to MERN Backend API
    post_data = {
        "source": "Python Network Discovery Engine (SNMP/Zabbix)",
        "devices": discovered_payload,
        "scanDurationMs": duration_ms
    }

    try:
        response = requests.post(BACKEND_API_URL, json=post_data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"[SUCCESS] Dispatched {len(discovered_payload)} hosts to MERN CMDB API. Response: {result.get('message')}")
        else:
            print(f"[WARN] Backend returned status code {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print(f"[NOTICE] MERN Backend not reachable at {BACKEND_API_URL}. Ensure server is running on port 5000.")
    except Exception as e:
        print(f"[ERROR] Sync failed: {e}")

def main():
    parser = argparse.ArgumentParser(description="ITSM/ITAM Network Discovery Agent (Python)")
    parser.add_argument("--once", action="store_true", help="Run a single discovery scan and exit")
    parser.add_argument("--interval", type=int, default=30, help="Interval in seconds between scans (default: 30)")
    args = parser.parse_args()

    print("==========================================================")
    print("[DISCOVERY] Pabodha's Network Discovery & SNMP Integration Agent")
    print(f"Target Backend: {BACKEND_API_URL}")
    print("==========================================================")

    if args.once:
        perform_snmp_ping_sweep()
        print("\nDiscovery sweep finished.")
    else:
        print(f"Starting continuous network polling loop (every {args.interval}s). Press Ctrl+C to stop.")
        try:
            while True:
                perform_snmp_ping_sweep()
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped discovery agent.")

if __name__ == "__main__":
    main()
