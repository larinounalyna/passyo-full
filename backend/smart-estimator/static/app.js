// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const API_BASE = 'http://localhost:8002/api/v2';

const state = {
    currentStep: 1,
    uploadType: 'bim', // 'bim' or 'pdf'
    uploading: false,
    fileData: null,
    components: [],
    wizardSettings: {},
    estimationResults: null,
    charts: {},
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
    setupUploadListeners();
    setupSearchListeners();
});

// ============================================================================
// STEPPER NAVIGATION
// ============================================================================

function goToStep(step) {
    state.currentStep = step;

    // Update stepper UI
    document.querySelectorAll('.step-item').forEach(item => {
        const s = parseInt(item.dataset.step);
        item.classList.remove('active', 'completed');
        if (s === step) item.classList.add('active');
        else if (s < step) item.classList.add('completed');
    });

    document.querySelectorAll('.step-connector').forEach((conn, idx) => {
        conn.classList.toggle('completed', idx + 1 < step);
    });

    // Show/hide content
    document.querySelectorAll('.step-content').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');
}

// Make stepper items clickable
document.addEventListener('click', function (e) {
    const stepItem = e.target.closest('.step-item');
    if (stepItem) {
        const step = parseInt(stepItem.dataset.step);
        goToStep(step);
    }
});

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

function setupUploadListeners() {
    // BIM upload zone
    const bimZone = document.getElementById('uploadZoneBIM');
    const bimInput = document.getElementById('fileInputBIM');
    if (bimZone && bimInput) {
        bimZone.addEventListener('click', () => bimInput.click());
        bimZone.addEventListener('dragover', e => { e.preventDefault(); bimZone.classList.add('dragover'); });
        bimZone.addEventListener('dragleave', () => bimZone.classList.remove('dragover'));
        bimZone.addEventListener('drop', e => {
            e.preventDefault();
            bimZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
        });
        bimInput.addEventListener('change', e => {
            if (e.target.files.length > 0) uploadFile(e.target.files[0]);
        });
    }

    // PDF upload zone
    const pdfZone = document.getElementById('uploadZonePDF');
    const pdfInput = document.getElementById('fileInputPDF');
    if (pdfZone && pdfInput) {
        pdfZone.addEventListener('click', () => pdfInput.click());
        pdfZone.addEventListener('dragover', e => { e.preventDefault(); pdfZone.classList.add('dragover'); });
        pdfZone.addEventListener('dragleave', () => pdfZone.classList.remove('dragover'));
        pdfZone.addEventListener('drop', e => {
            e.preventDefault();
            pdfZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
        });
        pdfInput.addEventListener('change', e => {
            if (e.target.files.length > 0) uploadFile(e.target.files[0]);
        });
    }
}

function selectUploadType(type) {
    state.uploadType = type;

    // Update button styles
    document.querySelectorAll('.upload-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // Show/hide upload zones and PDF metadata
    const bimZone = document.getElementById('uploadZoneBIM');
    const pdfZone = document.getElementById('uploadZonePDF');
    const pdfMeta = document.getElementById('pdfMetaFields');
    const chooseBtn = document.getElementById('chooseFileBtn');

    if (type === 'pdf') {
        if (bimZone) bimZone.style.display = 'none';
        if (pdfZone) pdfZone.style.display = '';
        if (pdfMeta) pdfMeta.style.display = 'block';
        if (chooseBtn) chooseBtn.onclick = () => document.getElementById('fileInputPDF').click();
    } else {
        if (bimZone) bimZone.style.display = '';
        if (pdfZone) pdfZone.style.display = 'none';
        if (pdfMeta) pdfMeta.style.display = 'none';
        if (chooseBtn) chooseBtn.onclick = () => document.getElementById('fileInputBIM').click();
    }
}

function uploadFile(file) {
    // Prevent double uploads
    if (state.uploading) {
        showToast('Import en cours, veuillez patienter...', 'warning');
        return;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();

    // Handle .rvt and .pln - show export guidance instead of uploading
    if (ext === '.rvt') {
        showExportGuidance('Revit', 'Fichier > Exporter > IFC', '.rvt');
        return;
    }
    if (ext === '.pln') {
        showExportGuidance('ArchiCAD', 'Fichier > Enregistrer sous > IFC', '.pln');
        return;
    }

    // Determine endpoint and validate
    let endpoint;
    if (ext === '.pdf') {
        if (state.uploadType !== 'pdf') {
            showToast('Passez en mode PDF pour importer des fichiers PDF.', 'warning');
            return;
        }
        endpoint = `${API_BASE}/upload/pdf-file`;
    } else {
        const validExtensions = ['.ifc', '.xlsx', '.xls'];
        if (!validExtensions.includes(ext)) {
            showToast('Type de fichier invalide. Formats supportés : IFC (.ifc), Excel (.xlsx), PDF (.pdf)', 'error');
            return;
        }
        endpoint = `${API_BASE}/upload/bim-file`;
    }

    // Start upload with loading state
    state.uploading = true;
    setUploadLoading(true, file.name);

    const formData = new FormData();
    formData.append('file', file);

    fetch(endpoint, { method: 'POST', body: formData })
        .then(r => {
            if (!r.ok) {
                return r.json().catch(() => ({ detail: `Erreur serveur (${r.status})` })).then(d => {
                    throw new Error(d.detail || d.error || `Échec de l'import (${r.status})`);
                });
            }
            return r.json();
        })
        .then(data => {
            if (data.status === 'success') {
                // Attach PDF metadata to file data and components
                if (ext === '.pdf') {
                    const planType = document.getElementById('pdfPlanType')?.value || 'tous';
                    const floorLevel = document.getElementById('pdfFloorLevel')?.value || '';
                    data.plan_type = planType;
                    data.floor_level = floorLevel;
                    // Tag each component with plan metadata
                    if (data.components) {
                        data.components.forEach(c => {
                            if (planType !== 'tous') c.plan_type = planType;
                            if (floorLevel) c.floor_level = floorLevel;
                        });
                    }
                }
                state.fileData = data;
                state.components = (data.components || []).map((c, i) => ({ ...c, _idx: i }));
                renderComponents();
                updateValidationBanner();
                showToast(`${data.total_components} composants extraits de ${data.filename || file.name}`, 'success');
                goToStep(2);
            } else {
                showToast(data.detail || data.message || data.error || 'Erreur lors de l\'analyse du fichier', 'error');
            }
        })
        .catch(err => {
            showToast('Erreur d\'import : ' + err.message, 'error', 6000);
        })
        .finally(() => {
            state.uploading = false;
            setUploadLoading(false);
            // Reset file inputs so the same file can be re-selected
            const bimInput = document.getElementById('fileInputBIM');
            const pdfInput = document.getElementById('fileInputPDF');
            if (bimInput) bimInput.value = '';
            if (pdfInput) pdfInput.value = '';
        });
}

function setUploadLoading(loading, filename) {
    const chooseBtn = document.getElementById('chooseFileBtn');
    const zones = [document.getElementById('uploadZoneBIM'), document.getElementById('uploadZonePDF')];

    if (loading) {
        if (chooseBtn) {
            chooseBtn.disabled = true;
            chooseBtn.textContent = 'Import en cours...';
        }
        zones.forEach(zone => {
            if (zone && zone.style.display !== 'none') {
                zone.classList.add('uploading');
                const text = zone.querySelector('.upload-text');
                if (text) text.textContent = `Analyse de ${filename}...`;
            }
        });
    } else {
        if (chooseBtn) {
            chooseBtn.disabled = false;
            chooseBtn.textContent = 'Choisir un Fichier';
        }
        zones.forEach(zone => {
            if (zone) {
                zone.classList.remove('uploading');
                const text = zone.querySelector('.upload-text');
                if (text) text.textContent = zone.id.includes('PDF')
                    ? 'Glissez-déposez votre fichier PDF ici'
                    : 'Glissez-déposez votre fichier BIM ici';
            }
        });
    }
}

function showExportGuidance(software, exportPath, ext) {
    const uploadZone = document.getElementById('uploadZone');
    if (!uploadZone) return;

    uploadZone.innerHTML = `
        <div class="export-guidance">
            <div class="guidance-icon">⚠️</div>
            <h3>Les fichiers ${software} (${ext}) doivent être exportés en IFC</h3>
            <div class="guidance-steps">
                <p><strong>Comment exporter :</strong></p>
                <ol>
                    <li>Ouvrez votre modèle dans ${software}</li>
                    <li>Allez dans <strong>${exportPath}</strong></li>
                    <li>Choisissez le format IFC et exportez</li>
                    <li>Importez le fichier <strong>.ifc</strong> exporté ici</li>
                </ol>
            </div>
            <button class="btn btn-primary" onclick="resetUploadZone()" style="margin-top:1rem">Importer un Fichier IFC</button>
        </div>
    `;
}

function resetUploadZone() {
    const uploadZone = document.getElementById('uploadZoneBIM');
    if (!uploadZone) return;

    uploadZone.innerHTML = `
        <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <p class="upload-text">Glissez-déposez votre fichier BIM ici</p>
        <p class="upload-hint">Formats supportés : IFC (.ifc), Excel (.xlsx)</p>
        <p class="upload-hint" style="font-size: 0.8rem; color: var(--text-muted);">Les fichiers Revit (.rvt) et ArchiCAD (.pln) doivent être exportés en IFC.</p>
        <input type="file" id="fileInputBIM" hidden accept=".ifc,.xlsx,.xls,.rvt,.pln">
    `;

    // Re-attach file input listener
    const fileInput = document.getElementById('fileInputBIM');
    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) uploadFile(e.target.files[0]);
    });
    selectUploadType('bim');
    fileInput.click();
}

// ============================================================================
// VALIDATION BANNER
// ============================================================================

function updateValidationBanner() {
    const banner = document.getElementById('validationBanner');
    if (!banner) return;

    const invalidQty = state.components.filter(c => !c.quantity || c.quantity <= 0).length;
    const missingDesc = state.components.filter(c => !c.description || c.description.trim() === '').length;

    const issues = [];
    if (invalidQty > 0) issues.push(`${invalidQty} composant(s) avec des quantités invalides`);
    if (missingDesc > 0) issues.push(`${missingDesc} composant(s) sans désignation`);

    if (issues.length > 0) {
        banner.style.display = 'block';
        banner.className = 'validation-banner warning';
        banner.innerHTML = `<strong>Attention :</strong> ${issues.join(', ')}. Vérifiez et corrigez avant de continuer.`;
    } else {
        banner.style.display = 'block';
        banner.className = 'validation-banner success';
        banner.innerHTML = `<strong>Données validées.</strong> ${state.components.length} composants prêts pour l'estimation.`;
    }
}

// ============================================================================
// COMPONENTS TABLE (Editable)
// ============================================================================

function setupSearchListeners() {
    const search = document.getElementById('componentSearch');
    const filter = document.getElementById('componentFilter');
    if (search) search.addEventListener('input', renderComponents);
    if (filter) filter.addEventListener('change', renderComponents);
}

function renderComponents() {
    const tbody = document.getElementById('componentsList');
    if (!tbody) return;

    const searchTerm = (document.getElementById('componentSearch')?.value || '').toLowerCase();
    const filterType = document.getElementById('componentFilter')?.value || '';

    const filtered = state.components.filter(c => {
        const matchSearch = !searchTerm ||
            (c.description || '').toLowerCase().includes(searchTerm) ||
            (c.material_code || '').toLowerCase().includes(searchTerm);
        const matchType = !filterType || c.ifc_type === filterType;
        return matchSearch && matchType;
    });

    // Update stats
    const stats = document.getElementById('componentStats');
    if (stats) {
        stats.textContent = `Total : ${state.components.length} | Affichés : ${filtered.length}`;
    }

    tbody.innerHTML = filtered.map((comp, i) => {
        const realIdx = state.components.indexOf(comp);
        return `<tr>
            <td class="desc-cell">
                <input type="text" value="${escapeHtml(comp.description || '')}" onchange="updateComponent(${realIdx}, 'description', this.value)">
            </td>
            <td class="type-cell">
                <input type="text" value="${escapeHtml(comp.ifc_type || '')}" onchange="updateComponent(${realIdx}, 'ifc_type', this.value)" style="font-size:0.8rem">
            </td>
            <td class="num-cell">
                <input type="number" value="${comp.quantity || 0}" min="0" step="0.1" onchange="updateComponent(${realIdx}, 'quantity', parseFloat(this.value))">
            </td>
            <td class="unit-cell">
                <input type="text" value="${comp.unit || 'm3'}" onchange="updateComponent(${realIdx}, 'unit', this.value)" style="width:50px">
            </td>
            <td class="actions-cell">
                <button class="delete-row-btn" onclick="removeComponent(${realIdx})" title="Supprimer">&times;</button>
            </td>
        </tr>`;
    }).join('');

    updateValidationBanner();
}

function updateComponent(idx, field, value) {
    if (idx >= 0 && idx < state.components.length) {
        state.components[idx][field] = value;
    }
}

function removeComponent(idx) {
    state.components.splice(idx, 1);
    renderComponents();
}

function addManualComponent() {
    const newId = `manual_${Date.now()}`;
    state.components.push({
        id: newId,
        ifc_type: 'IfcWall',
        description: 'Nouveau Composant',
        quantity: 1,
        unit: 'm3',
        material_code: 'CUSTOM',
        base_material_price: 0,
        labor_hours_base: 1,
        labor_rate_per_hour: 25,
    });
    renderComponents();
    showToast('Composant ajouté. Remplissez les détails.', 'info');
}

// ============================================================================
// GENERATE ESTIMATE
// ============================================================================

function generateEstimate() {
    if (!state.components.length) {
        showToast('Aucun composant chargé. Veuillez d\'abord importer un fichier.', 'error');
        return;
    }

    showToast('Génération de l\'estimation en cours...', 'info');

    // Read wizard form
    const form = document.getElementById('wizardForm');
    const formData = new FormData(form);

    const mappedComponents = state.components.map((comp, i) => ({
        id: comp.id || `comp_${i}`,
        ifc_type: comp.ifc_type || 'Unknown',
        description: comp.description || 'Composant',
        quantity: parseFloat(comp.quantity) || 1,
        unit: comp.unit || 'm3',
        material_code: comp.material_code || 'STANDARD',
        base_material_price: parseFloat(comp.base_material_price) || 0,
        labor_hours_base: parseFloat(comp.labor_hours_base) || 1,
        labor_rate_per_hour: parseFloat(comp.labor_rate_per_hour) || 25,
    }));

    const payload = {
        project_name: state.fileData?.filename || 'Projet Smart Estimator',
        components: mappedComponents,
        contextual_wizard: {
            equipment_ownership: formData.get('equipment_ownership') || 'rented',
            concrete_method: formData.get('concrete_method') || 'ready_mix',
            site_access: formData.get('site_access') || 'urban',
            soil_type: formData.get('soil_type') || 'mixed',
            utility_access: formData.get('utility_access') || 'full',
            site_distance_km: parseFloat(formData.get('site_distance_km')) || 10,
            site_narrowness: parseFloat(formData.get('site_narrowness')) || 0.5,
            worker_accommodation_available: formData.get('worker_accommodation_available') === 'true',
            total_project_days: parseFloat(formData.get('total_project_days')) || 120,
            daily_worker_count: parseFloat(formData.get('daily_worker_count')) || 20,
        },
    };

    // Add Algerian config if PDF mode (config fields are in Step 1)
    if (state.uploadType === 'pdf') {
        payload.algerian_config = {
            enabled: true,
            floor_height_h: parseFloat(document.getElementById('floor_height_h').value) || 3.0,
            num_levels: parseInt(document.getElementById('num_levels').value) || 1,
            foundation_type: document.getElementById('foundation_type').value || 'isolee',
            slab_type: document.getElementById('slab_type').value || 'creux',
            column_section_width: parseFloat(document.getElementById('column_section_width').value) || 0.30,
            column_section_depth: parseFloat(document.getElementById('column_section_depth').value) || 0.30,
            beam_height: parseFloat(document.getElementById('beam_height').value) || 0.30,
            footing_width: parseFloat(document.getElementById('footing_width').value) || 1.20,
            footing_depth: parseFloat(document.getElementById('footing_depth').value) || 0.40,
            footing_excavation_depth: parseFloat(document.getElementById('footing_excavation_depth').value) || 1.20,
            beton_proprete_thickness: 0.10,
        };
    }

    fetch(`${API_BASE}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
        .then(r => {
            if (!r.ok) return r.json().then(d => { throw new Error(d.detail || d.error || 'Échec de l\'estimation'); });
            return r.json();
        })
        .then(data => {
            state.estimationResults = data;
            showToast('Estimation générée avec succès !', 'success');
            goToStep(4);
            displayResults();
        })
        .catch(err => showToast('Erreur : ' + err.message, 'error'));
}

// ============================================================================
// DISPLAY RESULTS
// ============================================================================

function displayResults() {
    if (!state.estimationResults) return;

    const data = state.estimationResults;
    const summary = data.summary || {};

    try {
        // Summary header
        const finalPrice = parseFloat(summary.final_price) || 0;
        document.getElementById('resultsSummary').textContent =
            `Projet : ${data.project_name} | Réf : ${data.bid_id} | Prix Final : ${formatCurrency(finalPrice)}`;
    } catch (e) { console.error('Erreur rendu en-tête:', e); }

    try {
        renderSummaryCards(summary);
    } catch (e) { console.error('Erreur rendu cartes:', e); }

    try {
        renderCharts(summary, data);
    } catch (e) { console.error('Erreur rendu graphiques:', e); }

    try {
        displayBoQ(data.boq);
    } catch (e) { console.error('Erreur rendu BdQ:', e); }

    // Handle hierarchical BoQ if available
    const toggleContainer = document.getElementById('boqModeToggle');
    if (data.hierarchical_boq) {
        if (toggleContainer) toggleContainer.style.display = 'flex';
        try {
            displayHierarchicalBoQ(data.hierarchical_boq);
            switchBoqView('hierarchical');
        } catch (e) { console.error('Erreur rendu BdQ hiérarchique:', e); }
    } else {
        if (toggleContainer) toggleContainer.style.display = 'none';
        switchBoqView('flat');
    }
}

function renderSummaryCards(summary) {
    const cards = document.getElementById('summaryCards');
    if (!cards) return;

    const matCost = parseFloat(summary.total_material_cost) || 0;
    const labCost = parseFloat(summary.total_labor_cost) || 0;
    const netCost = parseFloat(summary.net_cost) || 0;
    const marginPct = summary.margin_percent || 10;
    const marginAmt = parseFloat(summary.margin_amount) || 0;
    const finalPrice = parseFloat(summary.final_price) || 0;

    const items = [
        {
            label: 'Coût Matériaux',
            value: matCost,
            formula: `Somme de (prix_unitaire × quantité × (1 + déchet%) × coeff_site)\npour chaque composant`,
        },
        {
            label: 'Coût Main-d\'œuvre',
            value: labCost,
            formula: `Somme de (heures × quantité × taux × coeff_étroitesse)\npour chaque composant`,
        },
        {
            label: 'Coût Net',
            value: netCost,
            formula: `Coût Matériaux + Coût Main-d'œuvre\n${formatCurrency(matCost)} + ${formatCurrency(labCost)} = ${formatCurrency(netCost)}`,
        },
        {
            label: `Marge (${marginPct}%)`,
            value: marginAmt,
            formula: `Coût Net × ${marginPct}%\n${formatCurrency(netCost)} × ${marginPct}% = ${formatCurrency(marginAmt)}`,
        },
        {
            label: 'Prix Final',
            value: finalPrice,
            highlight: true,
            formula: `Coût Net + Marge\n${formatCurrency(netCost)} + ${formatCurrency(marginAmt)} = ${formatCurrency(finalPrice)}`,
        },
    ];

    cards.innerHTML = items.map(item => `
        <div class="summary-card ${item.highlight ? 'highlight' : ''}" onclick="this.querySelector('.card-formula').classList.toggle('visible')">
            <div class="card-label">${item.label}</div>
            <div class="card-value">${formatCurrency(item.value)}</div>
            <div class="card-formula">${item.formula}</div>
        </div>
    `).join('');
}

function renderCharts(summary, data) {
    // Destroy existing charts
    Object.values(state.charts).forEach(c => c.destroy && c.destroy());
    state.charts = {};

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js non chargé — graphiques ignorés');
        return;
    }

    // Cost by component type bar chart
    const barCtx = document.getElementById('componentTypeChart');
    if (barCtx && data.boq?.items) {
        const typeCosts = {};
        for (const item of data.boq.items) {
            const type = item.ifc_type || 'Autre';
            typeCosts[type] = (typeCosts[type] || 0) + (parseFloat(item.total_cost) || 0);
        }

        try {
            state.charts.bar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(typeCosts),
                    datasets: [{
                        label: 'Coût Total (DZD)',
                        data: Object.values(typeCosts),
                        backgroundColor: '#3b82f6',
                        borderRadius: 4,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                },
            });
        } catch (e) {
            console.warn('Échec du rendu graphique:', e);
        }
    }
}

// ============================================================================
// BILL OF QUANTITIES
// ============================================================================

function displayBoQ(boqData) {
    const tbody = document.getElementById('boqList');
    if (!tbody || !boqData?.items) return;

    let grandTotal = 0;

    const rows = boqData.items.map((item, idx) => {
        const materialCost = parseFloat(item.material_cost) || 0;
        const laborCost = parseFloat(item.labor_cost) || 0;
        const totalCost = parseFloat(item.total_cost) || 0;
        grandTotal += totalCost;

        const qty = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.material_unit_price) || 0;
        const labHrs = parseFloat(item.labor_hours) || 0;
        const labRate = parseFloat(item.labor_rate) || 0;
        const f = item.formula || {};
        const waste = parseFloat(f.waste_factor) || 0;
        const wastePct = (waste * 100).toFixed(0);
        const siteMult = parseFloat(f.site_multiplier) || 1;
        const transportF = parseFloat(f.transport_factor) || 1;
        const equipF = parseFloat(f.equipment_factor) || 1;
        const utilityF = parseFloat(f.utility_factor) || 1;
        const narrowness = parseFloat(f.narrowness_factor) || 1;
        const soilFactor = parseFloat(f.soil_factor) || 1;
        const concreteF = parseFloat(f.concrete_method_factor) || 1;
        const accomF = parseFloat(f.accommodation_factor) || 1;
        const isFoundation = f.is_foundation || false;

        // Build material formula with active factors
        let matFactors = [`(1 + ${wastePct}% déchet)`];
        if (siteMult !== 1) matFactors.push(`${siteMult}x site`);
        if (transportF !== 1) matFactors.push(`${transportF.toFixed(2)}x transport`);
        if (equipF !== 1) matFactors.push(`${equipF.toFixed(2)}x équipement`);
        if (utilityF !== 1) matFactors.push(`${utilityF.toFixed(2)}x réseaux`);
        let materialFormula = `${formatCurrency(unitPrice)}/${item.unit} × ${qty.toFixed(2)} × ${matFactors.join(' × ')} = ${formatCurrency(materialCost)}`;

        // Build labor formula with active factors
        let labFactors = [];
        if (narrowness !== 1) labFactors.push(`${narrowness.toFixed(2)}x étroitesse`);
        if (isFoundation && soilFactor !== 1) labFactors.push(`${soilFactor.toFixed(1)}x sol`);
        if (concreteF !== 1) labFactors.push(`${concreteF.toFixed(2)}x méthode béton`);
        if (accomF !== 1) labFactors.push(`${accomF.toFixed(2)}x hébergement`);
        let laborFormula = `${labHrs.toFixed(1)} hrs × ${qty.toFixed(2)} × ${formatCurrency(labRate)}/hr`;
        if (labFactors.length > 0) laborFormula += ` × ${labFactors.join(' × ')}`;
        laborFormula += ` = ${formatCurrency(laborCost)}`;

        return `<tr class="boq-row" onclick="document.getElementById('boq-detail-${idx}').classList.toggle('visible')">
            <td>${escapeHtml(item.description)}</td>
            <td style="font-size:0.8rem">${item.ifc_type || ''}</td>
            <td style="text-align:right">${qty.toFixed(2)}</td>
            <td>${item.unit || ''}</td>
            <td style="text-align:right">${formatCurrency(materialCost)}</td>
            <td style="text-align:right">${formatCurrency(laborCost)}</td>
            <td style="text-align:right;font-weight:600">${formatCurrency(totalCost)}</td>
        </tr>
        <tr class="boq-detail-row" id="boq-detail-${idx}">
            <td colspan="7">
                <div class="formula-box">
                    <div class="formula-line"><span class="formula-label">Matériaux :</span> ${materialFormula}</div>
                    <div class="formula-line"><span class="formula-label">Main-d'œuvre :</span> ${laborFormula}</div>
                    <div class="formula-line formula-total"><span class="formula-label">Total :</span> ${formatCurrency(materialCost)} + ${formatCurrency(laborCost)} = ${formatCurrency(totalCost)}</div>
                </div>
            </td>
        </tr>`;
    });

    // Add totals row
    rows.push(`<tr class="total-row" style="font-weight:bold;background:var(--primary-bg)">
        <td colspan="6">TOTAL</td>
        <td style="text-align:right">${formatCurrency(grandTotal)}</td>
    </tr>`);

    tbody.innerHTML = rows.join('');
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

function buildExportHTML() {
    const data = state.estimationResults;
    const summary = data.summary || {};

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>BdQ - ${escapeHtml(data.project_name)}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; font-size: 12px; }
        h1 { text-align: center; margin-bottom: 20px; font-size: 20px; }
        h2 { font-size: 15px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; }
        th { background: #f0f0f0; text-align: left; }
        .right { text-align: right; }
        .total-row { background: #e8f4f8; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 10px; color: #666; }
        @media print { body { margin: 0; } }
    </style></head><body>`;

    html += `<h1>Bordereau des Quantités</h1>`;
    html += `<p><strong>Projet :</strong> ${escapeHtml(data.project_name)}</p>`;
    html += `<p><strong>Réf :</strong> ${data.bid_id}</p>`;
    html += `<p><strong>Généré le :</strong> ${new Date(data.created_at).toLocaleString('fr-FR')}</p>`;
    html += `<hr>`;

    // Summary table
    html += `<h2>Récapitulatif du Projet</h2>`;
    html += `<table>`;
    html += `<tr><td>Coût Matériaux</td><td class="right">${formatCurrency(parseFloat(summary.total_material_cost) || 0)}</td></tr>`;
    html += `<tr><td>Coût Main-d'œuvre</td><td class="right">${formatCurrency(parseFloat(summary.total_labor_cost) || 0)}</td></tr>`;
    html += `<tr><td>Coût Net</td><td class="right">${formatCurrency(parseFloat(summary.net_cost) || 0)}</td></tr>`;
    html += `<tr><td>Marge (${summary.margin_percent || 10}%)</td><td class="right">${formatCurrency(parseFloat(summary.margin_amount) || 0)}</td></tr>`;
    html += `<tr class="total-row"><td>PRIX FINAL</td><td class="right">${formatCurrency(parseFloat(summary.final_price) || 0)}</td></tr>`;
    html += `</table>`;

    // BoQ table
    if (data.boq?.items) {
        html += `<h2>Bordereau Détaillé des Quantités</h2>`;
        html += `<table>`;
        html += `<tr><th>Désignation</th><th>Type</th><th>Qté</th><th>Unité</th><th>Coût Matériaux</th><th>Coût Main-d'œuvre</th><th>Coût Total</th></tr>`;
        let grandTotal = 0;
        for (const item of data.boq.items) {
            const materialCost = parseFloat(item.material_cost) || 0;
            const laborCost = parseFloat(item.labor_cost) || 0;
            const totalCost = parseFloat(item.total_cost) || 0;
            grandTotal += totalCost;
            html += `<tr>
                <td>${escapeHtml(item.description)}</td>
                <td>${item.ifc_type || ''}</td>
                <td class="right">${parseFloat(item.quantity).toFixed(2)}</td>
                <td>${item.unit || ''}</td>
                <td class="right">${formatCurrency(materialCost)}</td>
                <td class="right">${formatCurrency(laborCost)}</td>
                <td class="right">${formatCurrency(totalCost)}</td>
            </tr>`;
        }
        html += `<tr class="total-row"><td colspan="6">TOTAL</td><td class="right">${formatCurrency(grandTotal)}</td></tr>`;
        html += `</table>`;
    }

    // Hierarchical BoQ for export (if available)
    if (data.hierarchical_boq?.chapters) {
        html += `<h2>Bordereau Hiérarchique des Quantités (MétréExpert)</h2>`;
        for (const chapter of Object.values(data.hierarchical_boq.chapters)) {
            const chTotal = parseFloat(chapter.chapter_total) || 0;
            if (chTotal === 0) continue;
            html += `<h3 style="background:#e8f4f8;padding:6px 10px;border-left:4px solid #2563eb">${chapter.number}. ${chapter.title}</h3>`;
            for (const sub of Object.values(chapter.subchapters)) {
                if (sub.items.length === 0) continue;
                html += `<h4 style="margin-left:10px">${chapter.number}.${sub.number} ${sub.title}</h4>`;
                html += `<table><tr><th>Désignation</th><th>Type</th><th>Qté</th><th>Unité</th><th>Matériaux</th><th>Main-d'œuvre</th><th>Total</th></tr>`;
                for (const item of sub.items) {
                    html += `<tr>
                        <td>${escapeHtml(item.description)}</td><td>${item.ifc_type || ''}</td>
                        <td class="right">${parseFloat(item.quantity).toFixed(2)}</td><td>${item.unit || ''}</td>
                        <td class="right">${formatCurrency(parseFloat(item.material_cost) || 0)}</td>
                        <td class="right">${formatCurrency(parseFloat(item.labor_cost) || 0)}</td>
                        <td class="right">${formatCurrency(parseFloat(item.total_cost) || 0)}</td>
                    </tr>`;
                }
                html += `<tr class="total-row"><td colspan="6" style="text-align:right">Sous-total</td><td class="right">${formatCurrency(parseFloat(sub.subtotal) || 0)}</td></tr>`;
                html += `</table>`;
            }
            html += `<p style="text-align:right;font-weight:bold;background:#e8f4f8;padding:6px">Total ${chapter.title} : ${formatCurrency(chTotal)}</p>`;
        }
        html += `<p style="text-align:right;font-weight:bold;font-size:14px;background:#2563eb;color:#fff;padding:10px;border-radius:4px">TOTAL GÉNÉRAL : ${formatCurrency(parseFloat(data.hierarchical_boq.grand_total) || 0)}</p>`;
    }

    html += `<p class="footer">Généré par Smart Estimator v7.0</p>`;
    html += `</body></html>`;
    return html;
}

function exportPDF() {
    if (!state.estimationResults) {
        showToast('Aucun résultat à exporter. Générez d\'abord une estimation.', 'warning');
        return;
    }

    const html = buildExportHTML();

    // Open in new window and trigger print (Save as PDF from print dialog)
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Pop-up bloqué. Veuillez autoriser les pop-ups pour ce site.', 'error');
        return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = function () {
        printWindow.print();
    };

    showToast('Boîte de dialogue d\'impression ouverte — choisissez « Enregistrer en PDF » pour exporter.', 'info', 6000);
}

function exportWord() {
    if (!state.estimationResults) {
        showToast('Aucun résultat à exporter. Générez d\'abord une estimation.', 'warning');
        return;
    }

    const html = buildExportHTML();
    const blob = new Blob([html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bdq-${state.estimationResults.bid_id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Document Word exporté !', 'success');
}

function copyResults() {
    if (!state.estimationResults) {
        showToast('Aucun résultat à copier. Générez d\'abord une estimation.', 'warning');
        return;
    }

    const data = state.estimationResults;
    const summary = data.summary || {};

    // Build readable text
    let text = `Bordereau des Quantités\n`;
    text += `Projet : ${data.project_name}\n`;
    text += `Réf : ${data.bid_id}\n`;
    text += `Date : ${new Date(data.created_at).toLocaleString('fr-FR')}\n\n`;

    text += `--- Récapitulatif ---\n`;
    text += `Coût Matériaux :    ${formatCurrency(parseFloat(summary.total_material_cost) || 0)}\n`;
    text += `Coût Main-d'œuvre : ${formatCurrency(parseFloat(summary.total_labor_cost) || 0)}\n`;
    text += `Coût Net :          ${formatCurrency(parseFloat(summary.net_cost) || 0)}\n`;
    text += `Marge (${summary.margin_percent || 10}%) :     ${formatCurrency(parseFloat(summary.margin_amount) || 0)}\n`;
    text += `PRIX FINAL :        ${formatCurrency(parseFloat(summary.final_price) || 0)}\n\n`;

    if (data.boq?.items) {
        text += `--- Bordereau des Quantités (${data.boq.items.length} éléments) ---\n`;
        let grandTotal = 0;
        for (const item of data.boq.items) {
            const tc = parseFloat(item.total_cost) || 0;
            grandTotal += tc;
            text += `${item.description} | ${item.ifc_type} | ${parseFloat(item.quantity).toFixed(2)} ${item.unit} | ${formatCurrency(tc)}\n`;
        }
        text += `\nTOTAL : ${formatCurrency(grandTotal)}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Résultats copiés dans le presse-papiers !', 'success');
    }).catch(() => {
        // Fallback
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`<pre style="font-family:monospace;padding:20px">${escapeHtml(text)}</pre>`);
            win.document.close();
            showToast('Ouvert dans une nouvelle fenêtre — sélectionnez tout et copiez.', 'info');
        }
    });
}

// ============================================================================
// PDF PLAN TYPE LOGIC
// ============================================================================

function onPlanTypeChange() {
    const planType = document.getElementById('pdfPlanType')?.value || 'tous';
    const structuralFields = document.getElementById('structuralFields');

    if (structuralFields) {
        // Show structural dimension fields only for architecture plans
        // (structural plans already contain this info, it gets extracted from PDF)
        structuralFields.style.display = (planType === 'architecture' || planType === 'tous') ? 'block' : 'none';
    }
}

function switchBoqView(mode) {
    const hierarchical = document.getElementById('hierarchicalBoq');
    const flat = document.getElementById('flatBoq');

    if (mode === 'hierarchical') {
        if (hierarchical) hierarchical.style.display = 'block';
        if (flat) flat.style.display = 'none';
    } else {
        if (hierarchical) hierarchical.style.display = 'none';
        if (flat) flat.style.display = 'block';
    }

    // Update toggle buttons
    document.querySelectorAll('.boq-mode-toggle .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function displayHierarchicalBoQ(hierarchicalData) {
    const container = document.getElementById('hierarchicalBoq');
    if (!container || !hierarchicalData?.chapters) return;

    let html = '';

    for (const [chId, chapter] of Object.entries(hierarchicalData.chapters)) {
        const chapterTotal = parseFloat(chapter.chapter_total) || 0;
        if (chapterTotal === 0) continue; // Skip empty chapters

        html += `<div class="boq-chapter">`;
        html += `<div class="chapter-title">${chapter.number}. ${chapter.title}</div>`;

        for (const [subId, sub] of Object.entries(chapter.subchapters)) {
            const subtotal = parseFloat(sub.subtotal) || 0;
            if (sub.items.length === 0) continue; // Skip empty subchapters

            html += `<div class="boq-subchapter">`;
            html += `<div class="subchapter-title">${chapter.number}.${sub.number} ${sub.title}</div>`;

            html += `<table class="v6-table">`;
            html += `<thead><tr>
                <th>Désignation</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Unité</th>
                <th>Coût Matériaux</th>
                <th>Coût Main-d'œuvre</th>
                <th>Total</th>
            </tr></thead><tbody>`;

            for (const item of sub.items) {
                const matCost = parseFloat(item.material_cost) || 0;
                const labCost = parseFloat(item.labor_cost) || 0;
                const totalCost = parseFloat(item.total_cost) || 0;
                const qty = parseFloat(item.quantity) || 0;

                html += `<tr>
                    <td>${escapeHtml(item.description)}</td>
                    <td style="font-size:0.8rem">${item.ifc_type || ''}</td>
                    <td style="text-align:right">${qty.toFixed(2)}</td>
                    <td>${item.unit || ''}</td>
                    <td style="text-align:right">${formatCurrency(matCost)}</td>
                    <td style="text-align:right">${formatCurrency(labCost)}</td>
                    <td style="text-align:right;font-weight:600">${formatCurrency(totalCost)}</td>
                </tr>`;
            }

            // Subtotal row
            html += `<tr class="subtotal-row">
                <td colspan="6" style="text-align:right">Sous-total ${sub.title}</td>
                <td style="text-align:right">${formatCurrency(subtotal)}</td>
            </tr>`;

            html += `</tbody></table>`;
            html += `</div>`; // .boq-subchapter
        }

        // Chapter total
        html += `<div class="chapter-total">Total ${chapter.title} : ${formatCurrency(chapterTotal)}</div>`;
        html += `</div>`; // .boq-chapter
    }

    // Grand total
    const grandTotal = parseFloat(hierarchicalData.grand_total) || 0;
    html += `<div class="boq-grand-total">TOTAL GÉNÉRAL : ${formatCurrency(grandTotal)}</div>`;

    container.innerHTML = html;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0) + ' DZD';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function resetApp() {
    if (!confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) return;

    state.fileData = null;
    state.components = [];
    state.estimationResults = null;

    // Clear displays
    const ids = ['componentsList', 'boqList', 'summaryCards'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    const banner = document.getElementById('validationBanner');
    if (banner) banner.style.display = 'none';

    // Destroy charts
    Object.values(state.charts).forEach(c => c.destroy && c.destroy());
    state.charts = {};

    goToStep(1);
    showToast('Application réinitialisée. Prêt pour un nouveau projet.', 'info');
}
