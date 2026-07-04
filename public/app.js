const state = {
  users: [],
  user: null,
  view: "contracts",
  selectedContractId: null,
  editing: null,
  rejectingTariffId: null,
  deletingContractId: null
};

const el = {
  loginView:document.querySelector("#loginView"),

  appView:document.querySelector("#appView"),

  loginForm:document.querySelector("#loginForm"),

  loginUser:document.querySelector("#loginUser"),

  loginPassword:document.querySelector("#loginPassword"),

  logout:document.querySelector("#logout"),

  currentUser:document.querySelector("#currentUser"),
  navWork: document.querySelector("#navWork"),
  navDashboard: document.querySelector("#navDashboard"),
  workspace: document.querySelector("#workspaceView"),
  dashboard: document.querySelector("#dashboardView"),
  alertModal: document.querySelector("#alertModal"),
  alertTitle: document.querySelector("#alertTitle"),
  alertText: document.querySelector("#alertText"),
  alertClose: document.querySelector("#alertClose"),
  rejectModal: document.querySelector("#rejectModal"),
  rejectForm: document.querySelector("#rejectForm"),
  rejectReason: document.querySelector("#rejectReason"),
  rejectCancel: document.querySelector("#rejectCancel"),
  contractModal: document.querySelector("#contractModal"),
  contractForm: document.querySelector("#contractForm"),
  contractCancel: document.querySelector("#contractCancel"),
  deleteModal: document.querySelector("#deleteModal"),
  deleteConfirm: document.querySelector("#deleteConfirm"),
  deleteCancel: document.querySelector("#deleteCancel")
};

const OPTIONS = {
  container_size: ["20FT", "40FT", "45FT"],
  move_type: ["IMPORT", "EXPORT", "TRANSSHIPMENT"],
  currency: ["USD", "EUR", "INR"]
};

init();

async function init(){

  const {users}=

  await api(

  "/api/users",

  {

  userOptional:true

  }

  );

  state.users=users;

  bindEvents();

  const saved=

  localStorage.getItem(

  "loggedUser"

  );

  if(saved){

  state.user=

  JSON.parse(saved);

  showApp();

  await refresh();

  }

  else{

  showLogin();

  }

  }

function renderLoginUsers(){
  console.log(state.users);

  el.loginUser.innerHTML=

  state.users

  .map(

  user=>

  `

  <option value="${user.id}">

  ${user.name}

  </option>

  `

  )

  .join("");

  }  

function showLogin(){

  el.loginView.classList.remove("hidden");

  el.appView.classList.add("hidden");

  renderLoginUsers();

}

function showApp(){

  el.loginView.classList.add("hidden");

  el.appView.classList.remove("hidden");

  el.currentUser.textContent =

    `${state.user.name} • ${state.user.role}`;

}
function bindEvents() {
  el.loginForm.addEventListener(

  "submit",

  async(event)=>{

  event.preventDefault();

  const user=

  state.users.find(

  item=>

  item.id===

  el.loginUser.value

  );

  if(

  user.password

  !==

  el.loginPassword.value

  ){

  showAlert(

  "Invalid password",

  true

  );

  return;

  }

  state.user=user;

  localStorage.setItem(

  "loggedUser",

  JSON.stringify(

  user

  )

  );

  showApp();

  await refresh();

  }

  );


  el.logout.addEventListener(

  "click",

  ()=>{

  localStorage.removeItem(

  "loggedUser"

  );

  state.user=null;

  showLogin();

  }

  );
  el.navWork.addEventListener("click", async () => {
    state.view = "contracts";
    state.selectedContractId = null;
    state.editing = null;
    await refresh();
  });

  el.navDashboard.addEventListener("click", async () => {
    if (!["APPROVER", "VIEWER"].includes(state.user.role)) return;
    state.view = "dashboard";
    state.selectedContractId = null;
    state.editing = null;
    await refresh();
  });
  el.alertClose.addEventListener("click", closeAlert);
  el.alertModal.addEventListener("click", (event) => {
    if (event.target === el.alertModal) closeAlert();
  });
  el.rejectCancel.addEventListener("click", closeRejectModal);
  el.rejectModal.addEventListener("click", (event) => {
    if (event.target === el.rejectModal) closeRejectModal();
  });
  el.deleteModal.addEventListener("click",
    (event)=>{
      if(event.target===el.deleteModal){
        closeDeleteModal();
      }
    });
  el.contractCancel.addEventListener("click", closeContractModal);
  el.deleteCancel.addEventListener(
  "click",
  closeDeleteModal
  );
  el.deleteConfirm.addEventListener(
  "click",
  confirmDeleteContract
  );
  el.contractModal.addEventListener("click", (event) => {
    if (event.target === el.contractModal) closeContractModal();
  });
  el.contractForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/api/contracts", { method: "POST", body: readPlainForm(event.currentTarget) });
      closeContractModal();
      showAlert("Contract created.");
      await refresh();
    } catch (error) {
      showAlert(error.message, true);
    }
  });
  el.rejectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reason = el.rejectReason.value.trim();
    if (!reason) {
      showAlert("A rejection reason is required.", true);
      return;
    }
    const tariffId = state.rejectingTariffId;
    closeRejectModal();
    try {
      await api(`/api/tariffs/${tariffId}/reject`, { method: "POST", body: { reason } });
      showAlert("Tariff rejected.");
      await refresh();
    } catch (error) {
      showAlert(error.message, true);
    }
  });
}

async function refresh() {
  const isDashboard = state.view === "dashboard";
  el.navDashboard.classList.toggle("hidden", !["APPROVER", "VIEWER"].includes(state.user.role));
  el.navWork.classList.toggle("active", !isDashboard);
  el.navDashboard.classList.toggle("active", isDashboard);
  el.workspace.classList.toggle("hidden", isDashboard);
  el.dashboard.classList.toggle("hidden", !isDashboard);
  if (isDashboard) {
    await renderDashboard();
    return;
  }

  if (state.selectedContractId) {
    await renderContractDetail();
  } else {
    await renderContractsPage();
  }
}

async function renderContractsPage() {
  const { contracts } = await api("/api/contracts");
  const heading = state.user.role === "VIEWER" ? "Approved Contracts" : "Contracts";
  el.workspace.innerHTML = `
    <section class="panel">
      <div class="section-heading">
        <h2>${heading}</h2>
        ${state.user.role === "APPROVER" ? `<button id="addContract" class="icon-button" type="button" title="Add contract">+</button>` : ""}
      </div>
      <div class="contract-grid">
        ${contracts.length ? contracts.map(renderContractCard).join("") : `<p class="muted">No contracts are available for this role.</p>`}
      </div>
    </section>
  `;

  document.querySelector("#addContract")?.addEventListener("click", openContractModal);

  // Open contract
  document.querySelectorAll("[data-open-contract]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedContractId = button.dataset.openContract;
      state.editing = null;

      await refresh();
    });
  });

  // Delete contract
  document.querySelectorAll("[data-delete-contract]").forEach((button) => {
    button.addEventListener("click", () => {
      openDeleteModal(button.dataset.deleteContract);
    });
  });
}

function renderContractCard(contract) {

  let tariffCount = contract.tariffs?.length ?? 0;

  if (state.user.role === "CREATOR") {

    tariffCount = contract.tariffs.filter(

      tariff => tariff.creator_id === state.user.id

    ).length;

  }

  const countLabel = {
    CREATOR: "My Tariffs",
    APPROVER: "Pending Approval",
    VIEWER: "Approved Tariffs"
  }[state.user.role] ?? "Tariffs";

  return `
    <article class="contract-card">
      <div>
        <h3>${contract.name}</h3>
        <p>${contract.description ?? ""}</p>
      </div>
      <dl>
        <div>
          <dt>Validity</dt>
          <dd>${contract.valid_from} to ${contract.valid_until}</dd>
        </div>
        <div>
          <dt>${countLabel}</dt>
          <dd>${tariffCount}</dd>
        </div>
      </dl>
      <div class="actions">
        <button class="primary" data-open-contract="${contract.id}" type="button">Open Contract</button>
        ${state.user.role==="APPROVER" ? `<button class="danger" data-delete-contract="${contract.id}" type="button"> Delete </button> ` :""}
      </div>
    </article>
  `;
}

async function renderContractDetail() {
  const { contracts } = await api("/api/contracts");
  const contract = contracts.find((item) => item.id === state.selectedContractId);
  if (!contract) {
    state.selectedContractId = null;
    await refresh();
    return;
  }

  if (state.user.role === "CREATOR") {
    await renderCreatorContract(contract);
  } else if (state.user.role === "APPROVER") {
    await renderApproverContract(contract);
  } else {
    renderViewerContract(contract);
  }
}

async function renderCreatorContract(contract) {
  const { tariffs } = await api(`/api/tariffs?contractId=${contract.id}`);
  const formData = state.editing ?? {
    contract_id: contract.id,
    container_size: "20FT",
    move_type: "IMPORT",
    currency: "USD",
    price: 1000,
    valid_from: contract.valid_from,
    valid_until: contract.valid_until
  };

  el.workspace.innerHTML = `
    ${contractHeader(contract)}
    <section class="panel">
      <h2>${state.editing ? "Edit Tariff" : "Create Tariff"}</h2>
      <form id="tariffForm" class="form-grid">
        ${selectField("container_size", "Container Size", formData.container_size)}
        ${selectField("move_type", "Move Type", formData.move_type)}
        ${selectField("currency", "Currency", formData.currency)}
        <label>Price
          <input name="price" type="number" min="1" step="0.01" value="${formData.price}" required />
        </label>
        <label>Valid From
          <input name="valid_from" type="date" value="${formData.valid_from}" required />
        </label>
        <label>Valid Until
          <input name="valid_until" type="date" value="${formData.valid_until}" required />
        </label>
        <div class="actions full">
          <button class="primary" type="submit">${state.editing ? "Save Changes" : "Create Draft"}</button>
          ${state.editing ? `<button class="secondary" id="cancelEdit" type="button">Cancel</button>` : ""}
        </div>
      </form>
    </section>
    <section class="panel">
      <h2>Tariffs in This Contract</h2>
      ${tariffTable(tariffs, "creator")}
    </section>
  `;

  document.querySelector("#backToContracts").addEventListener("click", goBackToContracts);
  document.querySelector("#tariffForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    try {
      if (state.editing) {
        await api(`/api/tariffs/${state.editing.id}`, { method: "PATCH", body: data });
        state.editing = null;
        showAlert("Tariff updated.");
      } else {
        await api(`/api/contracts/${contract.id}/tariffs`, { method: "POST", body: data });
        showAlert("Draft tariff created.");
      }
      await refresh();
    } catch (error) {
      showAlert(error.message, true);
    }
  });

  document.querySelector("#cancelEdit")?.addEventListener("click", async () => {
    state.editing = null;
    await refresh();
  });

  bindTariffActions(tariffs);
}

async function renderApproverContract(contract) {
  const { tariffs } = await api(`/api/tariffs?contractId=${contract.id}&status=PENDING`);
  el.workspace.innerHTML = `
    ${contractHeader(contract)}
    <section class="panel">
      <h2>Pending Tariffs in This Contract</h2>
      <p class="muted">Approval runs overlap validation. Rejection requires a reason.</p>
      ${tariffTable(tariffs, "approver")}
    </section>
  `;
  document.querySelector("#backToContracts").addEventListener("click", goBackToContracts);
  bindTariffActions(tariffs);
}

function renderViewerContract(contract) {
  el.workspace.innerHTML = `
    ${contractHeader(contract)}
    <section class="panel">
      <h2>Approved Tariffs</h2>
      ${tariffTable(contract.tariffs, "viewer")}
    </section>
  `;
  document.querySelector("#backToContracts").addEventListener("click", goBackToContracts);
}

function contractHeader(contract) {
  return `
    <section class="panel contract-hero">
      <button id="backToContracts" class="secondary" type="button">Back to Contracts</button>
      <div>
        <h2>${contract.name}</h2>
        <p>${contract.description ?? ""}</p>
        <span class="muted">${contract.valid_from} to ${contract.valid_until}</span>
      </div>
    </section>
  `;
}

async function goBackToContracts() {
  state.selectedContractId = null;
  state.editing = null;
  await refresh();
}

async function renderDashboard() {
  try {
    const { dashboard } = await api("/api/dashboard");
    if (state.user.role === "VIEWER") {
      renderViewerDashboard(dashboard);
      return;
    }
    el.dashboard.innerHTML = `
      <section class="cards">
        ${Object.entries(dashboard.byStatus).map(([label, count]) => metric(label, count)).join("")}
      </section>
      <section class="panel">
        <h2>Tariffs by Move Type</h2>
        ${barChart(dashboard.byMoveType)}
      </section>
      <section class="panel">
        <h2>Breakdowns</h2>
        <div class="cards">
          <div>${miniTable("Currency", dashboard.byCurrency)}</div>
          <div>${miniTable("Move Type", dashboard.byMoveType)}</div>
        </div>
      </section>
    `;
  } catch (error) {
    state.view = "contracts";
    showAlert(error.message, true);
    await refresh();
  }
}

function renderViewerDashboard(dashboard) {
  el.dashboard.innerHTML = `
    <section class="cards">
      ${metric("Approved Tariffs", dashboard.approvedTariffs)}
      ${metric("Active Contracts", dashboard.activeContracts)}
      ${metric("Currencies Used", dashboard.currenciesUsed)}
      ${metric("Average Price", formatPlainCurrency(dashboard.averagePrice))}
    </section>
    <section class="panel">
      <h2>Tariffs by Move Type</h2>
      ${barChart(dashboard.byMoveType)}
    </section>
    <section class="dashboard-grid">
      <section class="panel">
        <h2>Currency Distribution</h2>
        ${pieChart(dashboard.byCurrency)}
      </section>
      <section class="panel">
        <h2>Container Size Distribution</h2>
        ${pieChart(dashboard.byContainerSize)}
      </section>
    </section>
    <section class="panel">
      <h2>Approved Tariffs by Contract</h2>
      ${horizontalBarChart(dashboard.byContract)}
    </section>
  `;
}

function tariffTable(tariffs, mode) {
  if (!tariffs.length) return `<p class="muted">No tariffs to show.</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Size</th>
            ${mode === "approver" ? "<th>Creator</th>" : ""}
            <th>Move</th>
            <th>Currency</th>
            <th>Price</th>
            <th>Validity</th>
            <th>Status</th>
            ${mode !== "viewer" ? "<th>Reason</th>" : ""}
            ${mode !== "viewer" ? "<th>Actions</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${tariffs.map((tariff) => `
            <tr>
              <td>${tariff.container_size}</td>
              ${mode === "approver" ? `<td>${tariff.creator?.name ?? "-"}</td>`: ""}
              <td>${tariff.move_type}</td>
              <td>${tariff.currency}</td>
              <td>${formatPrice(tariff)}</td>
              <td>${tariff.valid_from} to ${tariff.valid_until}</td>
              <td><span class="status ${tariff.status}">${tariff.status}</span></td>
              ${mode !== "viewer" ? `<td>${tariff.rejection_reason || "-"}</td>` : ""}
              ${mode !== "viewer" ? `<td>${rowActions(tariff, mode)}</td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function rowActions(tariff, mode) {
  if (mode === "creator") {
    const editable = ["DRAFT", "REJECTED"].includes(tariff.status);
    if (!editable) return `<span class="muted">No action</span>`;
    return `
      <div class="actions">
        <button class="secondary" data-action="edit" data-id="${tariff.id}" type="button">Edit</button>
        <button class="primary" data-action="submit" data-id="${tariff.id}" type="button">Submit</button>
      </div>
    `;
  }
  return `
    <div class="actions">
      <button class="primary" data-action="approve" data-id="${tariff.id}" type="button">Approve</button>
      <button class="danger" data-action="reject" data-id="${tariff.id}" type="button">Reject</button>
    </div>
  `;
}

function bindTariffActions(tariffs) {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const tariff = tariffs.find((item) => item.id === button.dataset.id);
      try {
        if (button.dataset.action === "edit") {
          state.editing = { ...tariff };
          await refresh();
          return;
        }
        if (button.dataset.action === "submit") {
          await api(`/api/tariffs/${tariff.id}/submit`, { method: "POST" });
          showAlert("Tariff submitted for approval.");
        }
        if (button.dataset.action === "approve") {
          await api(`/api/tariffs/${tariff.id}/approve`, { method: "POST" });
          showAlert("Tariff approved.");
        }
        if (button.dataset.action === "reject") {
          openRejectModal(tariff.id);
          return;
        }
        await refresh();
      } catch (error) {
        showAlert(error.message, true);
      }
    });
  });
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.price = Number(data.price);
  return data;
}

function readPlainForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function selectField(name, label, value) {
  return `
    <label>${label}
      <select name="${name}">
        ${OPTIONS[name].map((item) => `<option value="${item}" ${item === value ? "selected" : ""}>${item}</option>`).join("")}
      </select>
    </label>
  `;
}

function metric(label, count) {
  return `<div class="metric"><span>${label}</span><strong>${count}</strong></div>`;
}

function barChart(data) {
  const max = Math.max(1, ...Object.values(data));
  return `
    <div class="chart">
      ${Object.entries(data).map(([label, count]) => `
        <div class="bar">
          <div class="bar-fill" style="height:${Math.max(6, (count / max) * 180)}px"></div>
          <strong>${label}</strong>
          <span>${count}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function horizontalBarChart(data) {
  const entries = Object.entries(data);
  if (!entries.length) return `<p class="muted">No approved tariffs available.</p>`;
  const max = Math.max(1, ...entries.map(([, count]) => count));
  return `
    <div class="horizontal-chart">
      ${entries.map(([label, count]) => `
        <div class="hbar-row">
          <span>${label}</span>
          <div class="hbar-track"><div class="hbar-fill" style="width:${(count / max) * 100}%"></div></div>
          <strong>${count}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function pieChart(data) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (!total) return `<p class="muted">No approved tariffs available.</p>`;
  let cursor = 0;
  const colors = ["#1f6f5d", "#2b7c92", "#b7791f", "#8d5a97", "#4f6f9f"];
  const slices = entries.map(([, count], index) => {
    const start = cursor;
    cursor += (count / total) * 100;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return `
    <div class="pie-wrap">
      <div class="pie" style="background: conic-gradient(${slices.join(", ")})"></div>
      <div class="legend">
        ${entries.map(([label, count], index) => `
          <div><span style="background:${colors[index % colors.length]}"></span>${label} (${count})</div>
        `).join("")}
      </div>
    </div>
  `;
}

function miniTable(title, data) {
  return `
    <h3>${title}</h3>
    <table>
      <tbody>
        ${Object.entries(data).map(([label, count]) => `<tr><td>${label}</td><td>${count}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function formatPrice(tariff) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: tariff.currency,
    maximumFractionDigits: 2
  }).format(tariff.price);
}

function formatPlainCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

async function api(path, options = {}) {
  const headers = { "content-type": "application/json" };
  if (state.user && !options.userOptional) headers["x-user-id"] = state.user.id;
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload;
}

function showAlert(text, isError = false) {
  el.alertTitle.textContent = isError ? "Action blocked" : "Success";
  el.alertText.textContent = text;
  const icon = el.alertModal.querySelector(".modal-icon");
  icon.textContent = isError ? "!" : "✓";
  icon.classList.toggle("error", isError);
  el.alertModal.classList.remove("hidden");
}

function closeAlert() {
  el.alertModal.classList.add("hidden");
}

function openRejectModal(tariffId) {
  state.rejectingTariffId = tariffId;
  el.rejectReason.value = "";
  el.rejectModal.classList.remove("hidden");
  el.rejectReason.focus();
}

function closeRejectModal() {
  state.rejectingTariffId = null;
  el.rejectModal.classList.add("hidden");
}

function openContractModal() {
  el.contractForm.reset();
  el.contractModal.classList.remove("hidden");
  el.contractForm.elements.name.focus();
}

function closeContractModal() {
  el.contractModal.classList.add("hidden");
}

function openDeleteModal(contractId){

  state.deletingContractId = contractId;

  el.deleteModal.classList.remove(
    "hidden"
  );

}

function closeDeleteModal(){

  state.deletingContractId = null;

  el.deleteModal.classList.add(
    "hidden"
  );

}

async function confirmDeleteContract(){
  if(!state.deletingContractId){
    return;
  }
  try{

    await api(

      `/api/contracts/${state.deletingContractId}`,

      {

        method:"DELETE"

      }

    );

    closeDeleteModal();

    showAlert(

      "Contract deleted."

    );

    await refresh();

  }

  catch(error){

    showAlert(

      error.message,

      true

    );

  }

}
