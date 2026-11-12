import { defineComponent, h, type VNode } from 'vue'

export interface LucideProps {
  size?: number | string
  strokeWidth?: number | string
  class?: string
}

function createLucideIcon(name: string, children: () => VNode[]) {
  return defineComponent({
    name,
    props: {
      size: { type: [Number, String], default: 15 },
      strokeWidth: { type: [Number, String], default: 1.5 },
    },
    setup(props, { attrs }) {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: props.size,
            height: props.size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': props.strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'aria-hidden': 'true',
            ...attrs,
          },
          children(),
        )
    },
  })
}

export const Code2 = createLucideIcon('Code2', () => [
  h('polyline', { points: '16 18 22 12 16 6' }),
  h('polyline', { points: '8 6 2 12 8 18' }),
])

export const Terminal = createLucideIcon('Terminal', () => [
  h('polyline', { points: '4 17 10 11 4 5' }),
  h('line', { x1: '12', y1: '19', x2: '20', y2: '19' }),
])

export const FileText = createLucideIcon('FileText', () => [
  h('path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }),
  h('path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }),
  h('path', { d: 'M10 9H8' }),
  h('path', { d: 'M16 13H8' }),
  h('path', { d: 'M16 17H8' }),
])

export const Cpu = createLucideIcon('Cpu', () => [
  h('rect', { width: '16', height: '16', x: '4', y: '4', rx: '2' }),
  h('rect', { width: '6', height: '6', x: '9', y: '9', rx: '1' }),
  h('path', { d: 'M15 2v2' }),
  h('path', { d: 'M15 20v2' }),
  h('path', { d: 'M2 15h2' }),
  h('path', { d: 'M2 9h2' }),
  h('path', { d: 'M20 15h2' }),
  h('path', { d: 'M20 9h2' }),
  h('path', { d: 'M9 2v2' }),
  h('path', { d: 'M9 20v2' }),
])

export const Settings = createLucideIcon('Settings', () => [
  h('path', {
    d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  }),
  h('circle', { cx: '12', cy: '12', r: '3' }),
])

export const Plus = createLucideIcon('Plus', () => [
  h('path', { d: 'M5 12h14' }),
  h('path', { d: 'M12 5v14' }),
])

export const Copy = createLucideIcon('Copy', () => [
  h('rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }),
  h('path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }),
])

export const Download = createLucideIcon('Download', () => [
  h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  h('polyline', { points: '7 10 12 15 17 10' }),
  h('line', { x1: '12', x2: '12', y1: '15', y2: '3' }),
])

export const Trash2 = createLucideIcon('Trash2', () => [
  h('path', { d: 'M3 6h18' }),
  h('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }),
  h('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }),
  h('line', { x1: '10', x2: '10', y1: '11', y2: '17' }),
  h('line', { x1: '14', x2: '14', y1: '11', y2: '17' }),
])

export const Check = createLucideIcon('Check', () => [
  h('path', { d: 'M20 6 9 17l-5-5' }),
])

export const X = createLucideIcon('X', () => [
  h('path', { d: 'M18 6 6 18' }),
  h('path', { d: 'm6 6 12 12' }),
])

export const ArrowRight = createLucideIcon('ArrowRight', () => [
  h('path', { d: 'M5 12h14' }),
  h('path', { d: 'm12 5 7 7-7 7' }),
])

export const RefreshCw = createLucideIcon('RefreshCw', () => [
  h('path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }),
  h('path', { d: 'M21 3v5h-5' }),
  h('path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }),
  h('path', { d: 'M8 16H3v5' }),
])

export const Wand2 = createLucideIcon('Wand2', () => [
  h('path', { d: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z' }),
  h('path', { d: 'm14 7 3 3' }),
  h('path', { d: 'M5 6v4' }),
  h('path', { d: 'M19 14v4' }),
  h('path', { d: 'M10 2v2' }),
  h('path', { d: 'M7 8H3' }),
  h('path', { d: 'M21 16h-4' }),
])

export const Search = createLucideIcon('Search', () => [
  h('circle', { cx: '11', cy: '11', r: '8' }),
  h('path', { d: 'm21 21-4.3-4.3' }),
])

export const Play = createLucideIcon('Play', () => [
  h('polygon', { points: '6 3 20 12 6 21 6 3' }),
])

export const Eye = createLucideIcon('Eye', () => [
  h('path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' }),
  h('circle', { cx: '12', cy: '12', r: '3' }),
])

export const EyeOff = createLucideIcon('EyeOff', () => [
  h('path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' }),
  h('path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }),
  h('path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' }),
  h('path', { d: 'm2 2 20 20' }),
])

export const Save = createLucideIcon('Save', () => [
  h('path', { d: 'M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' }),
  h('path', { d: 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7' }),
  h('path', { d: 'M7 3v4a1 1 0 0 0 1 1h7' }),
])

export const Layers = createLucideIcon('Layers', () => [
  h('path', { d: 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z' }),
  h('path', { d: 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' }),
  h('path', { d: 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' }),
])

export const Database = createLucideIcon('Database', () => [
  h('ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }),
  h('path', { d: 'M3 5V19A9 3 0 0 0 21 19V5' }),
  h('path', { d: 'M3 12A9 3 0 0 0 21 12' }),
])

export const GitCompare = createLucideIcon('GitCompare', () => [
  h('circle', { cx: '18', cy: '18', r: '3' }),
  h('circle', { cx: '6', cy: '6', r: '3' }),
  h('path', { d: 'M13 6h3a2 2 0 0 1 2 2v7' }),
  h('path', { d: 'M11 18H8a2 2 0 0 1-2-2V9' }),
])

export const BookOpen = createLucideIcon('BookOpen', () => [
  h('path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }),
  h('path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }),
])

export const LayoutDashboard = createLucideIcon('LayoutDashboard', () => [
  h('rect', { width: '7', height: '9', x: '3', y: '3', rx: '1' }),
  h('rect', { width: '7', height: '5', x: '14', y: '3', rx: '1' }),
  h('rect', { width: '7', height: '9', x: '14', y: '12', rx: '1' }),
  h('rect', { width: '7', height: '5', x: '3', y: '16', rx: '1' }),
])

export const Globe = createLucideIcon('Globe', () => [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }),
  h('path', { d: 'M2 12h20' }),
])

export const ArrowUp = createLucideIcon('ArrowUp', () => [
  h('path', { d: 'm5 12 7-7 7 7' }),
  h('path', { d: 'M12 19V5' }),
])

export const ArrowDown = createLucideIcon('ArrowDown', () => [
  h('path', { d: 'm19 12-7 7-7-7' }),
  h('path', { d: 'M12 5v14' }),
])

export const Edit3 = createLucideIcon('Edit3', () => [
  h('path', { d: 'M12 20h9' }),
  h('path', { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' }),
])

export const RotateCcw = createLucideIcon('RotateCcw', () => [
  h('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }),
  h('path', { d: 'M3 3v5h5' }),
])

export const MoreHorizontal = createLucideIcon('MoreHorizontal', () => [
  h('circle', { cx: '12', cy: '12', r: '1' }),
  h('circle', { cx: '19', cy: '12', r: '1' }),
  h('circle', { cx: '5', cy: '12', r: '1' }),
])

export const Printer = createLucideIcon('Printer', () => [
  h('path', { d: 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' }),
  h('path', { d: 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6' }),
  h('rect', { x: '6', y: '14', width: '12', height: '8', rx: '1' }),
])

export const History = createLucideIcon('History', () => [
  h('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }),
  h('path', { d: 'M3 3v5h5' }),
  h('path', { d: 'M12 7v5l4 2' }),
])

export const AlertCircle = createLucideIcon('AlertCircle', () => [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('line', { x1: '12', x2: '12', y1: '8', y2: '12' }),
  h('line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }),
])

export const AlertTriangle = createLucideIcon('AlertTriangle', () => [
  h('path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }),
  h('line', { x1: '12', x2: '12', y1: '9', y2: '13' }),
  h('line', { x1: '12', x2: '12.01', y1: '17', y2: '17' }),
])

export const Info = createLucideIcon('Info', () => [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'M12 16v-4' }),
  h('path', { d: 'M12 8h.01' }),
])

export const CheckCircle2 = createLucideIcon('CheckCircle2', () => [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'm9 12 2 2 4-4' }),
])

export const Bot = createLucideIcon('Bot', () => [
  h('path', { d: 'M12 8V4H8' }),
  h('rect', { width: '16', height: '12', x: '4', y: '8', rx: '2' }),
  h('path', { d: 'M2 14h2' }),
  h('path', { d: 'M20 14h2' }),
  h('path', { d: 'M15 13v2' }),
  h('path', { d: 'M9 13v2' }),
])

export const Sparkles = createLucideIcon('Sparkles', () => [
  h('path', {
    d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
  }),
  h('path', { d: 'M5 3v4' }),
  h('path', { d: 'M19 17v4' }),
  h('path', { d: 'M3 5h4' }),
  h('path', { d: 'M17 19h4' }),
])

export const ExternalLink = createLucideIcon('ExternalLink', () => [
  h('path', { d: 'M15 3h6v6' }),
  h('path', { d: 'M10 14 21 3' }),
  h('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
])

export const Bookmark = createLucideIcon('Bookmark', () => [
  h('path', { d: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z' }),
])

export const FolderTree = createLucideIcon('FolderTree', () => [
  h('path', { d: 'M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z' }),
  h('path', { d: 'M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z' }),
  h('path', { d: 'M3 5a2 2 0 0 0 2 2h3' }),
  h('path', { d: 'M3 3v13a2 2 0 0 0 2 2h3' }),
])

export const Grid = createLucideIcon('Grid', () => [
  h('rect', { width: '7', height: '7', x: '3', y: '3', rx: '1' }),
  h('rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }),
  h('rect', { width: '7', height: '7', x: '14', y: '14', rx: '1' }),
  h('rect', { width: '7', height: '7', x: '3', y: '14', rx: '1' }),
])

export const List = createLucideIcon('List', () => [
  h('line', { x1: '8', x2: '21', y1: '6', y2: '6' }),
  h('line', { x1: '8', x2: '21', y1: '12', y2: '12' }),
  h('line', { x1: '8', x2: '21', y1: '18', y2: '18' }),
  h('line', { x1: '3', x2: '3.01', y1: '6', y2: '6' }),
  h('line', { x1: '3', x2: '3.01', y1: '12', y2: '12' }),
  h('line', { x1: '3', x2: '3.01', y1: '18', y2: '18' }),
])

export const Maximize2 = createLucideIcon('Maximize2', () => [
  h('polyline', { points: '15 3 21 3 21 9' }),
  h('polyline', { points: '9 21 3 21 3 15' }),
  h('line', { x1: '21', x2: '14', y1: '3', y2: '10' }),
  h('line', { x1: '3', x2: '10', y1: '21', y2: '14' }),
])

export const Minimize2 = createLucideIcon('Minimize2', () => [
  h('polyline', { points: '4 14 10 14 10 20' }),
  h('polyline', { points: '20 10 14 10 14 4' }),
  h('line', { x1: '14', x2: '21', y1: '10', y2: '3' }),
  h('line', { x1: '3', x2: '10', y1: '21', y2: '14' }),
])

export const ChevronDown = createLucideIcon('ChevronDown', () => [
  h('polyline', { points: '6 9 12 15 18 9' }),
])

export const ChevronRight = createLucideIcon('ChevronRight', () => [
  h('polyline', { points: '9 18 15 12 9 6' }),
])

export const ShieldAlert = createLucideIcon('ShieldAlert', () => [
  h('path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }),
  h('path', { d: 'M12 8v4' }),
  h('path', { d: 'M12 16h.01' }),
])

export const Flame = createLucideIcon('Flame', () => [
  h('path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' }),
])

export const AlertOctagon = createLucideIcon('AlertOctagon', () => [
  h('polygon', { points: '7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2' }),
  h('line', { x1: '12', x2: '12', y1: '8', y2: '12' }),
  h('line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }),
])

export const Zap = createLucideIcon('Zap', () => [
  h('polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }),
])

export const ShieldCheck = createLucideIcon('ShieldCheck', () => [
  h('path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }),
  h('path', { d: 'm9 12 2 2 4-4' }),
])

export const FileCode2 = createLucideIcon('FileCode2', () => [
  h('path', { d: 'M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4' }),
  h('path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }),
  h('path', { d: 'm3 15 2-2-2-2' }),
  h('path', { d: 'm8 11-2 2 2 2' }),
])

export const Boxes = createLucideIcon('Boxes', () => [
  h('path', { d: 'M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z' }),
  h('path', { d: 'm7 16.5-4.74-2.85' }),
  h('path', { d: 'm7 16.5 5-3' }),
  h('path', { d: 'M7 16.5v5.17' }),
  h('path', { d: 'M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z' }),
])

export const UploadCloud = createLucideIcon('UploadCloud', () => [
  h('path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }),
  h('path', { d: 'M12 12v9' }),
  h('path', { d: 'm16 16-4-4-4 4' }),
])




