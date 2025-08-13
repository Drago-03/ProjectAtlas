import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DirNode { id:string; name:string; type:'file'|'dir'; parent?:string }
export const DirectoryGraphView: React.FC<{nodes:DirNode[]}> = ({ nodes }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = 300; const nodeRadius = 4;
    // Build hierarchy from parent relationships
    const idToNode: Record<string, DirNode & { children: any[] }> = {};
    nodes.forEach(n => { idToNode[n.id] = { ...n, children: [] }; });
    const roots: any[] = [];
    nodes.forEach(n => { if (n.parent && idToNode[n.parent]) idToNode[n.parent].children.push(idToNode[n.id]); else roots.push(idToNode[n.id]); });
    const treeLayout = d3.tree<any>().nodeSize([14, 70]);
    const rootWrap = { id:'root', name:'root', children: roots } as any;
    const root = d3.hierarchy(rootWrap);
    treeLayout(root);
    const g = svg.append('g').attr('transform','translate(10,10)');
    g.selectAll('path.link').data(root.links()).enter().append('path').attr('class','link').attr('stroke','#888').attr('fill','none').attr('d', d3.linkHorizontal<any, any>().x(d=>d.y).y(d=>d.x));
    const node = g.selectAll('g.node').data(root.descendants()).enter().append('g').attr('transform', d=>`translate(${d.y},${d.x})`);
    node.append('circle').attr('r', nodeRadius).attr('fill', d=> d.children ? '#1976d2':'#555');
    node.append('text').text(d=>d.data.name || d.data.id).attr('dx',6).attr('dy',3).attr('font-size','10px');
  }, [nodes]);
  return <svg ref={ref} width={320} height={400} />;
};

interface WorkflowGraph { nodes:any[]; edges:any[] }
export const WorkflowGraphView: React.FC<{graph:WorkflowGraph}> = ({ graph }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width=300; const height=300;
    const sim = d3.forceSimulation(graph.nodes as any)
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('link', d3.forceLink(graph.edges as any).id((d:any)=>d.id).distance(60));
    const link = svg.append('g').selectAll('line').data(graph.edges).enter().append('line').attr('stroke','#999');
    const node = svg.append('g').selectAll('circle').data(graph.nodes).enter().append('circle').attr('r',6).attr('fill','#ff9800').call(d3.drag<any, any>().on('start', (event,d)=>{ if(!event.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; }).on('drag',(event,d)=>{ d.fx=event.x; d.fy=event.y; }).on('end',(event,d)=>{ if(!event.active) sim.alphaTarget(0); d.fx=null; d.fy=null; }));
    const label = svg.append('g').selectAll('text').data(graph.nodes).enter().append('text').text(d=>d.label||d.id).attr('font-size','10px').attr('dx',8).attr('dy',4);
    sim.on('tick', () => {
      link.attr('x1',(d:any)=> (d.source as any).x).attr('y1',(d:any)=> (d.source as any).y).attr('x2',(d:any)=> (d.target as any).x).attr('y2',(d:any)=> (d.target as any).y);
      node.attr('cx',(d:any)=>d.x).attr('cy',(d:any)=>d.y);
      label.attr('x',(d:any)=>d.x).attr('y',(d:any)=>d.y);
    });
  }, [graph]);
  return <svg ref={ref} width={320} height={320} />;
};
