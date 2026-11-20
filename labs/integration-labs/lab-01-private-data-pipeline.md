# Integration Lab 01: Zero-Secret Private Data Pipeline

**Domains Connected:** Identity & Governance (20–25%) • Virtual Networking (15–20%) • Storage (15–20%) • Compute (20–25%)  
**Estimated Time:** 35–45 minutes  
**Official Microsoft Lab References:**
- [Lab 02a: Manage Subscriptions and RBAC](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_02a_Manage_Subscriptions_and_RBAC_Entra.html)
- [Lab 05: Implement Intersite Connectivity](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_05-Implement_Intersite_Connectivity.html)
- [Lab 07: Manage Azure Storage](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_07-Manage_Azure_Storage.html)

---

## 1. Architecture You Are Building

```
[vm-app-01 (10.1.1.4) in vnet-app]
   │  1. Uses System-Assigned Managed Identity (zero storage keys!)
   │  2. Queries Private DNS Zone (privatelink.blob.core.windows.net -> 10.2.1.4)
   ▼
[Direct Spoke VNet Peering: vnet-app (10.1.0.0/16) <---> vnet-data (10.2.0.0/16)]
   │
   ▼
[Private Endpoint (10.2.1.4) in vnet-data/snet-data]
   │
   ▼
[Storage Account stnorthstarXXXX (Public Network Access: DISABLED + CanNotDelete Lock)]
   └── Blob Container: 'orders' (Authorized via 'Storage Blob Data Contributor')
```

---

## 2. Step-by-Step Azure Portal Guide

1. **Create VNets & Direct Peering:**
   - In Portal → **Virtual networks** → create `vnet-app` (`10.1.0.0/16`, subnet `snet-app` `10.1.1.0/24`) and `vnet-data` (`10.2.0.0/16`, subnet `snet-data` `10.2.1.0/24`) inside `rg-northstar-core`.
   - Open `vnet-app` → **Peerings** → **+ Add** → peer to `vnet-data` (check *Allow virtual network access* on both sides). Verify Peering status shows **Connected**.
2. **Create Locked-Down Storage Account & Private Endpoint:**
   - Go to **Storage accounts** → **+ Create** → `stnorthstar<random>` (`Standard_LRS`, `StorageV2`) in `rg-northstar-core`.
   - Create a Blob container named `orders`.
   - Open **Networking** → set **Public network access** to **Disable** → Save.
   - Switch to the **Private endpoint connections** tab → **+ Private endpoint**:
     - Name: `pe-northstar-blob` in `rg-northstar-ephemeral`
     - Target sub-resource: `blob`
     - Virtual network: `vnet-data` / `snet-data`
     - Private DNS integration: **Yes** (`privatelink.blob.core.windows.net`)
3. **Link Private DNS Zone to `vnet-app` (Crucial Step!):**
   - Search **Private DNS zones** → open `privatelink.blob.core.windows.net` → **Virtual network links** → **+ Add**:
     - Link name: `link-vnet-app`
     - Virtual network: `vnet-app` (Auto-registration not needed for PaaS lookup).
4. **Deploy App VM with Managed Identity & Data Plane RBAC:**
   - Deploy `vm-app-01` (`Standard_B1s`, Ubuntu) into `vnet-app/snet-app` inside `rg-northstar-ephemeral`.
   - Open `vm-app-01` → **Identity** → **System assigned** → set Status to **On** → Save.
   - Open your Storage Account → **Access Control (IAM)** → **+ Add role assignment**:
     - Role: **Storage Blob Data Contributor** *(NOT regular `Contributor`!)*
     - Assign access to: **Managed identity** → select `vm-app-01`.
5. **Apply Governance Lock:**
   - On the Storage Account → **Locks** → **+ Add** → Lock type: **Delete** (`CanNotDelete`).

---

## 3. Automated CLI Deployment (`lab-01-deploy.sh`)

Run the whole build in Azure Cloud Shell:

```bash
./labs/integration-labs/lab-01-deploy.sh eastus
```

---

## 4. End-to-End Verification & Deliberate Break Test

Run these commands on `vm-app-01` (via **Run command → RunShellScript** in the Portal or SSH):

```bash
# 1. Verify Private DNS resolves to 10.2.1.x (NOT a 52.x.x.x public IP!)
nslookup <your-storage-account>.blob.core.windows.net

# 2. Authenticate using the VM's Managed Identity (zero passwords or keys!)
az login --identity

# 3. Upload a blob over the Private Endpoint using Data Plane RBAC
echo "Order #104 verified" > order.txt
az storage blob upload --account-name <your-storage-account> --container-name orders --name order.txt --file order.txt --auth-mode login
```

### Break It to Cement the Exam Traps
- **Break #1:** Delete the `link-vnet-app` Virtual Network Link on `privatelink.blob.core.windows.net` → watch `nslookup` flip back to a public IP and `az storage blob upload` fail with `403 AuthorizationFailure`.
- **Break #2:** Try deleting the Storage Account as Subscription Owner → observe `ScopeLocked` until you remove the `CanNotDelete` lock.
