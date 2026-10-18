// Text equivalents of the selected native-data view, also readable on small screens.
export function readout(data, state) {
  const index = state.index || 0;
  switch (data.task) {
    case 't188': {
      const scenario = data.scenarios[index];
      return [['Scenario', ['EMS peak', 'Fire + rescue', 'All-hazards surge'][index]],
        ['Deployment', `${scenario.facilities.length} facilities · ${scenario.units} units`],
        ['Primary routes', String(scenario.routes.length)]];
    }
    case 't101': {
      const placed = state.mode === 'placed';
      return [['Native design', placed ? 'Original placement' : state.mode === 'clock' ? 'ECO clock tree' : 'Routed ECO'],
        ['Recorded instances', String(placed ? data.before.length : data.after.length)],
        ['Target registers', placed ? 'Before clock-gating ECO' : `${data.after.filter(cell => cell.target).length} connected`]];
    }
    case 't093': {
      const selected = data.pareto.find(row => row.candidate_id === 'K17');
      return [['Selected design', 'K17'], ['Feasible candidates', data.pareto.filter(row => row.feasible).map(row => row.candidate_id).join(' + ')],
        ['K17 peak power', `${selected.maximum_electrical_power_w.toFixed(2)} W`]];
    }
    case 't100':
      return [['View', state.mode === 'objects' ? 'Object cleanup schematic' : 'Released PDF page'],
        ['Policy targets', String(data.boxes.length)], ['Live objects', String(data.objects)]];
    case 't134': {
      const key = ['vac_si', 'vac_c', 'anti_csi'][index];
      return [['Selected defect', ['Silicon vacancy', 'Carbon vacancy', 'Carbon antisite'][index]],
        ['Supercell size drift', `${data.thermo.size_drift_ev[key].toFixed(6)} eV`],
        ['Inconsistent claims', String(data.failed.length)]];
    }
    case 't115': {
      const frame = data.frames[index];
      return [['Recorded time', `${(frame.seconds / 3600).toFixed(1)} h · ${index < 32 ? 'calibration' : 'held-out'}`],
        ['Peak field temperature', `${Math.max(...frame.values).toFixed(2)} °C`], ['Fixed color scale', '22–48 °C']];
    }
    case 't124': {
      const timing = Object.values(data.fmax)[0];
      return [['Tile view', {all:'All resources',logic:'Logic',memory:'Memory',io:'I/O'}[state.mode] || 'All resources'],
        ['Post-route frequency', `${timing.achieved.toFixed(2)} MHz`], ['Required clock', '12 MHz']];
    }
    case 't141': {
      const field = data.fields.filter(row => row.within_tolerance === 'false')[index];
      return [['Selected discrepancy', `${field.workload_id.replaceAll('_', ' ')} / ${field.approximation_id} / ${field.field.replaceAll('_', ' ')}`],
        ['Claimed value', field.claimed_value], ['Reproduced value', field.reproduced_value]];
    }
    case 't026': {
      const row = data.requests[index];
      return [['Selected request', `${row.id} · ${row.metric.replaceAll('_', ' ')}`],
        ['Publication decision', row.accepted ? 'Selected' : 'Rejected'],
        [row.accepted ? 'Unit' : 'Reason', row.accepted ? row.unit : row.reason || 'Outside the publication contract']];
    }
    case 't030':
      return [['View', state.mode === 'fragments' ? 'Ordered payload fragments' : 'Corrected probe observations'],
        ['Accepted fragments', String(data.transactions.filter(row => row.status === 'accepted').length)],
        ['Recorded packet rows', String(data.packets.length)]];
    default: return [];
  }
}
