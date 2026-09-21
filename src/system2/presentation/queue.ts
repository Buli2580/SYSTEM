import type {PresentationEvent} from './events';
export function enqueuePresentation(current:readonly PresentationEvent[],incoming:readonly PresentationEvent[]){const seen=new Set(current.map(x=>x.id));return [...current,...incoming.filter(x=>!seen.has(x.id))].sort((a,b)=>b.priority-a.priority);}
export function dequeuePresentation(queue:readonly PresentationEvent[]){return {current:queue[0]??null,rest:queue.slice(1)};}
