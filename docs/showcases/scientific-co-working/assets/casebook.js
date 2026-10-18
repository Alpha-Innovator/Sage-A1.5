// Editorial summaries of recorded operations, not invented agent quotations.
const step = (title, text, tool, file) => ({ title, text, tool, file });
export const CASES = [
  {
    id:'t124',slug:'riscv-fpga',short:'RISC-V on FPGA',domain:'HARDWARE / RTL TO BITSTREAM',accent:'#93c9dd',icon:'fpga',
    title:'From logic to a loadable bitstream.',brief:'Implement a PicoRV32 SoC through synthesis, placement, routing and bitstream packaging.',
    scene:'iCE40 / CONFIGURATION MAP',toolchain:'Yosys · nextpnr · IceStorm',
    result:'A complete implementation release candidate.',copy:'The flow meets its timing target and preserves inspectable native implementation artifacts.',
    metrics:[['18.28 MHz','post-route frequency'],['12 MHz','required clock']],artifact:'field_soc.bin',hint:'Explore logic, memory and I/O in the recorded tile map.',
    background:'A PicoRV32 system needs an FPGA implementation using the supplied RTL, boot image and board constraints. The task is to produce a bitstream that meets the required clock target.',
    approach:'The agent uses Yosys, nextpnr and IceStorm to synthesize the design, place and route it, and package the bitstream. It checks timing, resource use and the decoded configuration before preparing the release.',
    deliverables:[
      ['FPGA bitstream','Packaged configuration for the supplied design.'],
      ['Implementation reports','Timing, resource use and structural checks.'],
      ['Release package','Native configuration files and an inventory of the delivered artifacts.']],
    steps:[
      step('Read the RTL','Inspect the core, boot image and board constraints.','Read · Verilog','PicoRV32 + SoC RTL'),
      step('Synthesize the logic','Map the design and initialized memory to iCE40 cells.','Yosys','synthesized netlist'),
      step('Place and route','Implement the design under the supplied clock and pin constraints.','nextpnr-ice40','field_soc.asc'),
      step('Pack and decode','Pack the bitstream and inspect the decoded configuration.','icepack · icebox','decoded configuration'),
      step('Deliver the release','Bundle timing, structural evidence and the release candidate.','Release packaging','release_manifest.json')]
  },
  {
    id:'t101',slug:'chip-eco',short:'Chip design',domain:'EDA / PHYSICAL DESIGN',accent:'#87d9c4',icon:'chip',
    title:'A small change. A working clock tree.',brief:'Carry a clock-gating change through placement, routing and physical checks.',
    scene:'CLOCK-GATING ECO',toolchain:'OpenROAD · OpenSTA · TritonRoute',
    result:'The ECO is ready for handoff.',copy:'Targeted registers join the gated clock tree. The routed design and extracted parasitics can be read back.',
    metrics:[['24 / 24','target registers connected'],['0','routing violations']],artifact:'eco_routed.def',hint:'Switch between the original placement and the routed ECO.',
    background:'A placed chip design requires clock gating for a selected group of capture registers. The change must fit the existing layout and preserve the connections outside the requested modification.',
    approach:'The agent inserts the enable logic and clock gate, then uses OpenROAD to legalize placement, build the clock tree and route the design. Timing and routing checks support the implementation handoff.',
    deliverables:[
      ['Routed layout','The design with the clock-gating change implemented.'],
      ['Extracted parasitics','Interconnect data for timing analysis.'],
      ['Handoff report','Physical checks and a description of the proposed change.']],
    steps:[
      step('Read the design','Inspect the placed design and identify the capture registers.','Read · DEF','baseline_placed.def'),
      step('Insert the ECO','Add the enable logic and clock gate for the requested registers.','Python · ECO','eco_delta.patch'),
      step('Build the clock tree','Legalize the cells, build the clock tree and repair timing.','OpenROAD · CTS','eco_routed.def'),
      step('Route and verify','Route the design, extract parasitics and check timing.','TritonRoute · OpenSTA','timing.rpt'),
      step('Deliver the handoff','Read back the native files and document the merge decision.','DEF + SPEF','handoff_note.md')]
  },
  {
    id:'t093',slug:'aerodynamics',short:'Aerodynamics',domain:'AEROSPACE / CFD',accent:'#95d6e9',icon:'flow',
    title:'Let the flow decide.',brief:'Compare three duct designs across three flight conditions, then freeze the best feasible choice.',
    scene:'K17 / CROSS_12 / STEADY FLOW',toolchain:'SU2 · Python',result:'K17 is selected for its lower peak power.',
    copy:'Two candidates meet the constraints. K17 wins the prescribed comparison on peak electrical power.',
    metrics:[['9','CFD runs'],['K17','selected configuration']],artifact:'design_freeze.toml',hint:'Explore candidate profiles, the native mesh or K17’s flow.',
    background:'Three UAV duct candidates must be compared across three prescribed operating conditions. The task is to select a feasible design while balancing thrust, crossload, pressure recovery and electrical power.',
    approach:'The agent runs the nine CFD cases in SU2 and compares the results against the design constraints. It selects K17 through the prescribed power comparison and packages its mesh, configuration and flow results.',
    deliverables:[
      ['Design selection','The chosen configuration and comparison of candidate performance.'],
      ['Flow results','K17 pressure and velocity fields at the selected condition.'],
      ['Solver package','Mesh, configuration and convergence history.']],
    steps:[
      step('Inspect the candidates','Read the three meshes and the selection requirements.','Read · SU2 mesh','candidate meshes'),
      step('Run the matrix','Run each candidate at all three operating conditions.','SU2_CFD','nine solver runs'),
      step('Compare the trade-offs','Check feasibility and compare the two eligible designs.','Python · analysis','pareto_front.jsonl'),
      step('Tighten and replay','Correct configuration precision and repeat the native checks.','SU2 · replay','history.csv'),
      step('Freeze the design','Deliver K17 and its native evidence at CROSS_12.','Design handoff','design_freeze.toml')]
  },
  {
    id:'t115',slug:'thermal-model',short:'Thermal engineering',domain:'POWER / THERMAL ENGINEERING',accent:'#f0bc83',icon:'thermal',
    title:'Find the bias. Reveal the heat.',brief:'Calibrate a transformer model, reconcile a sensor and validate its thermal response.',
    scene:'TRANSFORMER / TRANSIENT TEMPERATURE',toolchain:'Elmer FEM · Python',
    result:'A calibrated model, checked on held-out data.',copy:'The agent separates fitting from validation, then evaluates eight steady load levels.',
    metrics:[['48','recorded time steps'],['0.055°C','validation RMSE']],artifact:'case.ep',hint:'Scrub through the recorded temperature field.',
    background:'A transformer thermal model must be calibrated against sensor observations over a supplied load cycle. The task combines parameter fitting, sensor-offset estimation and prediction on a separate validation window.',
    approach:'The agent compares thermal-boundary settings with Elmer FEM and estimates the selected sensor offset from calibration data. It then checks the held-out response and evaluates steady temperatures at eight load levels.',
    deliverables:[
      ['Calibrated model','Thermal parameters and the solver configuration.'],
      ['Temperature fields','Recorded fields across the 24-hour load cycle.'],
      ['Load curve','Steady winding hot-spot temperatures for the evaluated loads.']],
    steps:[
      step('Understand the mesh','Locate winding, core, boundaries and sensor positions.','Read · FEM mesh','mesh.elements'),
      step('Fit the model','Compare nine thermal-boundary candidates on calibration data.','ElmerSolver','thermal_parameters.toml'),
      step('Reconcile the sensor','Estimate the selected sensor’s systematic offset.','Python · calibration','sensor_observations.csv'),
      step('Validate the response','Check held-out steps and eight steady load levels.','Elmer · validation','derating_curve.csv'),
      step('Deliver the model','Package the native temperature fields and load curve.','Thermal handoff','case.ep')]
  },
  {
    id:'t188',slug:'emergency-response',short:'Emergency response',domain:'GEOSPATIAL / OPTIMIZATION',accent:'#94bee8',icon:'map',
    title:'A city of roads. A plan that covers it.',brief:'Place emergency resources on a directed road network under three demand scenarios.',
    scene:'SAN FRANCISCO / ROUTE NETWORK',toolchain:'PostGIS · pgRouting · GLPK',
    result:'Three scenarios. Three optimized plans.',copy:'Facilities, units and primary response routes arrive together as inspectable map layers.',
    metrics:[['3','integer-optimal plans'],['84','primary response routes']],artifact:'solution.gpkg',hint:'Choose a scenario to see the deployment change.',
    background:'Emergency facilities and response units must cover demand locations across a directed road network. Three planning scenarios use supplied San Francisco road and facility data with different demand and capacity constraints.',
    approach:'The agent computes travel costs with PostGIS and pgRouting, then solves the facility and unit allocation with GLPK. It reconstructs the primary response routes and checks their direction and travel costs.',
    deliverables:[
      ['Deployment plans','Facility selections and unit allocations for each scenario.'],
      ['Response routes','Map layers connecting facilities to demand locations.'],
      ['Optimization records','Solver results and route validation outputs.']],
    steps:[
      step('Read the city','Load road topology, facilities and demand locations.','PostGIS · GDAL','emergency_network.gpkg'),
      step('Connect the routes','Compute directed travel times between facilities and demand.','pgRouting','route cost matrix'),
      step('Optimize the plan','Allocate facilities and units under the coverage constraints.','GLPK · MIP','solver certificate'),
      step('Check every route','Rebuild route geometry and verify direction and travel cost.','SQL · validation','primary_routes'),
      step('Deliver three plans','Package deployments and routes for all three scenarios.','GeoPackage','three solution.gpkg files')]
  },
  {
    id:'t141',slug:'quantum-compilation',short:'Quantum compilation',domain:'QUANTUM / REPRODUCIBILITY',accent:'#b5adf4',icon:'quantum',
    title:'A compelling claim. Three exceptions.',brief:'Reproduce approximate-compilation results in two frameworks and locate the differences.',
    scene:'25 CELLS / 150 FIELD CHECKS',toolchain:'Qiskit · Cirq',result:'The full claim does not reproduce.',
    copy:'Most fields agree. The audit isolates three discrepancies instead of accepting the claim as a whole.',
    metrics:[['147 / 150','fields reproduced'],['3','discrepancies located']],artifact:'claim_discrepancies.csv',hint:'Select a highlighted mismatch to inspect the exact values.',
    background:'Five two-qubit workloads are evaluated at five approximation settings using a supplied backend calibration. The task is to reproduce the compilation results and compare circuit quality and resource use across frameworks.',
    approach:'The agent compiles the workloads with Qiskit and cross-checks the circuits in Cirq after aligning layout and qubit ordering. It organizes the recorded metrics into a comparison matrix and prepares the accompanying analysis.',
    deliverables:[
      ['Compiled circuits','Native circuit artifacts for the workload combinations.'],
      ['Comparison matrix','Circuit quality and resource metrics across approximation settings.'],
      ['Reproduction report','The compilation procedure and recorded comparison results.']],
    steps:[
      step('Read the claim','Inspect the workloads and frozen backend calibration.','Read · workload','claimed results'),
      step('Compile the cells','Run all twenty-five workload and approximation combinations.','Qiskit','compiled circuits'),
      step('Cross-check the circuits','Reconcile layout and qubit ordering across frameworks.','Cirq · Qiskit','reproduction_matrix.csv'),
      step('Locate the differences','Compare all six fields in every compilation cell.','Field audit','claim_discrepancies.csv'),
      step('Return the verdict','Document the three exceptions and deliver native circuits.','Reproducibility review','reproducibility_verdict.json')]
  },
  {
    id:'t134',slug:'materials-audit',short:'Materials science',domain:'MATERIALS / FIRST PRINCIPLES',accent:'#b4a7ed',icon:'crystal',
    title:'Recalculate. Then challenge the claim.',brief:'Rebuild a carbide defect energy chain and audit the submitted registry record.',
    scene:'CARBIDE / DEFECT ENERGETICS',toolchain:'Quantum ESPRESSO · Python',
    result:'Two claims fail the independent check.',copy:'Native calculations feed an auditable energy chain and a concrete registry verdict.',
    metrics:[['11','native calculations'],['2','inconsistent claims']],artifact:'registry_verdict.json',hint:'Select a defect to compare its two recorded supercell sizes.',
    background:'A carbide study examines silicon vacancies, carbon vacancies and carbon antisites in a supplied crystal structure. The task compares defect energetics across two supercell sizes and a defined set of chemical conditions.',
    approach:'The agent prepares reference and defect calculations in Quantum ESPRESSO and collects the total energies. It derives formation energies, compares the supercell results and organizes the calculations for review.',
    deliverables:[
      ['Calculation package','Input decks and native solver logs.'],
      ['Energy ledger','Reference and defect energies from the eleven calculations.'],
      ['Formation-energy curves','Defect comparisons across chemical conditions and supercell sizes.']],
    steps:[
      step('Inspect the crystal','Read the frozen host structure and defect protocol.','Read · structure','defect_protocol.json'),
      step('Build the calculations','Prepare reference states and defect supercells.','Python · QE decks','native input decks'),
      step('Recompute the energies','Run the eleven native first-principles calculations.','pw.x','energy_ledger.tsv'),
      step('Compare the claims','Rebuild thermodynamics and evaluate the registry gates.','Python · audit','defect_thermodynamics.json'),
      step('Publish the verdict','Identify inconsistent formation and survivor claims.','Registry review','registry_verdict.json')]
  },
  {
    id:'t026',slug:'financial-data',short:'Financial data',domain:'FINANCE / DATA ENGINEERING',accent:'#9cd4b3',icon:'data',
    title:'Every financial fact needs a reason.',brief:'Resolve regulatory-data requests and publish matching, rebuildable audit warehouses.',
    scene:'SEC COMPANYFACTS / PUBLICATION FLOW',toolchain:'SQLite · DuckDB · dbt',
    result:'Eighteen requests. Every one accounted for.',copy:'Selected facts and rejected requests form a reconciled publication, checked in two database engines.',
    metrics:[['15 + 3','selected + rejected'],['2','database engines']],artifact:'warehouse.duckdb',hint:'Select a request to follow its publication decision.',
    background:'Eighteen financial-data requests must be resolved from a supplied SEC Companyfacts snapshot for one issuer. The task applies filing rules and concept precedence, then publishes consistent results in two database engines.',
    approach:'The agent evaluates eligible facts, records the publication decision for each request and builds SQLite and DuckDB warehouses. It runs the dbt project and reconciles the selected facts with the remaining requests.',
    deliverables:[
      ['Matching warehouses','Selected facts and request decisions in both databases.'],
      ['dbt project','Models and checks for rebuilding the publication.'],
      ['Reconciliation report','An accounting of all eighteen requests.']],
    steps:[
      step('Read the filing rules','Inspect requests, the metric dictionary and filing states.','Read · SEC snapshot','publication contract'),
      step('Resolve each request','Apply eligibility rules and concept precedence.','Python · resolution','selected / rejected rows'),
      step('Build both warehouses','Publish matching relations in SQLite and DuckDB.','SQLite · DuckDB','two warehouses'),
      step('Rebuild and reconcile','Run the dbt project and verify request accounting.','dbt build','dbt_run_results.json'),
      step('Deliver the publication','Package the databases and auditable build artifacts.','Publication handoff','reconciliation.json')]
  },
  {
    id:'t030',slug:'dns-forensics',short:'DNS forensics',domain:'SECURITY / DIGITAL FORENSICS',accent:'#91d8cc',icon:'packets',
    title:'Two partial views. One recovered payload.',brief:'Reconstruct a DNS transfer from overlapping probes, retries and incomplete observations.',
    scene:'DUAL-PROBE / TRANSFER RECONSTRUCTION',toolchain:'TShark · Python',
    result:'The reportable transfer is reconstructed.',copy:'Twenty-four accepted fragments recover the payload, with source-preserved packet evidence.',
    metrics:[['24','accepted fragments'],['1','reportable session']],artifact:'packet_lineage.tsv',hint:'Switch from probe observations to ordered payload fragments.',
    background:'Two packet captures provide overlapping views of a DNS transfer, with retries and incomplete observations. The task is to identify the relevant session and recover its payload from the supplied traffic.',
    approach:'The agent uses TShark to extract DNS records, aligns probe timestamps and applies the session-selection rules. It orders the accepted fragments, decodes the payload and records the source packets used in the reconstruction.',
    deliverables:[
      ['Recovered payload','The decoded content of the selected transfer.'],
      ['Transaction timeline','DNS observations aligned across both probes.'],
      ['Packet lineage','Records linking the reconstruction to its source captures.']],
    steps:[
      step('Inspect both probes','Read protocol fields and compare the two capture points.','TShark','two PCAP captures'),
      step('Align observations','Apply the clock model and pair DNS transactions.','Python · time alignment','dns_transactions.tsv'),
      step('Filter the candidates','Apply integrity and incident-policy checks.','Policy · integrity','candidate_sessions.tsv'),
      step('Reassemble the payload','Order the twenty-four accepted data fragments.','Decode · reassemble','payload.json'),
      step('Deliver the evidence','Preserve source packets and record the transfer lineage.','Forensic handoff','packet_lineage.tsv')]
  },
  {
    id:'t100',slug:'document-security',short:'Document security',domain:'DOCUMENT / SECURITY',accent:'#d0b6ef',icon:'document',
    title:'Privacy beneath the surface.',brief:'Remove sensitive content from PDF objects and produce a sanitized public release.',
    scene:'OBJECT-LEVEL PDF REDACTION',toolchain:'MuPDF · Python',result:'A clean public document.',
    copy:'The release is rewritten as one revision, with an object inventory and a redaction record.',
    metrics:[['14','redaction targets'],['1','released PDF revision']],artifact:'public_release.pdf',hint:'Switch between the released page and the object cleanup.',
    background:'A supplied PDF must be prepared for public release under a redaction policy. The task covers sensitive page content and information stored in forms, attachments and metadata, while preserving the required document content.',
    approach:'The agent uses MuPDF to apply object-level redactions, remove hidden containers and rewrite the document. It renders the release and checks the rewritten file for the specified sensitive content.',
    deliverables:[
      ['Public PDF','The rewritten document prepared for release.'],
      ['Redaction record','The policy targets and their recorded treatment.'],
      ['Object inventory','The structure of the released PDF for inspection.']],
    steps:[
      step('Inspect the structure','Locate policy targets and document containers.','MuPDF · inspection','redaction_policy.json'),
      step('Apply the redactions','Remove covered content with object-level redaction.','MuPDF · Redact','public_release.pdf'),
      step('Clear hidden containers','Remove forms, attachments and metadata containers.','MuPDF · cleanup','object_inventory.tsv'),
      step('Rewrite and check','Rewrite the PDF and scan for recoverable sensitive content.','GC · sanitize','privacy_certificate.txt'),
      step('Package the evidence','Deliver the release, object inventory and redaction map.','Render · CBOR','redaction_map.cbor')]
  }
];
