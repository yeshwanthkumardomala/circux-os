export type ProjectMember = { name: string; role: string };
export type ProjectReading = { label: string; value: string; note: string };
export type ProjectMedia = { photos: string[]; documents: { title: string; url: string }[]; videos: { title: string; url: string }[] };
export type ProjectLiveState = { readings: ProjectReading[]; state: 'ready' | 'running' | 'paused' | 'warning' | 'offline'; updatedAt: string };
export type ProjectDetail = {
  members: ProjectMember[];
  readings: ProjectReading[];
  documents: string[];
  circuit: string;
  video: string;
  media?: ProjectMedia;
  live?: ProjectLiveState;
};
export type Project = { id: string; name: string; category: string; team: string; status: string; progress: number; summary: string; dataMode?: 'presentation' | 'live'; details?: ProjectDetail };

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

const sampleDetails: ProjectDetail = {
  members: [{ name: 'Aarav Mehta', role: 'Hardware lead' }, { name: 'Diya Rao', role: 'Software and presentation' }, { name: 'Kabir Singh', role: 'Testing and documentation' }],
  readings: [{ label: 'Soil moisture', value: '64%', note: 'Illustrative FC-28 reading' }, { label: 'Temperature', value: '27.4°C', note: 'Illustrative DHT11 reading' }, { label: 'Pump state', value: 'Ready', note: 'No physical relay connected' }],
  documents: ['Project abstract', 'System architecture', 'Testing evidence', 'Safety and limitations'],
  circuit: 'Arduino Uno → FC-28 soil sensor → control logic → relay module → pump. This diagram is a presentation sample and must be checked before wiring.',
  video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  media: {
    photos: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&q=80', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80'],
    documents: [{ title: 'Project abstract', url: '#' }, { title: 'System architecture', url: '#' }, { title: 'Safety and limitations', url: '#' }],
    videos: [{ title: 'Development walkthrough', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
  },
};

export function getProject(id: string, projects: Project[] = defaultProjects) {
  const project = projects.find(item => item.id === id);
  return project ? { ...project, details: project.details || sampleDetails } : null;
}
