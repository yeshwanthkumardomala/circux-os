export type ProjectMember = { name: string; role: string };
export type ProjectReading = { label: string; value: string; note: string };
export type ProjectMedia = { photos: string[]; documents: { title: string; url: string }[]; videos: { title: string; url: string }[] };
export type ProjectLiveState = { readings: ProjectReading[]; state: 'ready' | 'running' | 'paused' | 'warning' | 'offline'; updatedAt: string };
export type DashboardMetric = { label: string; unit?: string; source?: string; color?: string };
export type ProjectDashboard = { template?: 'cards' | 'gauge' | 'table'; title?: string; metrics?: DashboardMetric[] };
export type ProjectDetail = {
  members: ProjectMember[];
  readings: ProjectReading[];
  documents: string[];
  circuit: string;
  video: string;
  media?: ProjectMedia;
  live?: ProjectLiveState;
};
export type Project = { id: string; name: string; category: string; team: string; status: string; progress: number; summary: string; hidden?: boolean; dataMode?: 'presentation' | 'live'; report?: Record<string, string>; dashboard?: ProjectDashboard; fallback?: { active: boolean; mode?: string; reason?: string; activated_at?: number }; details?: ProjectDetail };

export const defaultProjects: Project[] = [
  { id:'CX-101', name:'BioBots — Interactive Human Anatomy', category:'STEM exhibition', team:'Astra team', status:'In development', progress:78, summary:'An interactive anatomy exhibit with guided learning stations.' },
  { id:'CX-102', name:'GasGuard — Multi-Sensor Gas Monitoring', category:'Environmental safety', team:'Orbit lab', status:'Testing', progress:61, summary:'A demo monitoring station for showing changing air-quality signals.' },
  { id:'CX-103', name:'SonoVision — Ultrasonic Mapping Radar', category:'Robotics', team:'Nova team', status:'Architecture review', progress:46, summary:'A visual mapping project designed for live exhibition viewing.' },
  { id:'CX-104', name:'Aqua Smart Irrigation', category:'Environmental monitoring', team:'Eco club', status:'Planning', progress:29, summary:'A sensor-guided irrigation concept for educational gardens.' },
  { id:'CX-105', name:'Trinity Bots — Environmental Satellite', category:'Research exhibit', team:'Trinity Bots', status:'In development', progress:54, summary:'A CanSat-style educational telemetry and mission showcase.' },
  { id:'CX-106', name:'Autonomous Rover', category:'Robotics', team:'Pathfinders', status:'Testing', progress:72, summary:'A small rover with route planning and demonstration controls.' },
  { id:'CX-107', name:'Smart Greenhouse', category:'IoT showcase', team:'Green lab', status:'Planning', progress:34, summary:'A controlled environment exhibit with simulated readings.' },
  { id:'CX-108', name:'Pipeline Inspection Robot', category:'Robotics', team:'Mechanica', status:'Review', progress:88, summary:'A project report and judging-ready inspection demonstration.' },
];

const emptyDetails: ProjectDetail = { members: [], readings: [], documents: [], circuit: '', video: '', media: { photos: [], documents: [], videos: [] } };

export function getProject(id: string, projects: Project[] = defaultProjects) {
  const project = projects.find(item => item.id === id);
  return project ? { ...project, details: project.details || emptyDetails } : null;
}
