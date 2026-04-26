const STORAGE_KEY = "runbook_demo2_state_v1";

const steps = [
  { id: "add_collection", label: "Add first product collection" },
  { id: "configure_sku", label: "Configure SKU inventory thresholds" },
  { id: "connect_payment", label: "Connect payment processor" },
  { id: "set_tax", label: "Set tax region defaults" },
  { id: "create_zone", label: "Create shipping zone and carrier rule" },
  { id: "set_expedite", label: "Configure expedited shipping surcharge" },
  { id: "enable_returns", label: "Enable returns eligibility policy" },
  { id: "returns_sla", label: "Define returns SLA thresholds" },
  { id: "create_discount", label: "Create first discount campaign" },
  { id: "configure_abandon", label: "Configure cart abandonment automation" },
  { id: "setup_escalation", label: "Add support escalation path" },
  { id: "invite_ops", label: "Invite operations manager role" },
  { id: "simulate_launch", label: "Run launch readiness simulation" },
  { id: "final_gate", label: "Pass all launch gating checks" },
];

const baseState = {
  completed: {},
  collectionsAdded: 0,
  paymentConnected: false,
  taxConfigured: false,
  zoneConfigured: false,
  expediteConfigured: false,
  returnsEnabled: false,
  returnsSlaConfigured: false,
  campaignCreated: false,
  abandonConfigured: false,
  escalationConfigured: false,
  opsInvited: false,
  launchSimulated: false,
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...baseState, completed: {} };
    const parsed = JSON.parse(raw);
    return { ...baseState, ...parsed, completed: parsed.completed || {} };
  } catch {
    return { ...baseState, completed: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function goToView(view) {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((el) => {
    el.classList.toggle("active", el.dataset.view === view);
  });
}

function completeStep(stepId) {
  state.completed[stepId] = true;
  saveState();
  renderOnboarding();
  renderLaunchGates();
  renderLaunchScore();
}

function isStepComplete(stepId) {
  return Boolean(state.completed[stepId]);
}

function getUnlockedIndex() {
  for (let i = 0; i < steps.length; i += 1) {
    if (!isStepComplete(steps[i].id)) return i;
  }
  return steps.length;
}

function renderOnboarding() {
  const container = document.getElementById("onboardingSteps");
  if (!container) return;
  const unlocked = getUnlockedIndex();
  container.innerHTML = "";
  steps.forEach((step, index) => {
    const li = document.createElement("li");
    li.textContent = step.label;
    if (isStepComplete(step.id)) li.classList.add("step-complete");
    else if (index === unlocked) li.classList.add("step-active");
    else if (index > unlocked) li.classList.add("step-locked");
    container.appendChild(li);
  });
  const done = steps.filter((s) => isStepComplete(s.id)).length;
  const progressText = document.getElementById("onboardingProgressText");
  if (progressText) progressText.textContent = `${done} / ${steps.length} complete`;
}

function launchScore() {
  const done = steps.filter((s) => isStepComplete(s.id)).length;
  return Math.round((done / steps.length) * 100);
}

function renderLaunchScore() {
  const score = launchScore();
  const launchScoreText = document.getElementById("launchScoreText");
  const launchScoreBadge = document.getElementById("launchScoreBadge");
  const launchProgress = document.getElementById("launchProgress");
  if (launchScoreText) launchScoreText.textContent = `${score}%`;
  if (launchScoreBadge) launchScoreBadge.textContent = `${score}%`;
  if (launchProgress) launchProgress.style.width = `${score}%`;
}

function renderLaunchGates() {
  const gateList = document.getElementById("launchGateList");
  if (!gateList) return;
  const gates = [
    ["Catalog baseline configured", isStepComplete("configure_sku")],
    ["Payments and tax ready", isStepComplete("connect_payment") && isStepComplete("set_tax")],
    ["Shipping rules complete", isStepComplete("create_zone") && isStepComplete("set_expedite")],
    ["Returns + support path active", isStepComplete("enable_returns") && isStepComplete("setup_escalation")],
    ["Team and marketing ready", isStepComplete("invite_ops") && isStepComplete("create_discount") && isStepComplete("configure_abandon")],
  ];
  const finalPassed = gates.every((g) => g[1]);
  if (finalPassed) completeStep("final_gate");
  gateList.innerHTML = gates
    .map(([label, ok]) => `<li>${ok ? "PASS" : "PENDING"} - ${label}</li>`)
    .join("");
}

function renderPersistentPanels() {
  const paymentStatus = document.getElementById("paymentStatus");
  const chargebackStatus = document.getElementById("chargebackStatus");
  const payoutStatus = document.getElementById("payoutStatus");
  if (paymentStatus) paymentStatus.textContent = state.paymentConnected ? "Connected (Stripe)" : "Disconnected";
  if (chargebackStatus) chargebackStatus.textContent = state.paymentConnected ? "Active" : "Inactive";
  if (payoutStatus) payoutStatus.textContent = state.paymentConnected ? "Daily @ 02:00 UTC" : "Not configured";

  const zone = document.getElementById("shippingZoneState");
  if (zone) zone.textContent = state.zoneConfigured ? "Zone: North America | Carrier: FastShip Ground | SLA: 2-4 days" : "No custom shipping zones yet.";

  const expedite = document.getElementById("expediteValue");
  if (expedite) expedite.textContent = state.expediteConfigured ? "$12 surcharge + 1-day SLA" : "Not configured";

  const returns = document.getElementById("returnsPolicyStatus");
  if (returns) returns.textContent = state.returnsEnabled ? "Enabled (30-day window)" : "Disabled";

  const inspection = document.getElementById("inspectionSla");
  const refund = document.getElementById("refundSla");
  const escalation = document.getElementById("escalationSla");
  if (inspection) inspection.textContent = state.returnsSlaConfigured ? "24 hours" : "Not set";
  if (refund) refund.textContent = state.returnsSlaConfigured ? "48 hours" : "Not set";
  if (escalation) escalation.textContent = state.returnsSlaConfigured ? "Escalate after 72 hours" : "Not set";

  const abandon = document.getElementById("abandonStatus");
  if (abandon) abandon.textContent = state.abandonConfigured ? "Active (45m email + 4h SMS)" : "Not configured";

  const escalationPathStatus = document.getElementById("escalationPathStatus");
  if (escalationPathStatus) escalationPathStatus.textContent = state.escalationConfigured ? "L1 Support -> Ops Lead -> Fulfillment Eng" : "Not configured";
}

function addCatalogRow() {
  const body = document.getElementById("catalogTableBody");
  if (!body) return;
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>Launch Bundle ${state.collectionsAdded}</td><td>${36 + state.collectionsAdded * 4}</td><td>${31 + state.collectionsAdded}%</td><td>Draft</td>`;
  body.appendChild(tr);
}

function updateTaxTable() {
  const body = document.getElementById("taxTableBody");
  if (!body) return;
  body.innerHTML = `
    <tr><td>United States</td><td>8.25%</td><td>Configured</td></tr>
    <tr><td>European Union</td><td>19%</td><td>Configured</td></tr>
  `;
}

function updateCampaignList() {
  const list = document.getElementById("campaignList");
  if (!list) return;
  list.innerHTML = "";
  const items = [
    state.campaignCreated ? "Launch-Week Discount: 15% for first order" : "No active discount campaigns yet.",
    state.abandonConfigured ? "Cart Recovery: email at 45m, SMS at 4h" : "Cart recovery flow not configured.",
  ];
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function maybeCompleteFinalSteps() {
  if (state.launchSimulated) completeStep("simulate_launch");
  renderLaunchGates();
}

function bindActions() {
  document.getElementById("addCollectionBtn")?.addEventListener("click", () => {
    state.collectionsAdded += 1;
    addCatalogRow();
    completeStep("add_collection");
    toast("Collection added.");
  });

  document.getElementById("configureSkuBtn")?.addEventListener("click", () => {
    document.getElementById("lowStockValue").textContent = "12 units";
    document.getElementById("leadDaysValue").textContent = "9 days";
    document.getElementById("supplierSlaValue").textContent = "95% on-time";
    completeStep("configure_sku");
    toast("SKU thresholds configured.");
  });

  document.getElementById("connectPaymentsBtn")?.addEventListener("click", () => {
    state.paymentConnected = true;
    renderPersistentPanels();
    completeStep("connect_payment");
    toast("Payment processor connected.");
  });

  document.getElementById("setTaxDefaultsBtn")?.addEventListener("click", () => {
    state.taxConfigured = true;
    updateTaxTable();
    completeStep("set_tax");
    toast("Tax defaults saved.");
  });

  document.getElementById("createZoneBtn")?.addEventListener("click", () => {
    state.zoneConfigured = true;
    renderPersistentPanels();
    completeStep("create_zone");
    toast("Shipping zone created.");
  });

  document.getElementById("setExpediteBtn")?.addEventListener("click", () => {
    state.expediteConfigured = true;
    renderPersistentPanels();
    completeStep("set_expedite");
    toast("Expedited surcharge configured.");
  });

  document.getElementById("enableReturnsBtn")?.addEventListener("click", () => {
    state.returnsEnabled = true;
    renderPersistentPanels();
    completeStep("enable_returns");
    toast("Returns policy enabled.");
  });

  document.getElementById("createDiscountBtn")?.addEventListener("click", () => {
    state.campaignCreated = true;
    updateCampaignList();
    completeStep("create_discount");
    toast("Discount campaign created.");
  });

  document.getElementById("configureAbandonBtn")?.addEventListener("click", () => {
    state.abandonConfigured = true;
    updateCampaignList();
    completeStep("configure_abandon");
    toast("Abandonment automation active.");
  });

  document.getElementById("setupEscalationBtn")?.addEventListener("click", () => {
    state.escalationConfigured = true;
    renderPersistentPanels();
    completeStep("setup_escalation");
    toast("Escalation path set.");
  });

  document.getElementById("inviteOpsBtn")?.addEventListener("click", () => {
    if (!state.opsInvited) {
      const teamBody = document.getElementById("teamTableBody");
      const tr = document.createElement("tr");
      tr.innerHTML = "<td>Jordan Patel</td><td>Operations Manager</td><td>Launch approvals, shipping overrides, returns escalation</td>";
      teamBody?.appendChild(tr);
    }
    state.opsInvited = true;
    completeStep("invite_ops");
    toast("Operations manager invited.");
  });

  document.getElementById("runLaunchSimBtn")?.addEventListener("click", () => {
    state.launchSimulated = true;
    completeStep("simulate_launch");
    maybeCompleteFinalSteps();
    toast("Launch simulation complete.");
  });

  document.getElementById("cmdPaletteBtn")?.addEventListener("click", () => {
    toast("Quick actions: Add collection | Connect payments | Run launch simulation");
  });

  document.getElementById("simulateDayBtn")?.addEventListener("click", () => {
    const orders = document.getElementById("ordersWaiting");
    const returns = document.getElementById("returnsPending");
    const timeline = document.getElementById("timelineList");
    if (orders) orders.textContent = String(12 + Math.floor(Math.random() * 15));
    if (returns) returns.textContent = String(3 + Math.floor(Math.random() * 7));
    if (timeline) {
      const li = document.createElement("li");
      li.textContent = "Auto-generated: flash-sale demand spike forecast updated";
      timeline.prepend(li);
    }
    if (state.returnsEnabled && !state.returnsSlaConfigured) {
      state.returnsSlaConfigured = true;
      completeStep("returns_sla");
      renderPersistentPanels();
      toast("Returns SLA thresholds auto-populated from historical data.");
    } else {
      toast("Daily simulation refreshed.");
    }
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => goToView(btn.dataset.view || "home"));
  });

  document.querySelector('[data-action="timeline-refresh"]')?.addEventListener("click", () => {
    toast("Timeline synchronized with operations events.");
  });
}

function init() {
  bindActions();
  renderOnboarding();
  renderPersistentPanels();
  updateCampaignList();
  if (state.taxConfigured) updateTaxTable();
  for (let i = 1; i <= state.collectionsAdded; i += 1) addCatalogRow();
  maybeCompleteFinalSteps();
  renderLaunchScore();
  saveState();
}

init();
