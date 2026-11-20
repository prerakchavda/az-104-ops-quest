# Integration Lab 03: Governed Storefront & Serverless Batch Worker

**Domains Connected:** Identities & Governance (20–25%) • Compute: App Service & Containers (20–25%) • Storage (15–20%)  
**Estimated Time:** 35–45 minutes  
**Official Microsoft Lab References:**
- [Lab 02b: Manage Governance via Azure Policy](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_02b-Manage_Governance_via_Azure_Policy.html)
- [Lab 09a: Implement Web Apps](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_09a-Implement_Web_Apps.html)
- [Lab 09b: Implement Azure Container Instances](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_09b-Implement_Azure_Container_Instances.html)
- [Lab 09c: Implement Azure Container Apps](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_09c-Implement-Azure-Container-Apps.html)

---

## 1. Architecture You Are Building

```
[Azure Policy on rg-northstar-ephemeral: Require tag 'Env=Prod' + Allowed Locations]
   │
   ├──> [App Service Plan (Standard S1)]
   │       ├── Production Slot (DB_CONN = 'prod-sql' [Slot-Sticky!])
   │       └── Staging Slot    (DB_CONN = 'stage-sql' [Slot-Sticky!])
   │
   └──> [Azure Container Instance (ACI) with restartPolicy: OnFailure]
           └── Mounts Azure File Share ('batchlogs') over SMB -> writes nightly job summary
```

---

## 2. Step-by-Step Azure Portal Guide

1. **Assign Tag Governance Policy:**
   - Go to **Policy** → **Assignments** → **Assign policy**:
     - Scope: `rg-northstar-ephemeral`
     - Policy definition: **Require a tag on resources** (`Tag Name: Env`)
     - Note: To auto-add tags to existing resources, use **Add a tag to resources** (`Modify` effect) + create a **Remediation task**.
2. **Deploy App Service + Staging Slot with Slot-Sticky Setting:**
   - Go to **App Services** → **+ Create** → Web App on **Standard (S1)** plan (remember: Basic `B1` does not support slots!) with tag `Env=Prod`.
   - Open your Web App → **Deployment slots** → **+ Add Slot** → Name: `staging`.
   - Open the **Production** app → **Environment variables** → **+ Add**:
     - Name: `DB_CONN`, Value: `Server=prod-db.northstar.internal`
     - Check **Deployment slot setting** (this makes it slot-sticky!) → Apply.
   - Open the **staging** slot → **Environment variables** → **+ Add**:
     - Name: `DB_CONN`, Value: `Server=staging-db.northstar.internal`
     - Check **Deployment slot setting** → Apply.
   - Click **Swap** (`staging` ↔ `production`) and verify that `DB_CONN` on production stays `prod-db`!
3. **Run Serverless Batch Container (ACI) Mounted to Azure Files:**
   - Create a Storage Account + Azure File Share named `batchlogs`.
   - Deploy an Azure Container Instance (`aci-batch-worker`) with `--restart-policy OnFailure` and mount the `batchlogs` file share so the container writes a timestamped report and exits cleanly without looping.

---

## 3. Automated CLI Deployment (`lab-03-deploy.sh`)

```bash
./labs/integration-labs/lab-03-deploy.sh eastus
```
