<p align="center">
  <!-- Replace this URL with your actual poster image path once uploaded to your repository -->
  <img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/682f490a-f0f2-4821-80a1-946fdc4a9fdb" />
</p>

# eBPF-Driven Multi-Agent Swarm Orchestration For Kubernetes Self-Healing

[![GitHub License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Kubernetes-blue.svg)](#)
[![Tools](https://img.shields.io/badge/Stack-Prometheus%20%7C%20Grafana%20%7C%20Helm-orange.svg)](#)

## <ins>Automated Multi-Tenant Cloud-Native Observability Framework</ins>

<p>This repository provides an enterprise-ready, production-grade monitoring and alerting framework designed specifically for Kubernetes (K8s) ecosystems. By leveraging the Prometheus operator model alongside Grafana's visualization layer, the framework delivers deep granular insights into cluster resource utilization, microservice health, and node-level infrastructure metrics—ensuring zero blind spots in high-volume production traffic.</p>

---

## System Architecture & Data Pipeline

The framework is engineered for non-intrusive, low-overhead data aggregation across distributed containerized clusters.
1. **Metrics Collection Layer:** Automated service discovery using Prometheus custom resource definitions (CRDs) targeting system, node, and pod-level runtimes.
2. **Infrastructure Instrumentation:** Node Exporter and `kube-state-metrics` deployment for capturing real-time CPU/Memory saturation, network I/O spikes, and storage volume thresholds.
3. **Storage & Time-Series Engine:** High-performance TSDB configuration optimized for chunked metrics retention, reducing storage footprints while ensuring rapid query executions.
4. **Visualization & Insights:** Rich, pre-configured dashboard provisions feeding directly from localized Prometheus data streams.

---

## Operational Dashboards

Full-spectrum visibility into your live Kubernetes cluster state.

<p align="center">
  <!-- Replace this with your actual dashboard screenshot path -->
  <<img width="821" height="492" alt="image" src="https://github.com/user-attachments/assets/c2f11b31-7c3f-40d5-80f7-84de5bd32a18" />
>
</p>

*Figure: Unified Command Center dashboard highlighting CPU Throttling, Memory Pressures, and Pod Restart frequencies.*

---

## High-Impact Observations & Features

### 1. Proactive OOM-Kill Detection
The setup implements precise rules targeting early warnings for memory saturation patterns, preventing sudden container restarts before application downtime occurs.

* **Methodology:** `container_memory_working_set_bytes` threshold evaluations.
* **Impact:** Drastically minimizes transient 502/504 errors in routing layers.

### 2. Microservice Resource Right-Sizing
Provides historical saturation curves across namespaces to identify over-provisioned or heavily under-provisioned container limits.

* **Finding:** Helps operations align CPU Request and CPU Limit ratios perfectly to avoid scheduling bottlenecks.

### 3. Comprehensive Alert Routing
Pre-configured routing configurations capable of decoupling critical hardware anomalies from standard non-blocking system warnings.

---

## Reproduction & Deployment

Professional-grade orchestration for immediate platform-wide deployment.

### 1. Prerequisites
Ensure you have access to a running Kubernetes cluster and `helm` installed locally:
```bash
kubectl cluster-info
helm version
# Add the required helm charts
helm repo add prometheus-community [https://prometheus-community.github.io/helm-charts](https://prometheus-community.github.io/helm-charts)
helm repo update

# Install the monitoring suite
helm install k8s-monitoring prometheus-community/kube-prometheus-stack
